import test from 'ava';
import WebMiddle from '../src/index.js';

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('h -> isVirtual', t => {
  t.true(t.context.webmiddle.isVirtual((
    <some foo="bar">
      <other />
    </some>
  )));
});

test('isVirtual -> true', t => {
  t.true(t.context.webmiddle.isVirtual({
    type: 'element',
    attributes: {},
    children: [],
  }));
});

test('isResource -> true', t => {
  t.true(t.context.webmiddle.isResource({
    name: 'some',
    contentType: 'text/html',
    content: '<div></div>',
  }));
});

test('callVirtual: when type is not a function', async t => {
  const virtual = <element />;
  const output = await t.context.webmiddle.callVirtual(virtual);
  t.is(output.result, virtual, 'result');
  t.is(output.webmiddle, t.context.webmiddle, 'webmiddle');
});

test('callVirtual: service must be called correctly', async t => {
  const Service = async ({ children, webmiddle, options, ...args }) => ({
    args,
    children,
    webmiddle,
    options,
  });
  const virtual = (
    <Service foo="bar">
      <element />
    </Service>
  );

  const output = await t.context.webmiddle.callVirtual(virtual);
  t.deepEqual(output.result.args, {
    foo: 'bar',
  }, 'attributes');

  t.is(output.result.children[0].type, 'element', 'children');

  t.is(output.webmiddle, t.context.webmiddle, 'webmiddle');
});

test('callVirtual: resource overrides', async t => {
  // bottom to parent
  const Service = async () => ({
    name: 'some',
    contentType: 'text/html',
    content: '<div></div>',
  });
  const TopService = () => (
    <Service name="rawtext" contentType="text/plain" />
  );

  const output = await t.context.webmiddle.evaluate(
    <TopService name="other" />
  );

  t.is(output.name, 'other', 'name');
  t.is(output.contentType, 'text/plain', 'contentType');
  t.is(output.content, '<div></div>', 'content');
});

test('registerService', t => {
  const Service = () => {};
  t.context.webmiddle.registerService('foo', <Service />);
  t.truthy(t.context.webmiddle.services['foo']);
  t.falsy(t.context.webmiddle.services['bar']);
});

test('service', t => {
  const Service = () => {};
  t.context.webmiddle.registerService('foo', <Service />);
  t.truthy(t.context.webmiddle.service('foo'));
  t.falsy(t.context.webmiddle.service('bar'));
});

test('service: with parent and constructor options', t => {
  const Service = () => {};
  const webmiddle = new WebMiddle({
    parent: new WebMiddle({
      services: {
        foo: <Service />,
      },
    }),
  });

  t.truthy(webmiddle.service('foo'));
  t.falsy(webmiddle.service('bar'));
});

test('evaluate: NaN', async t => {
  // regression test: NaN result should not cause infinite loop
  await t.context.webmiddle.evaluate(NaN);
  t.pass();
});

test('evaluate: function', async t => {
  const output = await t.context.webmiddle.evaluate(num => num * 2, {
    functionParameters: [3],
  });
  t.is(output, 6);
});

test('evaluate: promise', async t => {
  const output = await t.context.webmiddle.evaluate(Promise.resolve(10));
  t.is(output, 10);

  try {
    await t.context.webmiddle.evaluate(Promise.reject());
    t.fail('expected rejection');
  } catch (e) {
    t.pass();
  }
});

test('evaluate: virtual', async t => {
  const Service = ({ num }) => num * 2;
  const output = await t.context.webmiddle.evaluate((
    <Service num={6} />
  ));
  t.is(output, 12);
});

test('evaluate: expectResource', async t => {
  try {
    await t.context.webmiddle.evaluate(() => 3, {
      expectResource: true,
    });
    t.fail('expected rejection');
  } catch (e) {
    t.pass();
  }
});

test('settings', async t => {
  t.context.webmiddle.settings = {
    foo: 'bar',
    obj: {
      test: 'fun',
    },
  };

  t.is(t.context.webmiddle.setting('not existing'), undefined, 'not existing');

  t.is(t.context.webmiddle.setting('foo'), 'bar', 'simple value');

  t.is(t.context.webmiddle.setting('obj.test'), 'fun', 'path');

  const obj = t.context.webmiddle.setting('obj');
  t.deepEqual(obj, {
    test: 'fun',
  }, 'object');

  obj.test = 'not fun';
  t.deepEqual(t.context.webmiddle.setting('obj'), {
    test: 'fun',
  }, 'deep clone');
});

test('settings: with parent', async t => {
  const parentWebmiddle = new WebMiddle({
    settings: {
      obj: {
        test: 'not fun',
        debug: 'fun',
        other: 'whatever',
      },
      arr: ['a', 'b', 'c'],
    },
  });

  const webmiddle = new WebMiddle({
    parent: parentWebmiddle,
    settings: {
      obj: {
        test: 'fun',
        debug: 'not fun',
      },
      arr: ['d', 'e', 'f'],
    },
  });

  t.deepEqual(webmiddle.setting('obj'), {
    test: 'fun',
    debug: 'not fun',
    other: 'whatever',
  });

  t.is(webmiddle.setting('obj.other'), 'whatever', 'path');

  t.deepEqual(webmiddle.setting('arr'), [
    'd', 'e', 'f',
  ], 'don\'t merge not plain objects (e.g. arrays)');
});

test('temp parent', async t => {
  const Service = ({ webmiddle }) => {
    return webmiddle.setting('name');
  };
  Service.webmiddle = new WebMiddle();

  const webmiddle = new WebMiddle({
    settings: {
      name: 'temp parent',
    },
  });

  const output = await webmiddle.evaluate(
    <Service />
  );

  t.is(output, 'temp parent');
  t.is(Service.webmiddle.parent, undefined);
});

test('retries', async t => {
  let tries = 0;
  const Service = ({ options }) => {
    tries++;
    return Promise.reject(`retries service always fails: ${options.retries}`);
  };

  const retries = Math.floor(Math.random() * 3) + 0;
  try {
    await t.context.webmiddle.evaluate(<Service />, { retries });
  } catch (err) {
    // no-op: the service is going to fail, we're good with that
  }

  t.is(tries, retries + 1);
});

test('service options', async t => {
  const Service = ({ options }) => {
    return options.otherOption + ' ' +
           options.myCustomOption + ' ' +
           options.anotherOption;
  };
  Service.options = {
    otherOption: 'some',
    myCustomOption: 'foo',
  };

  const output = await t.context.webmiddle.evaluate(<Service />, {
    otherOption: 'bar',
    anotherOption: 'again',
  });

  t.is(output, 'some foo again');
});

test('service options: as a function', async t => {
  const Service = ({ options }) => {
    return options.otherOption + ' ' +
           options.myCustomOption + ' ' +
           options.anotherOption;
  };
  Service.options = ({ attr, options }) => ({
    otherOption: attr,
    myCustomOption: options.otherOption,
  });

  const output = await t.context.webmiddle.evaluate(<Service attr="more" />, {
    otherOption: 'bar',
    anotherOption: 'again',
  });

  t.is(output, 'more bar again');
});

