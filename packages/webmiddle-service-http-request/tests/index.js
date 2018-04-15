import test from "ava";
import HttpRequest from "../src/index.js";
import { rootContext } from "webmiddle";

test.beforeEach(t => {
  t.context.context = rootContext.extend({
    networkRetries: 3
  });
});

test("GET https page", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await t.context.context.evaluate(
    <HttpRequest
      name="virtual"
      contentType="application/json"
      method="GET"
      url={`https://httpbin.org/get?number=${escape(number)}&static=${escape(
        "test this number"
      )}`}
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

  const output = await t.context.context.evaluate(
    <HttpRequest name="virtual" method="GET" url={`https://httpbin.org/xml`} />
  );

  t.is(output.contentType, "application/xml");
});

test("POST https page: form data as string (no content type header)", async t => {
  const number = Math.round(Math.random() * 100);

  const output = await t.context.context.evaluate(
    <HttpRequest
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

  const output = await t.context.context.evaluate(
    <HttpRequest
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

  const output = await t.context.context.evaluate(
    <HttpRequest
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

  const output = await t.context.context.evaluate(
    <HttpRequest
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

  const output = await t.context.context.evaluate(
    <HttpRequest
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

  const output = await t.context.context.evaluate(
    <HttpRequest
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

  const output = await t.context.context.evaluate(
    <HttpRequest
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
  const output = await t.context.context.evaluate(
    <HttpRequest
      name="virtual"
      contentType="application/json"
      method="GET"
      url="https://httpbin.org/get"
      httpHeaders={{
        "My-Custom-Webmiddle-Header": "HttpRequest service test"
      }}
    />
  );

  // Note: uppercase letters inside a word are converted to lowercase by the server
  // e.g: My-CuStoM => My-Custom

  const json = output.content;
  t.is(json.headers["My-Custom-Webmiddle-Header"], "HttpRequest service test");
});

test("cookies: save to jar", async t => {
  const v1 = 10;
  const v2 = 20;

  await t.context.context.evaluate(
    <HttpRequest
      name="virtual"
      contentType="application/json"
      method="GET"
      url={`https://httpbin.org/cookies/set?a1=${v1}&a2=${v2}`}
    />
  );

  const cookies = t.context.context.cookieManager.jar.getCookiesSync(
    "https://httpbin.org"
  );

  const cookieA1 = cookies.find(c => c.key === "a1");
  t.is(cookieA1.value, String(v1));

  const cookieA2 = cookies.find(c => c.key === "a2");
  t.is(cookieA2.value, String(v2));
});

test("cookies: read from jar", async t => {
  const v1 = 30;
  const v2 = 40;

  t.context.context.cookieManager.jar.setCookieSync(
    t.context.context.cookieManager.Cookie.parse(`b1=${v1}; Path=/`, {
      loose: true
    }),
    "https://httpbin.org",
    {}
  );

  t.context.context.cookieManager.jar.setCookieSync(
    t.context.context.cookieManager.Cookie.parse(`b2=${v2}; Path=/`, {
      loose: true
    }),
    "https://httpbin.org",
    {}
  );

  const output = await t.context.context.evaluate(
    <HttpRequest
      name="virtual"
      contentType="application/json"
      method="GET"
      url="https://httpbin.org/cookies"
    />
  );

  const json = output.content;
  t.deepEqual(json.cookies, {
    b1: String(v1),
    b2: String(v2)
  });
});

test("Should not throw when status code is between 200 and 299", async t => {
  await t.notThrows(
    t.context.context.evaluate(
      <HttpRequest
        name="virtual"
        contentType="text/html"
        method="GET"
        url={`https://httpbin.org/status/201`}
      />
    )
  );

  await t.notThrows(
    t.context.context.evaluate(
      <HttpRequest
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
    await t.context.context.evaluate(
      <HttpRequest
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
