import { rootContext, isResource } from "webmiddle";
import superagent from "superagent";
import WebSocket from "ws";
import uuid from "uuid";
import test from "ava";
import EventEmitter from "events";

import Server from "../src";

const PORT = 3000;
const API_KEY = "justAnyStringHere012";
const eventEmitter = new EventEmitter();

function requestExpress(method, path, data = {}, { apiKey = API_KEY } = {}) {
  return new Promise((resolve, reject) => {
    superagent[method.toLowerCase()]("http://localhost:" + PORT + path)
      .set("Authorization", apiKey)
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
        ws.on("open", () => {
          ws.on("message", rawMessage => {
            const message = JSON.parse(rawMessage);
            if (message.type === "notification") {
              eventEmitter.emit("notification", message.body);
            }
          });

          resolve(ws);
        });
        ws.on("error", reject);
      } catch (err) {
        reject(err);
      }
    });
  }
  return wsPromise;
}

function requestWebsocket(
  path,
  body = {},
  onProgress,
  { apiKey = API_KEY } = {}
) {
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
              reject(new Error(message.body));
            }
          }
        });

        ws.send(
          JSON.stringify({
            type: "request",
            requestId,
            authorization: apiKey,
            path,
            body
          })
        );
      } catch (err) {
        console.error(err instanceof Error ? err.stack : err);
        reject(err);
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

const ThrowOption = ({ optionName }, context) => {
  throw context.options[optionName];
};

const WaitForEvent = ({ eventName }) =>
  new Promise(resolve => {
    eventEmitter.once(eventName, () => resolve("event emitted"));
  });

const server = new Server(
  {
    "math/sum": MathSum,
    "math/multiply": MathMultiply,
    "math/divide": MathDivide,
    returnOption: ReturnOption,
    throwOption: ThrowOption,
    waitForEvent: WaitForEvent
  },
  {
    port: PORT,
    apiKey: API_KEY,
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

test("Execute service via GET: should fail when sending invalid authorization", async t => {
  await t.throwsAsync(
    requestExpress("GET", "/services/math/sum?a=5&b=10", undefined, {
      apiKey: "wrongApiKey"
    })
  );

  await t.notThrowsAsync(
    requestExpress("GET", "/services/math/sum?a=5&b=10", undefined, {
      apiKey: API_KEY
    })
  );
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

test("Execute service via WEBSOCKET: should fail when sending invalid authorization", async t => {
  await t.throwsAsync(
    requestWebsocket(
      "/services/math/multiply",
      {
        props: {
          a: 20,
          b: 5
        }
      },
      undefined,
      { apiKey: "wrongKey" }
    )
  );

  await t.notThrowsAsync(
    requestWebsocket(
      "/services/math/multiply",
      {
        props: {
          a: 20,
          b: 5
        }
      },
      undefined,
      { apiKey: API_KEY }
    )
  );
});

test("Must throw when executing a non existing service via GET", async t => {
  await t.throwsAsync(
    requestExpress("GET", "/services/wrongUndefinedService?a=5&b=10")
  );
});

test("Must throw when executing a non existing service via POST", async t => {
  await t.throwsAsync(
    requestExpress("POST", "/services/wrongUndefinedService")
  );
});

test("Must throw when executing a non existing service via WEBSOCKET", async t => {
  await t.throwsAsync(requestWebsocket("/services/wrongUndefinedService"));
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
    typeof progressData[0].node === "object" && progressData[0].node !== null
  );
  t.true(typeof progressData[0].node.callRootContextPath !== "undefined");
  t.true(typeof progressData[0].node.path !== "undefined");
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
    },
    throwOption: {
      name: ThrowOption.name || null,
      description: ThrowOption.description || null
    },
    waitForEvent: {
      name: WaitForEvent.name || null,
      description: WaitForEvent.description || null
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
    },
    throwOption: {
      name: ThrowOption.name || null,
      description: ThrowOption.description || null
    },
    waitForEvent: {
      name: WaitForEvent.name || null,
      description: WaitForEvent.description || null
    }
  });
});

test("Evaluations: get list (express)", async t => {
  const customUniqueOption = uuid.v4();
  await requestExpress("POST", "/services/math/multiply", {
    props: {
      a: 20,
      b: 5
    },
    options: {
      customUniqueOption
    }
  });

  const responseBody = await requestExpress("POST", "/evaluations/");
  const resource = rootContext.parseResource(responseBody);

  t.true(isResource(resource));
  t.is(resource.name, "evaluations");
  t.is(resource.contentType, "application/json");
  t.is(typeof resource.content, "object");

  const evaluations = resource.content;
  const evaluationId = Object.keys(evaluations).find(
    id => evaluations[id].options.customUniqueOption === customUniqueOption
  );
  const evaluation = evaluations[evaluationId];

  t.truthy(evaluation);
  t.truthy(evaluation.id);
  t.is(Number.isNaN(evaluation.created_timestamp), false);
  t.is(evaluation.status, "success");
  t.is(evaluation.path, "math/multiply");
  t.deepEqual(evaluation.props, {
    a: 20,
    b: 5
  });
  t.deepEqual(evaluation.options, {
    customUniqueOption
  });
  t.is(typeof evaluation.progressQueue, "undefined");
  t.is(typeof evaluation.progressEmitter, "undefined");
});

test("Evaluations: Must throw when requesting a non existing evaluation (websocket)'", async t => {
  await t.throwsAsync(requestWebsocket("/evaluations/INVALID"));
});

test("Evaluations: reattach: ended with success (websocket)", async t => {
  const customUniqueOption = uuid.v4();
  await requestWebsocket("/services/math/multiply", {
    props: {
      a: 20,
      b: 5
    },
    options: {
      customUniqueOption
    }
  });

  let responseBody = await requestWebsocket("/evaluations/");
  let resource = rootContext.parseResource(responseBody);

  const evaluations = resource.content;
  const evaluationId = Object.keys(evaluations).find(
    id => evaluations[id].options.customUniqueOption === customUniqueOption
  );
  const evaluation = evaluations[evaluationId];

  t.is(evaluation.status, "success");

  responseBody = await requestWebsocket(`/evaluations/${evaluation.id}`, {
    props: {
      command: "reattach"
    }
  });
  resource = rootContext.parseResource(responseBody);

  t.is(resource.name, "result");
  t.is(resource.contentType, "text/plain");
  t.is(resource.content, "100");
});

test("Evaluations: reattach: ended with failure (websocket)", async t => {
  const customUniqueOption = uuid.v4();
  const expectedErrorMessage = "expected";
  try {
    await requestWebsocket("/services/throwOption", {
      props: {
        optionName: "custom"
      },
      options: {
        custom: expectedErrorMessage,
        customUniqueOption
      }
    });
  } catch (err) {
    if (err.message !== expectedErrorMessage) throw err;
  }

  const responseBody = await requestWebsocket("/evaluations/");
  const resource = rootContext.parseResource(responseBody);

  const evaluations = resource.content;
  const evaluationId = Object.keys(evaluations).find(
    id => evaluations[id].options.customUniqueOption === customUniqueOption
  );
  const evaluation = evaluations[evaluationId];

  t.is(evaluation.status, "error");

  let reattachErr;
  try {
    await requestWebsocket(`/evaluations/${evaluation.id}`, {
      props: {
        command: "reattach"
      }
    });
  } catch (err) {
    reattachErr = err;
  }

  t.is(reattachErr.message, expectedErrorMessage);
});

test("Evaluations: reattach: progress with success (websocket)", async t => {
  const customUniqueOption = uuid.v4();
  requestWebsocket("/services/waitForEvent", {
    props: {
      eventName: customUniqueOption
    },
    options: {
      customUniqueOption
    }
  });

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  await delay(500); // make sure request is sent
  let responseBody = await requestWebsocket("/evaluations/");
  let resource = rootContext.parseResource(responseBody);

  const evaluations = resource.content;
  const evaluationId = Object.keys(evaluations).find(
    id => evaluations[id].options.customUniqueOption === customUniqueOption
  );
  const evaluation = evaluations[evaluationId];

  t.is(evaluation.status, "progress");

  // complete evaluation after some delay
  delay(1000).then(() => eventEmitter.emit(customUniqueOption));

  responseBody = await requestWebsocket(`/evaluations/${evaluation.id}`, {
    props: {
      command: "reattach"
    }
  });
  resource = rootContext.parseResource(responseBody);

  t.is(resource.name, "wrappedContent");
  t.is(resource.contentType, "x-webmiddle-any");
  t.is(resource.content, "event emitted");
});

test("Evaluations: remove: must throw when evaluation is in progress (websocket)", async t => {
  const customUniqueOption = uuid.v4();
  requestWebsocket("/services/waitForEvent", {
    props: {
      eventName: customUniqueOption
    },
    options: {
      customUniqueOption
    }
  });

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  await delay(500); // make sure request is sent
  const responseBody = await requestWebsocket("/evaluations/");
  const resource = rootContext.parseResource(responseBody);

  const evaluations = resource.content;
  const evaluationId = Object.keys(evaluations).find(
    id => evaluations[id].options.customUniqueOption === customUniqueOption
  );
  const evaluation = evaluations[evaluationId];

  t.is(evaluation.status, "progress");

  // complete evaluation after some delay
  delay(1000).then(() => eventEmitter.emit(customUniqueOption));

  await t.throwsAsync(
    requestWebsocket(`/evaluations/${evaluation.id}`, {
      props: {
        command: "delete"
      }
    })
  );
});

test("Evaluations: remove: ended with success (websocket)", async t => {
  const customUniqueOption = uuid.v4();
  await requestWebsocket("/services/math/multiply", {
    props: {
      a: 20,
      b: 5
    },
    options: {
      customUniqueOption
    }
  });

  let responseBody = await requestWebsocket("/evaluations/");
  let resource = rootContext.parseResource(responseBody);

  let evaluations = resource.content;
  let evaluationId = Object.keys(evaluations).find(
    id => evaluations[id].options.customUniqueOption === customUniqueOption
  );
  const evaluation = evaluations[evaluationId];

  t.is(evaluation.status, "success");

  await requestWebsocket(`/evaluations/${evaluation.id}`, {
    props: {
      command: "remove"
    }
  });

  responseBody = await requestWebsocket("/evaluations/");
  resource = rootContext.parseResource(responseBody);

  evaluations = resource.content;
  evaluationId = Object.keys(evaluations).find(
    id => evaluations[id].options.customUniqueOption === customUniqueOption
  );

  t.is(evaluationId, undefined);
});

test("Evaluations: Must throw when sending an invalid command (websocket)'", async t => {
  const customUniqueOption = uuid.v4();
  await requestWebsocket("/services/math/multiply", {
    props: {
      a: 20,
      b: 5
    },
    options: {
      customUniqueOption
    }
  });

  const responseBody = await requestWebsocket("/evaluations/");
  const resource = rootContext.parseResource(responseBody);

  const evaluations = resource.content;
  const evaluationId = Object.keys(evaluations).find(
    id => evaluations[id].options.customUniqueOption === customUniqueOption
  );
  const evaluation = evaluations[evaluationId];

  t.truthy(evaluation.id);
  t.is(evaluation.status, "success");

  await t.throwsAsync(
    requestWebsocket(`/evaluations/${evaluation.id}`, {
      props: {
        command: "INVALID"
      }
    })
  );
});

test("notifications: evaluation:add, evaluation:update, evaluation:remove", async t => {
  const customUniqueOption = uuid.v4();

  const evaluationAddMessages = [];
  const evaluationUpdateMessages = [];
  const evaluationRemoveMessages = [];
  eventEmitter.on("notification", message => {
    if (
      message.topic === "evaluation:add" &&
      message.data.evaluation.options.customUniqueOption === customUniqueOption
    ) {
      evaluationAddMessages.push(message);
    }
    if (
      message.topic === "evaluation:update" &&
      message.data.evaluation.options.customUniqueOption === customUniqueOption
    ) {
      evaluationUpdateMessages.push(message);
    }
    if (
      message.topic === "evaluation:remove" &&
      message.data.evaluation.options.customUniqueOption === customUniqueOption
    ) {
      evaluationRemoveMessages.push(message);
    }
  });

  await requestWebsocket("/services/math/multiply", {
    props: {
      a: 20,
      b: 5
    },
    options: {
      customUniqueOption
    }
  });

  t.is(evaluationAddMessages.length, 1);
  t.is(evaluationAddMessages[0].data.evaluation.status, "progress");

  t.is(evaluationUpdateMessages.length, 1);
  t.is(evaluationUpdateMessages[0].data.evaluation.status, "success");

  await requestWebsocket(
    `/evaluations/${evaluationUpdateMessages[0].data.evaluation.id}`,
    {
      props: {
        command: "remove"
      }
    }
  );

  t.is(evaluationRemoveMessages.length, 1);
  t.is(evaluationRemoveMessages[0].data.evaluation.status, "success");
});
