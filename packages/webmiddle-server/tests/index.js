import WebMiddle from "webmiddle";
import superagent from "superagent";
import WebSocket from "ws";
import uuid from "uuid";
import test from "ava";
import Server from "../src";

const PORT = 3000;

function requestExpress(method, path, data = {}) {
  return new Promise((resolve, reject) => {
    superagent
      [method.toLowerCase()]("http://localhost:" + PORT + path)
      .send(data)
      .end((err, res) => {
        if (err) reject(err);
        else resolve(res.body);
      });
  });
}

let wsPromise;
function getWebsocketConnection() {
  if (!wsPromise) {
    wsPromise = new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(`ws://localhost:${PORT}/`);
        ws.on("open", () => resolve(ws));
        ws.on("error", reject);
      } catch (err) {
        reject(err);
      }
    });
  }
  return wsPromise;
}

function requestWebsocket(path, body = {}, onProgress) {
  return getWebsocketConnection().then(ws => {
    return new Promise((resolve, reject) => {
      try {
        const requestId = uuid.v4();

        ws.on("message", rawMessage => {
          //console.log('received from server: %s', rawMessage);
          const message = JSON.parse(rawMessage);
          if (message.requestId !== requestId) return;

          if (message.type === "progress") {
            if (onProgress) onProgress(message);
          }

          if (message.type === "response") {
            if (message.status === "success") {
              resolve(message.body);
            } else if (message.status === "error") {
              reject(message.body);
            }
          }
        });

        ws.send(JSON.stringify({ type: "request", requestId, path, body }));
      } catch (err) {
        console.error(err instanceof Error ? err.stack : err);
        reject(err instanceof Error ? err.stack : err);
      }
    });
  });
}

const webmiddle = new WebMiddle({
  services: {
    math: {
      sum: ({ a, b }) => ({
        name: "result",
        contentType: "text/plain",
        // without Number() a + b would be a string concatenation in GET requests!
        content: String(Number(a) + Number(b))
      }),

      multiply: ({ a, b }) => ({
        name: "result",
        contentType: "text/plain",
        content: String(Number(a) * Number(b))
      }),

      divide: ({ a, b }) => ({
        name: "result",
        contentType: "text/plain",
        content: String(Number(a) / Number(b))
      })
    },
    returnOption: ({ optionName }, context) => context.options[optionName]
  },
  settings: {
    foo: {
      some: "bar",
      other: 100
    }
  }
});

const server = new Server(webmiddle, { port: PORT });
server.start();

test("Execute service via GET", async t => {
  const resource = await requestExpress("GET", "/services/math/sum?a=5&b=10");
  t.deepEqual(resource, {
    name: "result",
    contentType: "text/plain",
    content: "15"
  });
});

test("Execute service via POST", async t => {
  const resource = await requestExpress("POST", "/services/math/multiply", {
    props: {
      a: 20,
      b: 5
    }
  });
  t.deepEqual(resource, {
    name: "result",
    contentType: "text/plain",
    content: "100"
  });
});

test("Execute service via WEBSOCKET", async t => {
  const resource = await requestWebsocket("/services/math/multiply", {
    props: {
      a: 20,
      b: 5
    }
  });
  t.deepEqual(resource, {
    name: "result",
    contentType: "text/plain",
    content: "100"
  });
});

test("Must throw when executing a non existing service via GET", async t => {
  await t.throws(
    requestExpress("GET", "/services/wrongUndefinedService?a=5&b=10")
  );
});

test("Must throw when executing a non existing service via POST", async t => {
  await t.throws(requestExpress("POST", "/services/wrongUndefinedService"));
});

test("Must throw when executing a non existing service via WEBSOCKET", async t => {
  await t.throws(requestWebsocket("/services/wrongUndefinedService"));
});

test("Pass context options to service via POST", async t => {
  const resource = await requestExpress("POST", "/services/returnOption", {
    props: {
      optionName: "custom"
    },
    options: {
      custom: 5
    }
  });
  t.is(resource.contentType, "x-webmiddle-any");
  t.is(resource.content, 5);
});

test("Pass context options to service via WEBSOCKET", async t => {
  const resource = await requestWebsocket("/services/returnOption", {
    props: {
      optionName: "custom"
    },
    options: {
      custom: 5
    }
  });
  t.is(resource.contentType, "x-webmiddle-any");
  t.is(resource.content, 5);
});

test("Get progress when executing a service via WEBSOCKET", async t => {
  const progressData = [];
  function handleProgress(message) {
    progressData.push(message.body);
  }

  await requestWebsocket(
    "/services/math/multiply",
    {
      props: {
        a: 20,
        b: 5
      }
    },
    handleProgress
  );

  t.is(progressData[0].path, "0");
  t.true(
    typeof progressData[0].info === "object" && progressData[0].info !== null
  );
});

test("Read setting via GET", async t => {
  const resource = await requestExpress("GET", "/settings/foo/other");
  t.is(resource.contentType, "x-webmiddle-any");
  t.is(resource.content, 100);
});

test("Read setting via POST", async t => {
  const resource = await requestExpress("POST", "/settings/foo/other");
  t.is(resource.contentType, "x-webmiddle-any");
  t.is(resource.content, 100);
});

test("Read setting via WEBSOCKET", async t => {
  const resource = await requestWebsocket("/settings/foo/other");
  t.is(resource.contentType, "x-webmiddle-any");
  t.is(resource.content, 100);
});

test("Get service paths", async t => {
  const resource = await requestExpress("GET", "/services/");
  t.deepEqual(resource, {
    name: "services",
    contentType: "application/json",
    content: ["math.sum", "math.multiply", "math.divide", "returnOption"]
  });
});

test("Get service paths via WEBSOCKET", async t => {
  const resource = await requestWebsocket("/services/");
  t.deepEqual(resource, {
    name: "services",
    contentType: "application/json",
    content: ["math.sum", "math.multiply", "math.divide", "returnOption"]
  });
});

test("Get setting paths", async t => {
  const resource = await requestExpress("GET", "/settings/");
  t.deepEqual(resource, {
    name: "settings",
    contentType: "application/json",
    content: ["foo.some", "foo.other"]
  });
});

test("Get setting paths via WEBSOCKET", async t => {
  const resource = await requestWebsocket("/settings/");
  t.deepEqual(resource, {
    name: "settings",
    contentType: "application/json",
    content: ["foo.some", "foo.other"]
  });
});
