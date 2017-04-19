import test from 'ava';
import Server from '../src';
import WebMiddle from 'webmiddle';
import superagent from 'superagent';

function requestServer(method, url, data = {}) {
  return new Promise((resolve, reject) => {
    superagent[method.toLowerCase()](url)
      .send(data)
      .end((err, res) => {
        if (err) reject(err);
        resolve(res.body);
      });
  });
}

const PORT = 3000;

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

test('Execute service via GET', async t => {
  const resource = await requestServer('GET', 'http://localhost:' + PORT + '/services/math/sum?a=5&b=10');
  t.deepEqual(resource, {
    name: 'result',
    contentType: 'text/plain',
    content: '15',
  });
});

test('Execute service via POST', async t => {
  const resource = await requestServer('POST', 'http://localhost:' + PORT + '/services/math/multiply', {
    props: {
      a: 20,
      b: 5,
    }
  });
  t.deepEqual(resource, {
    name: 'result',
    contentType: 'text/plain',
    content: '100',
  });
});

test('Pass context options to service via POST', async t => {
  const resource = await requestServer('POST', 'http://localhost:' + PORT + '/services/returnOption', {
    props: {
      optionName: 'custom'
    },
    options: {
      custom: 5
    },
  });
  t.is(resource.contentType, 'x-webmiddle-any');
  t.is(resource.content, 5);
});

test('Read setting via GET', async t => {
  const resource = await requestServer('GET', 'http://localhost:' + PORT + '/settings/foo/other');
  t.is(resource.contentType, 'x-webmiddle-any');
  t.is(resource.content, 100);
});

test('Read setting via POST', async t => {
  const resource = await requestServer('GET', 'http://localhost:' + PORT + '/settings/foo/other');
  t.is(resource.contentType, 'x-webmiddle-any');
  t.is(resource.content, 100);
});

test('Get service paths', async t => {
  const resource = await requestServer('GET', 'http://localhost:' + PORT + '/services/');
  t.deepEqual(resource, {
    name: 'services',
    contentType: 'application/json',
    content: ['math.sum', 'math.multiply', 'math.divide', 'returnOption']
  });
});

test('Get setting paths', async t => {
  const resource = await requestServer('GET', 'http://localhost:' + PORT + '/settings/');
  t.deepEqual(resource, {
    name: 'settings',
    contentType: 'application/json',
    content: ['foo.some', 'foo.other']
  });
});
