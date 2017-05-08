import test from 'ava';
import WebMiddle, { evaluate, createContext } from 'webmiddle';
import Server from 'webmiddle-server';
import webmiddleClient from '../../src';

function flatten(array) {
  const result = [];
  array.forEach(item => {
    item = Array.isArray(item) ? item : [item];
    result.push(...item);
  });
  return result;
}

function paths(obj, parentKey) {
  if (typeof obj !== 'object' || obj === null) return [parentKey];
  return flatten(Object.keys(obj).map(key =>
    paths(obj[key], key).map(subPath =>
      (parentKey ? `${parentKey}.` : '') + subPath
    )
  ));
}

export default function run(protocol) {
  // NOTE: make sure this is not the same port used in webmiddle-server tests
  // (and in any other test that starts webmiddle-server)
  const PORT = 4000 + (protocol === 'ws' ? 1 : 0);

  const webmiddle = new WebMiddle({
    services: {
      math: {
        sum: ({ a, b }) => ({
          name: 'result',
          contentType: 'text/plain',
          // without Number() a + b would be a string concatenation in GET requests!
          content: String(Number(a) + Number(b)),
        }),

        multiply: ({ a, b }) => ({
          name: 'result',
          contentType: 'text/plain',
          content: String(Number(a) * Number(b)),
        }),

        divide: ({ a, b }) => ({
          name: 'result',
          contentType: 'text/plain',
          content: String(Number(a) / Number(b)),
        }),
      },
      returnOption: ({ optionName }, context) => context.options[optionName],
    },
    settings: {
      foo: {
        some: 'bar',
        other: 100,
      },
    },
  });

  const server = new Server(webmiddle, { port: PORT });
  server.start();


  test.beforeEach(async t => {
    t.context.webmiddleRemote = await webmiddleClient({
      protocol,
      hostname: 'localhost',
      port: PORT,
    });
  });

  test('retrieved service paths', async t => {
    t.deepEqual(
      paths(t.context.webmiddleRemote.services),
      ['math.sum', 'math.multiply', 'math.divide', 'returnOption']
    );
  });

  /*
  test('retrieved setting paths', async t => {

  });*/

  test('execute remote service at deep path', async t => {
    const Sum = t.context.webmiddleRemote.service('math.sum');

    const resource = await evaluate(createContext(t.context.webmiddleRemote, {
      retries: 2
    }),
      <Sum
        a={10}
        b={20}
      />
    );
    t.is(resource.contentType, 'text/plain');
    t.is(resource.content, '30');
  });

  test('execute remote service with options', async t => {
    const ReturnOption = t.context.webmiddleRemote.service('returnOption');

    const resource = await evaluate(createContext(t.context.webmiddleRemote, {
      retries: 2,
      whatever: 'you got it!'
    }),
      <ReturnOption
        optionName="whatever"
      />
    );

    t.is(resource.contentType, 'x-webmiddle-any');
    t.is(resource.content, 'you got it!');
  });

  /*
  test('get remote setting', async t => {

  });*/
}
