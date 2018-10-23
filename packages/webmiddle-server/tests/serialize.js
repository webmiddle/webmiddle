import test from "ava";
import {
  serializeValue,
  serializeCallNode,
  loadMore
} from "../src/utils/serialize";
import { rootContext } from "webmiddle";

test("number (recursion = -1)", async t => {
  t.deepEqual(serializeValue(10, -1), {
    type: "number",
    value: 10
  });
});

test("string (recursion = -1, short)", async t => {
  t.deepEqual(serializeValue("abc", -1), {
    type: "string",
    value: "abc"
  });
});

test("string (recursion = -1, long)", async t => {
  const longString = [...Array(101)].map(() => "a").join("");
  t.deepEqual(serializeValue(longString, -1), {
    type: "more",
    path: [],
    serializedPath: []
  });
});

test("boolean (recursion = -1)", async t => {
  t.deepEqual(serializeValue(true, -1), {
    type: "boolean",
    value: true
  });

  t.deepEqual(serializeValue(false, -1), {
    type: "boolean",
    value: false
  });
});

test("array with zero length (recursion = -1)", async t => {
  t.deepEqual(serializeValue([], -1), {
    type: "array",
    length: 0,
    value: []
  });
});

test("array with length (recursion = -1)", async t => {
  t.deepEqual(serializeValue(["a"], -1), {
    type: "more",
    path: [],
    serializedPath: []
  });
});

test("function (recursion = -1)", async t => {
  function fn(a, b) {
    return a + b;
  }

  t.deepEqual(serializeValue(fn, -1), {
    type: "function",
    value: undefined,
    name: fn.name
  });
});

test("undefined (recursion = -1)", async t => {
  t.deepEqual(serializeValue(undefined, -1), {
    type: "undefined",
    value: undefined
  });
});

test("null (object) (recursion = -1)", async t => {
  t.deepEqual(serializeValue(null, -1), {
    type: "object",
    value: null
  });
});

test("array (recursion = -1, depth = 1)", async t => {
  t.deepEqual(serializeValue(["a", 100, "c"], -1), {
    type: "more",
    path: [],
    serializedPath: []
  });
});

test("array (recursion = 0, depth = 1)", async t => {
  t.deepEqual(serializeValue(["a", 100, "c"], 0), {
    type: "array",
    length: 3,
    value: [
      {
        type: "string",
        value: "a"
      },
      {
        type: "number",
        value: 100
      },
      {
        type: "string",
        value: "c"
      }
    ]
  });
});

test("array (recursion = 0, depth = 2)", async t => {
  t.deepEqual(serializeValue(["a", ["b"]], 0), {
    type: "array",
    length: 2,
    value: [
      {
        type: "string",
        value: "a"
      },
      {
        type: "more",
        path: ["1"],
        serializedPath: ["value", "1"]
      }
    ]
  });
});

test("array (recursion = 1, depth = 2)", async t => {
  t.deepEqual(serializeValue(["a", ["b"]], 1), {
    type: "array",
    length: 2,
    value: [
      {
        type: "string",
        value: "a"
      },
      {
        type: "array",
        length: 1,
        value: [
          {
            type: "string",
            value: "b"
          }
        ]
      }
    ]
  });
});

test("plain object (recursion = -1, depth 1)", async t => {
  t.deepEqual(
    serializeValue(
      {
        a: 0,
        b: 1,
        c: 2
      },
      -1
    ),
    {
      type: "more",
      path: [],
      serializedPath: []
    }
  );
});

test("plain object (recursion = 0, depth = 1)", async t => {
  t.deepEqual(
    serializeValue(
      {
        a: 0,
        b: 1,
        c: 2
      },
      0
    ),
    {
      type: "object",
      value: {
        a: { type: "number", value: 0 },
        b: { type: "number", value: 1 },
        c: { type: "number", value: 2 }
      }
    }
  );
});

test("plain object (recursion = 0, depth = 2)", async t => {
  t.deepEqual(
    serializeValue(
      {
        a: 0,
        b: {
          c: 2
        }
      },
      0
    ),
    {
      type: "object",
      value: {
        a: { type: "number", value: 0 },
        b: {
          type: "more",
          path: ["b"],
          serializedPath: ["value", "b"]
        }
      }
    }
  );
});

test("plain object (recursion = 1, array depth = 2)", async t => {
  t.deepEqual(
    serializeValue(
      {
        a: 0,
        b: {
          c: 2
        }
      },
      1
    ),
    {
      type: "object",
      value: {
        a: { type: "number", value: 0 },
        b: {
          type: "object",
          value: {
            c: {
              type: "number",
              value: 2
            }
          }
        }
      }
    }
  );
});

test("error (recursion = -1)", async t => {
  const message = [...new Array(200)].map(() => "a").join("");
  const error = new Error(message);
  error.custom = 100;

  t.deepEqual(serializeValue(error, -1), {
    type: "more",
    path: [],
    serializedPath: []
  });
});

test("error (recursion = 0)", async t => {
  const message = [...new Array(200)].map(() => "a").join("");
  const error = new Error(message);
  error.custom = 100;

  t.deepEqual(serializeValue(error, 0), {
    type: "error",
    value: {
      message: {
        type: "more",
        path: ["message"],
        serializedPath: ["value", "message"]
      },
      stack: {
        type: "more",
        path: ["stack"],
        serializedPath: ["value", "stack"]
      },
      custom: { type: "number", value: error.custom }
    }
  });
});

test("error (recursion = 1)", async t => {
  const message = [...new Array(200)].map(() => "a").join("");
  const error = new Error(message);
  error.custom = 100;

  t.deepEqual(serializeValue(error, 1), {
    type: "error",
    value: {
      message: {
        type: "string",
        value: message
      },
      stack: {
        type: "string",
        value: error.stack
      },
      custom: { type: "number", value: error.custom }
    }
  });
});

test("virtual (recursion = -1, depth = 1)", async t => {
  t.deepEqual(serializeValue(<div a={0} b={1} />, -1), {
    type: "more",
    path: [],
    serializedPath: []
  });
});

test("virtual (recursion = 0, depth = 1)", async t => {
  // same as recursion = 0
  t.deepEqual(serializeValue(<div a={0} b={1} />, 0), {
    type: "virtual",
    value: {
      type: {
        type: "string",
        value: "div"
      },
      attributes: {
        a: { type: "number", value: 0 },
        b: { type: "number", value: 1 }
      },
      children: {
        type: "array",
        length: 0,
        value: []
      }
    }
  });
});

test("virtual (recursion = 0, depth = 2)", async t => {
  t.deepEqual(serializeValue(<div a={0} b={{ c: 1 }} />, 0), {
    type: "virtual",
    value: {
      type: {
        type: "string",
        value: "div"
      },
      attributes: {
        a: { type: "number", value: 0 },
        b: {
          type: "more",
          path: ["attributes", "b"],
          serializedPath: ["value", "attributes", "b"]
        }
      },
      children: {
        type: "array",
        length: 0,
        value: []
      }
    }
  });
});

test("virtual (recursion = 1, depth = 2)", async t => {
  // same as recursion = 1
  t.deepEqual(serializeValue(<div a={0} b={{ c: 1 }} />, 1), {
    type: "virtual",
    value: {
      type: {
        type: "string",
        value: "div"
      },
      attributes: {
        a: { type: "number", value: 0 },
        b: {
          type: "object",
          value: {
            c: {
              type: "number",
              value: 1
            }
          }
        }
      },
      children: {
        type: "array",
        length: 0,
        value: []
      }
    }
  });
});

test("resource (recursion = -1, short)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: 0,
    b: 1
  });

  t.deepEqual(serializeValue(resource, -1), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: { type: "string", value: resource.stringifyContent() }
    }
  });
});

test("resource (recursion = 0, short)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: 0,
    b: 1
  });

  t.deepEqual(serializeValue(resource, 0), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: { type: "string", value: resource.stringifyContent() }
    }
  });
});

test("resource (recursion = 1, short)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: 0,
    b: { c: 1 }
  });

  // same as recursion = 1
  t.deepEqual(serializeValue(resource, 1), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: { type: "string", value: resource.stringifyContent() }
    }
  });
});

test("resource (recursion = -1, long)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: [...new Array(200)].map(() => "a").join(""),
    b: 1
  });

  t.deepEqual(serializeValue(resource, -1), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: {
        type: "more",
        path: ["stringifiedContent"],
        serializedPath: ["value", "content"]
      }
    }
  });
});

test("resource (recursion = 0, long)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: [...new Array(200)].map(() => "a").join(""),
    b: 1
  });

  t.deepEqual(serializeValue(resource, 0), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: {
        type: "more",
        path: ["stringifiedContent"],
        serializedPath: ["value", "content"]
      }
    }
  });
});

test("resource (recursion = 1, long)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: [...new Array(200)].map(() => "a").join(""),
    b: 1
  });

  t.deepEqual(serializeValue(resource, 1), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: { type: "string", value: resource.stringifyContent() }
    }
  });
});

test("callNode: virtual (with result)", async t => {
  const SubComponent = () => "yes";
  const Component = () => <SubComponent />;

  const callRootContextPath = "1.3";
  const nodePath = "0.1";
  const subNodePath = "0.1.0";

  const callNode = {
    type: "virtual",
    value: <Component a={1} b={{ c: { d: 0 } }} />,
    callRootContextPath,
    path: nodePath,
    options: { debug: true, networkRetries: 2 },
    children: [
      {
        type: "virtual",
        value: <SubComponent />,
        callRootContextPath,
        path: subNodePath,
        options: { debug: true, networkRetries: 2 },
        children: [],
        result: "yes"
      }
    ],
    result: "yes"
  };

  console.log(JSON.stringify(serializeCallNode(callNode)));

  t.deepEqual(serializeCallNode(callNode), {
    type: "virtual",
    callRootContextPath,
    path: nodePath,
    value: {
      type: "virtual",
      value: {
        type: {
          type: "function",
          name: "Component",
          value: undefined
        },
        attributes: {
          a: {
            type: "number",
            value: 1
          },
          b: {
            type: "object",
            value: {
              c: {
                type: "more",
                path: [
                  callRootContextPath,
                  nodePath,
                  "value",
                  "attributes",
                  "b",
                  "c"
                ],
                serializedPath: [
                  callRootContextPath,
                  nodePath,
                  "value",
                  "value",
                  "attributes",
                  "b",
                  "value",
                  "c"
                ]
              }
            }
          }
        },
        children: {
          type: "array",
          length: 0,
          value: []
        }
      }
    },
    options: {
      debug: {
        type: "boolean",
        value: true
      },
      networkRetries: {
        type: "number",
        value: 2
      }
    },
    children: [
      {
        type: "virtual",
        callRootContextPath,
        path: subNodePath,
        value: {
          type: "virtual",
          value: {
            type: {
              type: "function",
              name: "SubComponent",
              value: undefined
            },
            attributes: {},
            children: {
              type: "array",
              length: 0,
              value: []
            }
          }
        },
        options: {
          debug: {
            type: "boolean",
            value: true
          },
          networkRetries: {
            type: "number",
            value: 2
          }
        },
        children: [],
        result: {
          type: "string",
          value: "yes"
        },
        error: {
          type: "undefined",
          value: undefined
        }
      }
    ],
    result: {
      type: "string",
      value: "yes"
    },
    error: {
      type: "undefined",
      value: undefined
    }
  });
});

test("callNode: virtual (with error)", async t => {
  const expectedErr = { message: "expected" }; // not an actual Error instance for simplicity of deepEqual comparison
  const SubComponent = () => {
    throw expectedErr;
  };
  const Component = () => <SubComponent />;

  const callRootContextPath = "1.3";
  const nodePath = "0.1";
  const subNodePath = "0.1.0";

  const callNode = {
    type: "virtual",
    value: <Component a={1} b={{ c: { d: 0 } }} />,
    callRootContextPath,
    path: nodePath,
    options: { debug: true, networkRetries: 2 },
    children: [
      {
        type: "virtual",
        value: <SubComponent />,
        callRootContextPath,
        path: subNodePath,
        options: { debug: true, networkRetries: 2 },
        children: [],
        error: expectedErr
      }
    ],
    error: expectedErr
  };

  console.log(JSON.stringify(serializeCallNode(callNode)));

  t.deepEqual(serializeCallNode(callNode), {
    type: "virtual",
    callRootContextPath,
    path: nodePath,
    value: {
      type: "virtual",
      value: {
        type: {
          type: "function",
          name: "Component",
          value: undefined
        },
        attributes: {
          a: {
            type: "number",
            value: 1
          },
          b: {
            type: "object",
            value: {
              c: {
                type: "more",
                path: [
                  callRootContextPath,
                  nodePath,
                  "value",
                  "attributes",
                  "b",
                  "c"
                ],
                serializedPath: [
                  callRootContextPath,
                  nodePath,
                  "value",
                  "value",
                  "attributes",
                  "b",
                  "value",
                  "c"
                ]
              }
            }
          }
        },
        children: {
          type: "array",
          length: 0,
          value: []
        }
      }
    },
    options: {
      debug: {
        type: "boolean",
        value: true
      },
      networkRetries: {
        type: "number",
        value: 2
      }
    },
    children: [
      {
        type: "virtual",
        callRootContextPath,
        path: subNodePath,
        value: {
          type: "virtual",
          value: {
            type: {
              type: "function",
              name: "SubComponent",
              value: undefined
            },
            attributes: {},
            children: {
              type: "array",
              length: 0,
              value: []
            }
          }
        },
        options: {
          debug: {
            type: "boolean",
            value: true
          },
          networkRetries: {
            type: "number",
            value: 2
          }
        },
        children: [],
        result: {
          type: "undefined",
          value: undefined
        },
        error: {
          type: "object",
          value: {
            message: {
              type: "string",
              value: "expected"
            }
          }
        }
      }
    ],
    result: {
      type: "undefined",
      value: undefined
    },
    error: {
      type: "object",
      value: {
        message: {
          type: "string",
          value: "expected"
        }
      }
    }
  });
});

test("loadMore", async t => {
  const context = rootContext
    .extend()
    .extend()
    .extend({ debug: true });

  const Component = ({ a, b }) => a + b.c.d;
  const virtual = <Component a={1} b={{ c: { d: 0 } }} />;

  let node;
  context.emitter.on("message", message => {
    if (message.topic === "callNode:update") {
      if (
        message.target === context &&
        typeof message.data.node.result !== "undefined"
      ) {
        node = message.data.node;
      }
    }
  });
  const output = await context.evaluate(virtual);
  t.is(output, 1);

  const serializedNode = serializeCallNode(node);

  const originalObj = node.value.attributes.b.c;
  const moreObj = serializedNode.value.value.attributes.b.value.c;

  const retrievedObj = loadMore(
    moreObj.path,
    moreObj.serializedPath,
    rootContext
  );

  t.deepEqual(
    retrievedObj,
    serializeValue(originalObj, undefined, moreObj.path, moreObj.serializedPath)
  );
});

test("loadMore: resource content (should retrieve the stringified content)", async t => {
  const context = rootContext
    .extend()
    .extend()
    .extend({ debug: true });

  const resource = rootContext.createResource("test", "application/json", {
    foo: [...new Array(200)].map(() => "a").join("") // make sure is long string when stringified (or won't be lazy loaded)
  });
  const Component = () => resource;
  const virtual = <Component />;

  let node;
  context.emitter.on("message", message => {
    if (message.topic === "callNode:update") {
      if (
        message.target === context &&
        typeof message.data.node.result !== "undefined"
      ) {
        node = message.data.node;
      }
    }
  });
  const output = await context.evaluate(virtual);
  t.is(output, resource);

  const serializedNode = serializeCallNode(node);

  const moreObj = serializedNode.result.value.content;

  const retrievedObj = loadMore(
    moreObj.path,
    moreObj.serializedPath,
    rootContext
  );

  t.deepEqual(retrievedObj.value, resource.stringifyContent());
});
