import test from 'ava';
import Browser from '../src/index.js';
import WebMiddle, { evaluate, createContext } from 'webmiddle';

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle({
    settings: {
      network: {
        retries: 3,
      },
    },
  });
});

// phantomjs wraps non-html content into a "pre" element
function getJSON(content) {
  const start = content.indexOf('>{') + 1;
  const end = content.indexOf('}\n</pre>') + 1;
  const jsonString = content.substring(start, end);
  const json = JSON.parse(jsonString);
  return json;
}

test('GET https page', async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(createContext(t.context.webmiddle),
    <Browser
      name="virtual"
      contentType="text/html"
      method="GET"
      url={`https://httpbin.org/get?number=${escape(number)}&static=${escape('test this number')}`}
    />
  );

  const json = getJSON(output.content);
  t.deepEqual(json.args, {
    number: number.toString(), // NOTE: type is lost with query data
    static: 'test this number',
  });
});

test('POST https page: form data as string', async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(createContext(t.context.webmiddle),
    <Browser
      name="virtual"
      contentType="text/html"
      method="POST"
      url="https://httpbin.org/post"
      body={`number=${encodeURIComponent(number)}&static=${encodeURIComponent('test this number')}`}
    />
  );

  const json = getJSON(output.content);
  t.deepEqual(json.form, {
    number: number.toString(), // NOTE: type is lost with form data
    static: 'test this number',
  });
});

test('POST https page: form data as object', async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(createContext(t.context.webmiddle),
    <Browser
      name="virtual"
      contentType="text/html"
      method="POST"
      url="https://httpbin.org/post"
      body={{
        number,
        static: 'test this number',
      }}
    />
  );

  const json = getJSON(output.content);
  t.deepEqual(json.form, {
    number: number.toString(), // NOTE: type is lost with form data
    static: 'test this number',
  });
});

test('POST https page: json data as object', async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(createContext(t.context.webmiddle),
    <Browser
      name="virtual"
      contentType="text/html"
      method="POST"
      url="https://httpbin.org/post"
      body={{
        number,
        static: 'test this number',
      }}
      httpHeaders={{
        'Content-Type': 'application/json',
      }}
    />
  );

  const json = getJSON(output.content);
  t.deepEqual(json.json, {
    number,
    static: 'test this number',
  });
});

test('httpHeaders', async t => {
  const output = await evaluate(createContext(t.context.webmiddle),
    <Browser
      name="virtual"
      contentType="text/html"
      method="GET"
      url="https://httpbin.org/get"
      httpHeaders={{
        'My-Custom-Webmiddle-Header': 'Browser service test',
      }}
    />
  );

  // Note: uppercase letters inside a word are converted to lowercase by the server
  // e.g: My-CuStoM => My-Custom

  const json = getJSON(output.content);
  t.is(json.headers['My-Custom-Webmiddle-Header'], 'Browser service test');
});

test('waitFor', async t => {
  const output = await evaluate(createContext(t.context.webmiddle),
    <Browser
      name="virtual"
      contentType="text/html"
      method="GET"
      url="http://todomvc.com/examples/react/#/"
      waitFor=".new-todo"
    />
  );

  t.pass();
});

test('cookies', async t => {
  // save to jar

  let v2 = Math.floor(Math.random() * 100) + 1;
  let v1 = Math.floor(Math.random() * 100) + 1;

  await evaluate(createContext(t.context.webmiddle),
    <Browser
      name="virtual"
      contentType="text/html"
      method="GET"
      url={`https://httpbin.org/cookies/set?k2=${v2}&k1=${v1}`}
    />
  );

  const cookies = t.context.webmiddle.cookieManager.jar.getCookiesSync('https://httpbin.org');

  t.is(cookies[0].key, 'k2');
  t.is(cookies[0].value, String(v2));

  t.is(cookies[1].key, 'k1');
  t.is(cookies[1].value, String(v1));

  // read from jar

  v2 = Math.floor(Math.random() * 100) + 1;
  v1 = Math.floor(Math.random() * 100) + 1;
  cookies[0].value = String(v2);
  cookies[1].value = String(v1);

  const output = await evaluate(createContext(t.context.webmiddle),
    <Browser
      name="virtual"
      contentType="text/html"
      method="GET"
      url="https://httpbin.org/cookies"
    />
  );

  const json = getJSON(output.content);
  t.deepEqual(json.cookies, {
    k2: String(v2),
    k1: String(v1),
  });
});
