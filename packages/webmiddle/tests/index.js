import test from 'ava';
import WebMiddle, {
  isResource, isVirtual, callVirtual, evaluate, createContext, WithOptions,
} from '../src/index.js';

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('h -> isVirtual', t => {
  t.true(isVirtual((
    <some foo="bar">
      <other />
    </some>
  )));
});

test('isVirtual -> true', t => {
  t.true(isVirtual({
    type: 'element',
    attributes: {},
    children: [],
  }));
});

test('isResource -> true', t => {
  t.true(isResource({
    name: 'some',
    contentType: 'text/html',
    content: '<div></div>',
  }));
});

test('callVirtual: when type is not a function', async t => {
  const virtual = <element />;
  const output = await callVirtual(createContext(t.context.webmiddle), virtual);
  t.is(output.result, virtual, 'result');
  t.is(output.context.webmiddle, t.context.webmiddle, 'webmiddle');
});

test('callVirtual: service must be called correctly', async t => {
  const Service = async ({ children, ...args }, context) => ({
    args,
    children,
    context,
  });
  const virtual = (
    <Service foo="bar">
      <element />
    </Service>
  );

  const output = await callVirtual(createContext(t.context.webmiddle), virtual);
  t.deepEqual(output.result.args, {
    foo: 'bar',
  }, 'attributes');

  t.is(output.result.children[0].type, 'element', 'children');

  t.is(output.context.webmiddle, t.context.webmiddle, 'webmiddle');
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

  const output = await evaluate(createContext(t.context.webmiddle),
    <TopService name="other" />
  );

  t.is(output.name, 'other', 'name');
  t.is(output.contentType, 'text/plain', 'contentType');
  t.is(output.content, '<div></div>', 'content');
});

test('registerService', t => {
  const Service = () => {};
  t.context.webmiddle.registerService('foo', Service);
  t.is(typeof t.context.webmiddle.service('foo'), 'function');
  t.is(typeof t.context.webmiddle.service('bar'), 'undefined');
});

test('registerService: must only accept functions', t => {
  t.throws(() => {
    t.context.webmiddle.registerService('foo', { foo: 'bar' });
  });
});

test('registerService: must support deep paths', t => {
  t.context.webmiddle.registerService('some.foo', () => {});
  t.is(typeof t.context.webmiddle.service('some').foo, 'function');
});

test('services: with parent and constructor options', t => {
  const Service = () => {};
  const webmiddle = new WebMiddle({
    parent: new WebMiddle({
      services: {
        foo: () => <Service />,
      },
    }),
  });

  t.is(typeof webmiddle.service('foo'), 'function');
  t.is(typeof webmiddle.service('bar'), 'undefined');
});

test('services: deep object', t => {
  const webmiddle = new WebMiddle({
    services: {
      math: {
        divide: ({ a, b }) => a / b,
      },
    },
  });

  t.is(typeof webmiddle.service('math.divide'), 'function');
});

test('services: must only accept functions as leafs', t => {
  t.throws(() => {
    new WebMiddle({
      services: {
        math: {
          divide: 'FAKE',
        },
      },
    });
  });
});

test('services: must return an object of services when path is broad', t => {
  const webmiddle = new WebMiddle({
    services: {
      math: {
        divide: ({ a, b }) => a / b,
        multiply: ({ a, b }) => a * b,
      },
    },
  });

  const services = webmiddle.service('math');
  t.truthy(Object.keys(services).length === 2 && services.divide && services.multiply);
});

test('services: must return undefined when requesting one that does not exist', t => {
  const webmiddle = new WebMiddle({
    services: {
      math: {
        divide: ({ a, b }) => a / b,
        multiply: ({ a, b }) => a * b,
      },
    },
  });

  const service = webmiddle.service('math.random');
  t.is(typeof service, 'undefined');
});

test('services: must throw when passing a virtual instead of a function (common error)', t => {
  const Service = () => {};
  t.throws(() => new WebMiddle({
    services: {
      foo: <Service />,
    },
  }));
});

test('evaluate: NaN', async t => {
  // regression test: NaN result should not cause infinite loop
  await evaluate(createContext(t.context.webmiddle), NaN);
  t.pass();
});

test('evaluate: function', async t => {
  const output = await evaluate(createContext(t.context.webmiddle, {
    functionParameters: [3],
  }),
    num => num * 2
  );
  t.is(output, 6);
});

test('evaluate: promise', async t => {
  const output = await evaluate(createContext(t.context.webmiddle), Promise.resolve(10));
  t.is(output, 10);

  try {
    await evaluate(createContext(t.context.webmiddle), Promise.reject());
    t.fail('expected rejection');
  } catch (e) {
    t.pass();
  }
});

test('evaluate: virtual', async t => {
  const Service = ({ num }) => num * 2;
  const output = await evaluate(createContext(t.context.webmiddle), (
    <Service num={6} />
  ));
  t.is(output, 12);
});

test('evaluate: expectResource', async t => {
  try {
    await evaluate(createContext(t.context.webmiddle, {
      expectResource: true,
    }),
      () => 3
    );
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
  const Service = (props, context) => {
    return context.webmiddle.setting('name');
  };
  Service.webmiddle = new WebMiddle();

  const webmiddle = new WebMiddle({
    settings: {
      name: 'temp parent',
    },
  });

  const output = await evaluate(createContext(webmiddle),
    <Service />
  );

  t.is(output, 'temp parent');
  t.is(Service.webmiddle.parent, undefined);
});

[0, 1, 2, 3].forEach(n =>
  test(`retries ${n}`, async (t) => {
    let tries = 0;
    const Service = () => {
      tries++;
      return Promise.reject(`retries service always fails.`);
    };

    const retries = n;
    try {
      await evaluate(createContext(t.context.webmiddle, { retries }), <Service />);
    } catch (err) {
      // no-op: the service is going to fail, we're good with that
    }

    t.is(tries, retries + 1);
  }));

test('service options (WithOptions)', async t => {
  const Service = (props, context) => {
    return context.options.otherOption + ' ' +
           context.options.myCustomOption + ' ' +
           context.options.anotherOption;
  };
  Service.options = {
    otherOption: 'some',
    myCustomOption: 'foo',
  };

  const context = createContext(t.context.webmiddle, {
    otherOption: 'bar',
    anotherOption: 'again',
  });
  const output = await evaluate(context, (
    <WithOptions myCustomOption="fun" anotherOption="forever">
      <Service />
    </WithOptions>
  ));

  t.is(output, 'some foo forever');
});

test('service options: as a function', async t => {
  const Service = (props, context) => {
    return context.options.otherOption + ' ' +
           context.options.myCustomOption + ' ' +
           context.options.anotherOption;
  };
  Service.options = ({ attr }, context) => ({
    otherOption: attr,
    myCustomOption: context.options.otherOption,
  });

  const output = await evaluate(createContext(t.context.webmiddle, {
    otherOption: 'bar',
    anotherOption: 'again',
  }), <Service attr="more" />);

  t.is(output, 'more bar again');
});

test('catch (createContext from context)', async t => {
  const SuccessService = () => 10;

  const ThrowService = () => {
    return Promise.reject('this service always fails (to test catch)');
  };
  const Service = () => <ThrowService />;

  const context = createContext(t.context.webmiddle);
  const output = await evaluate(createContext(context, {
    catch: err => <SuccessService />,
  }), <Service />);

  t.is(output, 10, 'exception handler is passed down the service call chain');
});

test('must throw when there is no catch', async t => {
  const Service = () => {
    throw new Error('expected throw');
  };

  await t.throws(evaluate(createContext(t.context.webmiddle), <Service />));
});
