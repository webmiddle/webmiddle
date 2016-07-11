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
  const Service = async ({ children, webmiddle, ...args }) => ({
    args,
    children,
    webmiddle,
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
  const Service = async () => ({
    name: 'some',
    contentType: 'text/html',
    content: '<div></div>',
  });
  const virtual = (
    <Service name="rawtext" contentType="text/plain" />
  );

  const output = await t.context.webmiddle.callVirtual(virtual);
  const resource = output.result;
  t.is(resource.name, 'rawtext', 'name');
  t.is(resource.contentType, 'text/plain', 'contentType');
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
