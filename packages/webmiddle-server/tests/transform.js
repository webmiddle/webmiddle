import test from "ava";
import { transformValue, transformCallStateInfo } from "../src/utils/transform";
import { rootContext } from "webmiddle";

test("number (recursion = 0)", async t => {
  t.deepEqual(transformValue(10, 0), {
    type: "number",
    value: 10
  });
});

test("string (recursion = 0, short)", async t => {
  t.deepEqual(transformValue("abc", 0), {
    type: "string",
    value: "abc"
  });
});

test("string (recursion = 0, long)", async t => {
  const longString = [...Array(101)].map(() => "a").join("");
  t.deepEqual(transformValue(longString, 0), {
    type: "more"
  });
});

test("boolean (recursion = 0)", async t => {
  t.deepEqual(transformValue(true, 0), {
    type: "boolean",
    value: true
  });

  t.deepEqual(transformValue(false, 0), {
    type: "boolean",
    value: false
  });
});

test("array with zero length (recursion = 0)", async t => {
  t.deepEqual(transformValue([], 0), {
    type: "array",
    length: 0,
    value: []
  });
});

test("array with length (recursion = 0)", async t => {
  t.deepEqual(transformValue(["a"], 0), {
    type: "more"
  });
});

test("function (recursion = 0)", async t => {
  function fn(a, b) {
    return a + b;
  }

  t.deepEqual(transformValue(fn, 0), {
    type: "function",
    value: undefined,
    name: fn.name
  });
});

test("undefined (recursion = 0)", async t => {
  t.deepEqual(transformValue(undefined, 0), {
    type: "undefined",
    value: undefined
  });
});

test("null (object) (recursion = 0)", async t => {
  t.deepEqual(transformValue(null, 0), {
    type: "object",
    value: null
  });
});

test("array (recursion = 0, depth = 1)", async t => {
  t.deepEqual(transformValue(["a", 100, "c"], 0), {
    type: "more"
  });
});

test("array (recursion = 1, depth = 1)", async t => {
  t.deepEqual(transformValue(["a", 100, "c"], 1), {
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
        type: "more"
      }
    ]
  });
});

test("array (recursion = 2, depth = 2)", async t => {
  t.deepEqual(transformValue(["a", ["b"]], 2), {
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

test("plain object (recursion = 0, depth 1)", async t => {
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
      type: "more"
    }
  );
});

test("plain object (recursion = 1, depth = 1)", async t => {
  t.deepEqual(
    transformValue(
      {
        a: 0,
        b: 1,
        c: 2
      },
      1
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

test("plain object (recursion = 1, depth = 2)", async t => {
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
        b: { type: "more" }
      }
    }
  );
});

test("plain object (recursion = 2, array depth = 2)", async t => {
  t.deepEqual(
    transformValue(
      {
        a: 0,
        b: {
          c: 2
        }
      },
      2
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

test("virtual (recursion = 0, depth = 1)", async t => {
  t.deepEqual(transformValue(<div a={0} b={1} />, 0), {
    type: "more"
  });
});

test("virtual (recursion = 1, depth = 1)", async t => {
  // same as recursion = 0
  t.deepEqual(transformValue(<div a={0} b={1} />, 1), {
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

test("virtual (recursion = 1, depth = 2)", async t => {
  t.deepEqual(transformValue(<div a={0} b={{ c: 1 }} />, 1), {
    type: "virtual",
    value: {
      type: {
        type: "string",
        value: "div"
      },
      attributes: {
        a: { type: "number", value: 0 },
        b: { type: "more" }
      },
      children: {
        type: "array",
        length: 0,
        value: []
      }
    }
  });
});

test("virtual (recursion = 2, depth = 2)", async t => {
  // same as recursion = 1
  t.deepEqual(transformValue(<div a={0} b={{ c: 1 }} />, 2), {
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

test("resource (recursion = 0, depth = 1)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: 0,
    b: 1
  });

  t.deepEqual(transformValue(resource, 0), {
    type: "more"
  });
});

test("resource (recursion = 1, depth = 1)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: 0,
    b: 1
  });

  // same as recursion = 0
  t.deepEqual(transformValue(resource, 1), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: { type: "more" }
    }
  });
});

test("resource (recursion = 1, depth = 2)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: 0,
    b: { c: 1 }
  });

  // same as depth = 1
  t.deepEqual(transformValue(resource, 1), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: { type: "more" }
    }
  });
});

test("resource (recursion = 2, depth = 2)", async t => {
  const resource = rootContext.createResource("result", "application/json", {
    a: 0,
    b: { c: 1 }
  });

  // same as recursion = 1
  t.deepEqual(transformValue(resource, 2), {
    type: "resource",
    value: {
      id: resource.id,
      name: resource.name,
      contentType: resource.contentType,
      content: {
        type: "object",
        value: {
          a: { type: "number", value: 0 },
          b: { type: "more" }
        }
      }
    }
  });
});

test("callStateInfo: virtual", async t => {
  const Service = () => "yes";

  console.log(
    JSON.stringify(
      transformCallStateInfo({
        type: "virtual",
        value: <Service a={1} />,
        options: {},
        children: [],
        result: "yes"
      })
    )
  );

  t.deepEqual(
    transformCallStateInfo({
      type: "virtual",
      value: <Service a={1} />,
      options: {},
      children: [],
      result: "yes"
    }),
    {
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
          }
        },
        children: {
          type: "array",
          length: 0,
          value: []
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
