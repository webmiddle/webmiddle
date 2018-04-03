import test from "ava";
import Browser from "../src/index.js";
import webmiddle, { evaluate, createContext } from "webmiddle";

test.beforeEach(t => {
  t.context.context = createContext({
    networkRetries: 3
  });
});

test("GET https page", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="GET"
      url={`https://httpbin.org/get?number=${encodeURIComponent(
        number
      )}&static=${encodeURIComponent("test this number")}`}
    />
  );

  const json = output.content;
  t.deepEqual(json.args, {
    number: number.toString(), // NOTE: type is lost with query data
    static: "test this number"
  });
});

test("GET xml document (infer resource contentType)", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser name="virtual" method="GET" url={`https://httpbin.org/xml`} />
  );

  t.is(output.contentType, "application/xml");
});

test("GET non-html document: should ignore waitFor", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/xml"
      method="GET"
      url={`https://httpbin.org/xml`}
      waitFor=".foo"
    />
  );

  t.is(output.contentType, "application/xml");
});

test("POST https page: form data as string (no content type header)", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="POST"
      url="https://httpbin.org/post"
      body={`number=${encodeURIComponent(number)}&static=${encodeURIComponent(
        "test this number"
      )}`}
    />
  );

  const json = output.content;
  t.deepEqual(json.form, {
    number: number.toString(), // NOTE: type is lost with form data
    static: "test this number"
  });
});

test("POST https page: form data as string (no content type header, case insensitive method)", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="pOsT"
      url="https://httpbin.org/post"
      body={`number=${encodeURIComponent(number)}&static=${encodeURIComponent(
        "test this number"
      )}`}
    />
  );

  const json = output.content;
  t.deepEqual(json.form, {
    number: number.toString(), // NOTE: type is lost with form data
    static: "test this number"
  });
});

test("POST https page: form data as object (no content type header)", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="POST"
      url="https://httpbin.org/post"
      body={{
        number,
        static: "test this number"
      }}
    />
  );

  const json = output.content;
  t.deepEqual(json.form, {
    number: number.toString(), // NOTE: type is lost with form data
    static: "test this number"
  });
});

test("POST https page: form data as object (with content type header)", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="POST"
      url="https://httpbin.org/post"
      body={{
        number,
        static: "test this number"
      }}
      httpHeaders={{
        "Content-Type": "application/x-www-form-urlencoded"
      }}
    />
  );

  const json = output.content;
  t.deepEqual(json.form, {
    number: number.toString(), // NOTE: type is lost with form data
    static: "test this number"
  });
});

test("POST https page: json data as string", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="POST"
      url="https://httpbin.org/post"
      body={JSON.stringify({
        number,
        static: "test this number"
      })}
      httpHeaders={{
        "Content-Type": "application/json"
      }}
    />
  );

  const json = output.content;
  t.deepEqual(json.json, {
    number,
    static: "test this number"
  });
});

test("POST https page: json data as string (case insensitive headers)", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="POST"
      url="https://httpbin.org/post"
      body={JSON.stringify({
        number,
        static: "test this number"
      })}
      httpHeaders={{
        "CoNTenT-TYpe": "application/json"
      }}
    />
  );

  const json = output.content;
  t.deepEqual(json.json, {
    number,
    static: "test this number"
  });
});

test("POST https page: json data as object", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="POST"
      url="https://httpbin.org/post"
      body={{
        number,
        static: "test this number"
      }}
      httpHeaders={{
        "Content-Type": "application/json"
      }}
    />
  );

  const json = output.content;
  t.deepEqual(json.json, {
    number,
    static: "test this number"
  });
});

test("httpHeaders", async t => {
  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="GET"
      url="https://httpbin.org/get"
      httpHeaders={{
        "My-Custom-Webmiddle-Header": "Browser service test"
      }}
    />
  );

  // Note: uppercase letters inside a word are converted to lowercase by the server
  // e.g: My-CuStoM => My-Custom

  const json = output.content;
  t.is(json.headers["My-Custom-Webmiddle-Header"], "Browser service test");
});

test("waitFor", async t => {
  const output = await evaluate(
    createContext(t.context.context),
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

test("cookies", async t => {
  // save to jar

  let v2 = Math.floor(Math.random() * 100) + 1;
  let v1 = Math.floor(Math.random() * 100) + 1;

  await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="GET"
      url={`https://httpbin.org/cookies/set?k2=${v2}&k1=${v1}`}
    />
  );

  const cookies = t.context.context.cookieManager.jar.getCookiesSync(
    "https://httpbin.org"
  );

  const cookieK2 = cookies.find(c => c.key === "k2");
  t.is(cookieK2.value, String(v2));

  const cookieK1 = cookies.find(c => c.key === "k1");
  t.is(cookieK1.value, String(v1));

  // read from jar

  v2 = Math.floor(Math.random() * 100) + 1;
  v1 = Math.floor(Math.random() * 100) + 1;
  cookieK2.value = String(v2);
  cookieK1.value = String(v1);

  const output = await evaluate(
    createContext(t.context.context),
    <Browser
      name="virtual"
      contentType="application/json"
      method="GET"
      url="https://httpbin.org/cookies"
    />
  );

  const json = output.content;
  t.deepEqual(json.cookies, {
    k2: String(v2),
    k1: String(v1)
  });
});

test("Should not throw when status code is between 200 and 299", async t => {
  await t.notThrows(
    evaluate(
      createContext(t.context.context),
      <Browser
        name="virtual"
        contentType="text/html"
        method="GET"
        url={`https://httpbin.org/status/201`}
      />
    )
  );

  await t.notThrows(
    evaluate(
      createContext(t.context.context),
      <Browser
        name="virtual"
        contentType="text/html"
        method="GET"
        url={`https://httpbin.org/status/299`}
      />
    )
  );
});

test("Should fail with correct status code", async t => {
  try {
    await evaluate(
      createContext(t.context.context),
      <Browser
        name="virtual"
        contentType="text/html"
        method="GET"
        url={`https://httpbin.org/status/499`}
      />
    );
  } catch (err) {
    t.is(err.statusCode, 499);
    t.is(err.message, "success");
  }
});
