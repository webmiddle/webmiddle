import superagent from "superagent";
import WebSocket from "ws";
import uuid from "uuid";
import test from "ava";
import Server from "../src";
import { rootContext, isResource } from "webmiddle";

const PORT = 3000;

function requestExpress(method, path, data = {}) {
  return new Promise((resolve, reject) => {
    superagent[method.toLowerCase()]("http://localhost:" + PORT + path)
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

const MathSum = ({ a, b }) =>
  rootContext.createResource(
    "result",
    "text/plain",
    // without Number() a + b would be a string concatenation in GET requests!
    String(Number(a) + Number(b))
  );
MathSum.description = "Sums two number";

const MathMultiply = ({ a, b }) =>
  rootContext.createResource(
    "result",
    "text/plain",
    String(Number(a) * Number(b))
  );
MathMultiply.description = "Multiplies two numbers";

const MathDivide = ({ a, b }) =>
  rootContext.createResource(
    "result",
    "text/plain",
    String(Number(a) / Number(b))
  );
MathDivide.description = "Divides two numbers";

const ReturnOption = ({ optionName }, context) => context.options[optionName];

const server = new Server(
  {
    "math/sum": MathSum,
    "math/multiply": MathMultiply,
    "math/divide": MathDivide,
    returnOption: ReturnOption
  },
  {
    port: PORT,
    contextOptions: { base: "default option" }
  }
);
server.start();

test("Execute service via GET", async t => {
  const responseBody = await requestExpress(
    "GET",
    "/services/math/sum?a=5&b=10"
  );
  const resource = rootContext.parseResource(responseBody);

  t.true(isResource(resource));
  t.is(resource.name, "result");
  t.is(resource.contentType, "text/plain");
  t.is(resource.content, "15");
});

test("Execute service via POST", async t => {
  const responseBody = await requestExpress("POST", "/services/math/multiply", {
    props: {
      a: 20,
      b: 5
    }
  });
  const resource = rootContext.parseResource(responseBody);

  t.true(isResource(resource));
  t.is(resource.name, "result");
  t.is(resource.contentType, "text/plain");
  t.is(resource.content, "100");
});

test("Execute service via WEBSOCKET", async t => {
  const responseBody = await requestWebsocket("/services/math/multiply", {
    props: {
      a: 20,
      b: 5
    }
  });
  const resource = rootContext.parseResource(responseBody);

  t.true(isResource(resource));
  t.is(resource.name, "result");
  t.is(resource.contentType, "text/plain");
  t.is(resource.content, "100");
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

test("Default context options via POST", async t => {
  const responseBody = await requestExpress("POST", "/services/returnOption", {
    props: {
      optionName: "base"
    }
  });
  const resource = rootContext.parseResource(responseBody);

  t.true(isResource(resource));
  t.is(resource.contentType, "x-webmiddle-any");
  t.is(resource.content, "default option");
});

test("Default context options via WEBSOCKET", async t => {
  const responseBody = await requestWebsocket("/services/returnOption", {
    props: {
      optionName: "base"
    }
  });
  const resource = rootContext.parseResource(responseBody);

  t.true(isResource(resource));
  t.is(resource.contentType, "x-webmiddle-any");
  t.is(resource.content, "default option");
});

test("Pass context options to service via POST", async t => {
  const responseBody = await requestExpress("POST", "/services/returnOption", {
    props: {
      optionName: "custom"
    },
    options: {
      custom: 5
    }
  });
  const resource = rootContext.parseResource(responseBody);

  t.true(isResource(resource));
  t.is(resource.contentType, "x-webmiddle-any");
  t.is(resource.content, String(5));
});

test("Pass context options to service via WEBSOCKET", async t => {
  const responseBody = await requestWebsocket("/services/returnOption", {
    props: {
      optionName: "custom"
    },
    options: {
      custom: 5
    }
  });
  const resource = rootContext.parseResource(responseBody);

  t.true(isResource(resource));
  t.is(resource.contentType, "x-webmiddle-any");
  t.is(resource.content, String(5));
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
      },
      options: {
        debug: true
      }
    },
    handleProgress
  );

  t.true(
    typeof progressData[0].info === "object" && progressData[0].info !== null
  );
  t.true(typeof progressData[0].info.callRootContextPath !== "undefined");
  t.true(typeof progressData[0].info.path !== "undefined");
});

test("Get service paths", async t => {
  const responseBody = await requestExpress("GET", "/services/");
  const resource = rootContext.parseResource(responseBody);

  t.true(isResource(resource));
  t.is(resource.name, "services");
  t.is(resource.contentType, "application/json");
  t.deepEqual(resource.content, {
    "math/sum": {
      name: MathSum.name || null,
      description: MathSum.description || null
    },
    "math/multiply": {
      name: MathMultiply.name || null,
      description: MathMultiply.description || null
    },
    "math/divide": {
      name: MathDivide.name || null,
      description: MathDivide.description || null
    },
    returnOption: {
      name: ReturnOption.name || null,
      description: ReturnOption.description || null
    }
  });
});

test("Get service paths via WEBSOCKET", async t => {
  const responseBody = await requestWebsocket("/services/");
  const resource = rootContext.parseResource(responseBody);

  t.true(isResource(resource));
  t.is(resource.name, "services");
  t.is(resource.contentType, "application/json");
  t.deepEqual(resource.content, {
    "math/sum": {
      name: MathSum.name || null,
      description: MathSum.description || null
    },
    "math/multiply": {
      name: MathMultiply.name || null,
      description: MathMultiply.description || null
    },
    "math/divide": {
      name: MathDivide.name || null,
      description: MathDivide.description || null
    },
    returnOption: {
      name: ReturnOption.name || null,
      description: ReturnOption.description || null
    }
  });
});
