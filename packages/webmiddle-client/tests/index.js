import test from 'ava';
import webmiddleClient from '../src';
import WebMiddle, { evaluate, createContext } from 'webmiddle';
import Server from 'webmiddle-server';

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

// NOTE: make sure this is not the same port used in webmiddle-server tests
const PORT = 4000;

const webmiddle = new WebMiddle({
  services: {
    math: {
      sum: ({ a, b }) => ({
        name: 'result',
        contentType: 'text/plain',
        content: String(Number(a) + Number(b)), // without Number() a + b would be a string concatenation in GET requests!
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
  t.context.webmiddleRemote = await webmiddleClient('http://localhost:' + PORT);
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