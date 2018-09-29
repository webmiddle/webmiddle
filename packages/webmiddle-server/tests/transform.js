import test from "ava";
import {
  transformValue,
  transformCallStateInfo,
  loadMore
} from "../src/utils/transform";
import { rootContext } from "webmiddle";

test("number (recursion = -1)", async t => {
  t.deepEqual(transformValue(10, -1), {
    type: "number",
    value: 10
  });
});

test("string (recursion = -1, short)", async t => {
  t.deepEqual(transformValue("abc", -1), {
    type: "string",
    value: "abc"
  });
});

test("string (recursion = -1, long)", async t => {
  const longString = [...Array(101)].map(() => "a").join("");
  t.deepEqual(transformValue(longString, -1), {
    type: "more",
    path: [],
    transformedPath: []
  });
});

test("boolean (recursion = -1)", async t => {
  t.deepEqual(transformValue(true, -1), {
    type: "boolean",
    value: true
  });

  t.deepEqual(transformValue(false, -1), {
    type: "boolean",
    value: false
  });
});

test("array with zero length (recursion = -1)", async t => {
  t.deepEqual(transformValue([], -1), {
    type: "array",
    length: 0,
    value: []
  });
});

test("array with length (recursion = -1)", async t => {
  t.deepEqual(transformValue(["a"], -1), {
    type: "more",
    path: [],
    transformedPath: []
  });
});

test("function (recursion = -1)", async t => {
  function fn(a, b) {
    return a + b;
  }

  t.deepEqual(transformValue(fn, -1), {
    type: "function",
    value: undefined,
    name: fn.name
  });
});

test("undefined (recursion = -1)", async t => {
  t.deepEqual(transformValue(undefined, -1), {
    type: "undefined",
    value: undefined
  });
});

test("null (object) (recursion = -1)", async t => {
  t.deepEqual(transformValue(null, -1), {
    type: "object",
    value: null
  });
});

test("array (recursion = -1, depth = 1)", async t => {
  t.deepEqual(transformValue(["a", 100, "c"], -1), {
    type: "more",
    path: [],
    transformedPath: []
  });
});

test("array (recursion = 0, depth = 1)", async t => {
  t.deepEqual(transformValue(["a", 100, "c"], 0), {
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
  t.deepEqual(transformValue(["a", ["b"]], 0), {
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
        transformedPath: ["value", "1"]
      }
    ]
  });
});

test("array (recursion = 1, depth = 2)", async t => {
  t.deepEqual(transformValue(["a", ["b"]], 1), {
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
    transformValue(
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
      transformedPath: []
    }
  );
});

test("plain object (recursion = 0, depth = 1)", async t => {
  t.deepEqual(
    transformValue(
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
    transformValue(
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
          transformedPath: ["value", "b"]
        }
      }
    }
  );
});

test("plain object (recursion = 1, array depth = 2)", async t => {
  t.deepEqual(
    transformValue(
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

test("virtual (recursion = -1, depth = 1)", async t => {
  t.deepEqual(transformValue(<div a={0} b={1} />, -1), {
    type: "more",
    path: [],
    transformedPath: []
  });
});

test("virtual (recursion = 0, depth = 1)", async t => {
  // same as recursion = 0
  t.deepEqual(transformValue(<div a={0} b={1} />, 0), {
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
  t.deepEqual(transformValue(<div a={0} b={{ c: 1 }} />, 0), {
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
          transformedPath: ["value", "attributes", "b"]
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
  t.deepEqual(transformValue(<div a={0} b={{ c: 1 }} />, 1), {
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

  t.deepEqual(transformValue(resource, -1), {
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

  t.deepEqual(transformValue(resource, 0), {
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
  t.deepEqual(transformValue(resource, 1), {
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

  t.deepEqual(transformValue(resource, -1), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: {
        type: "more",
        path: ["stringifiedContent"],
        transformedPath: ["value", "content"]
      }
    }
  });
});

test("resource (recursion = 0, long)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: [...new Array(200)].map(() => "a").join(""),
    b: 1
  });

  t.deepEqual(transformValue(resource, 0), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: {
        type: "more",
        path: ["stringifiedContent"],
        transformedPath: ["value", "content"]
      }
    }
  });
});

test("resource (recursion = 1, long)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: [...new Array(200)].map(() => "a").join(""),
    b: 1
  });

  t.deepEqual(transformValue(resource, 1), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: { type: "string", value: resource.stringifyContent() }
    }
  });
});

test("callStateInfo: virtual", async t => {
  const Service = () => "yes";

  const callRootContextPath = "1.3";
  const infoPath = "0.1";

  console.log(
    JSON.stringify(
      transformCallStateInfo({
        type: "virtual",
        value: <Service a={1} b={{ c: { d: 0 } }} />,
        callRootContextPath,
        path: infoPath,
        options: {},
        children: [],
        result: "yes"
      })
    )
  );

  t.deepEqual(
    transformCallStateInfo({
      type: "virtual",
      value: <Service a={1} b={{ c: { d: 0 } }} />,
      callRootContextPath,
      path: infoPath,
      options: {},
      children: [],
      result: "yes"
    }),
    {
      type: "virtual",
      callRootContextPath,
      path: infoPath,
      value: {
        type: "virtual",
        value: {
          type: {
            type: "function",
            name: "Service",
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
                    infoPath,
                    "value",
                    "attributes",
                    "b",
                    "c"
                  ],
                  transformedPath: [
                    callRootContextPath,
                    infoPath,
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
      options: {},
      children: [],
      result: {
        type: "string",
        value: "yes"
      }
    }
  );
});

test("loadMore", async t => {
  const context = rootContext
    .extend()
    .extend()
    .extend({ debug: true });

  const Service = ({ a, b }) => a + b.c.d;
  const virtual = <Service a={1} b={{ c: { d: 0 } }} />;

  let info;
  context.emitter.on("message", message => {
    if (message.topic === "callStateInfo:update") {
      if (
        message.target === context &&
        typeof message.data.info.result !== "undefined"
      ) {
        info = message.data.info;
      }
    }
  });
  const output = await context.evaluate(virtual);
  t.is(output, 1);

  const transformedInfo = transformCallStateInfo(info);

  const originalObj = info.value.attributes.b.c;
  const moreObj = transformedInfo.value.value.attributes.b.value.c;

  const retrievedObj = loadMore(
    moreObj.path,
    moreObj.transformedPath,
    rootContext
  );

  t.deepEqual(
    retrievedObj,
    transformValue(
      originalObj,
      undefined,
      moreObj.path,
      moreObj.transformedPath
    )
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
  const Service = () => resource;
  const virtual = <Service />;

  let info;
  context.emitter.on("message", message => {
    if (message.topic === "callStateInfo:update") {
      if (
        message.target === context &&
        typeof message.data.info.result !== "undefined"
      ) {
        info = message.data.info;
      }
    }
  });
  const output = await context.evaluate(virtual);
  t.is(output, resource);

  const transformedInfo = transformCallStateInfo(info);

  const moreObj = transformedInfo.result.value.content;

  const retrievedObj = loadMore(
    moreObj.path,
    moreObj.transformedPath,
    rootContext
  );

  t.deepEqual(retrievedObj.value, resource.stringifyContent());
});
