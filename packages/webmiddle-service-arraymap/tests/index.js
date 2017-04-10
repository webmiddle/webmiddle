import test from 'ava';
import ArrayMap from '../src/index.js';
import WebMiddle, { evaluate, createContext } from 'webmiddle';

function range(num) {
  return [...Array(num).keys()];
}

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('main', async t => {
  const output = await evaluate(createContext(t.context.webmiddle),
    <ArrayMap
      name="resources"
      array={[1, 2]}
      callback={(num, index) => ({
        name: `resource ${index}`,
        contentType: 'text/plain',
        content: `${num} ${index}`,
      })}
    />
  );

  t.is(output.name, 'resources', 'name');
  t.is(output.contentType, 'application/json', 'contentType');
  t.deepEqual(output.content, [
    {
      name: 'resource 0',
      contentType: 'text/plain',
      content: '1 0',
    },
    {
      name: 'resource 1',
      contentType: 'text/plain',
      content: '2 1',
    },
  ], 'content');
});

test('expect resource', async t => {
  const Service = () => 10; // a service that doesn't return a resource

  try {
    await evaluate(createContext(t.context.webmiddle),
      <ArrayMap
        name="whatever"
        array={[0]}
        callback={() => <Service />}
      />
    );
    t.fail('expected rejection');
  } catch (e) {
    t.pass();
  }
});

test('limit', async t => {
  const limit = 10;
  let current = 0;
  let overLimit = false;

  const Service = () => {
    current++;
    //console.log('exec', current);
    if (current > limit) {
      overLimit = true;
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        current--;
        //console.log('done', current);
        resolve({
          name: 'whatever',
          contentType: 'text/plain',
          content: 'whatever',
        });
      }, 100);
    });
  };

  current = 0;
  overLimit = false;
  await evaluate(createContext(t.context.webmiddle),
    <ArrayMap
      name="resources"
      array={range(100)}
      callback={num => (
        <Service name={num} />
      )}
      limit={limit}
    />
  );

  t.is(overLimit, false, 'with limit');

  current = 0;
  overLimit = false;
  await evaluate(createContext(t.context.webmiddle),
    <ArrayMap
      name="resources"
      array={range(100)}
      callback={num => (
        <Service name={num} />
      )}
      limit={0}
    />
  );

  t.is(overLimit, true, 'without limit');
});
