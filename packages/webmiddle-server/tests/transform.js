import WebMiddle from "webmiddle";
import test from "ava";
import { transformValue, transformCallStateInfo } from "../src/utils/transform";

test("number", async t => {
  t.deepEqual(transformValue(10), {
    type: "number",
    value: 10
  });
});

test("string", async t => {
  t.deepEqual(transformValue("abc"), {
    type: "string",
    value: "abc"
  });
});

test("boolean", async t => {
  t.deepEqual(transformValue(true), {
    type: "boolean",
    value: true
  });

  t.deepEqual(transformValue(false), {
    type: "boolean",
    value: false
  });
});

test("undefined", async t => {
  t.deepEqual(transformValue(undefined), {
    type: "undefined",
    value: undefined
  });
});

test("null (object)", async t => {
  t.deepEqual(transformValue(null), {
    type: "object",
    value: null
  });
});

test("function", async t => {
  function fn() {
    return "whatever";
  }

  t.deepEqual(transformValue(fn), {
    type: "function",
    value: undefined,
    name: fn.name
  });
});

test("array (recursion = 0, depth = 1)", async t => {
  t.deepEqual(transformValue(["a", 100, "c"], 0), {
    type: "array",
    length: 3,
    value: undefined
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
        type: "array",
        length: 1,
        value: undefined // not enough recursion
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
      type: "object",
      value: undefined
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
        b: { type: "object", value: undefined }
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
        value: undefined
      }
    }
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
        value: undefined
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
        b: {
          type: "object",
          value: undefined
        }
      },
      children: {
        type: "array",
        length: 0,
        value: undefined
      }
    }
  });
});

test("virtual (recursion = 2, depth = 2)", async t => {
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
          value: undefined
        }
      },
      children: {
        type: "array",
        length: 0,
        value: undefined
      }
    }
  });
});

test("resource (recursion = 0, depth = 1)", async t => {
  t.deepEqual(
    transformValue(
      {
        name: "result",
        contentType: "application/json",
        content: { a: 0, b: 1 }
      },
      0
    ),
    {
      type: "resource",
      value: {
        name: "result",
        contentType: "application/json",
        content: {
          type: "object",
          value: undefined
        }
      }
    }
  );
});

test("resource (recursion = 1, depth = 1)", async t => {
  // same as recursion = 0
  t.deepEqual(
    transformValue(
      {
        name: "result",
        contentType: "application/json",
        content: { a: 0, b: 1 }
      },
      1
    ),
    {
      type: "resource",
      value: {
        name: "result",
        contentType: "application/json",
        content: {
          type: "object",
          value: undefined
        }
      }
    }
  );
});

test("resource (recursion = 1, depth = 2)", async t => {
  // same as depth = 1
  t.deepEqual(
    transformValue(
      {
        name: "result",
        contentType: "application/json",
        content: { a: 0, b: { c: 1 } }
      },
      1
    ),
    {
      type: "resource",
      value: {
        name: "result",
        contentType: "application/json",
        content: {
          type: "object",
          value: undefined
        }
      }
    }
  );
});

test("resource (recursion = 2, depth = 2)", async t => {
  // same as recursion = 1
  t.deepEqual(
    transformValue(
      {
        name: "result",
        contentType: "application/json",
        content: { a: 0, b: { c: 1 } }
      },
      1
    ),
    {
      type: "resource",
      value: {
        name: "result",
        contentType: "application/json",
        content: {
          type: "object",
          value: undefined
        }
      }
    }
  );
});

test("callStateInfo: service", async t => {
  t.deepEqual(
    transformCallStateInfo({
      type: "service",
      value: function fn() {},
      options: {
        props: { a: 0, b: { c: 1 } },
        tries: 1
      },
      children: []
    }),
    {
      type: "service",
      value: {
        type: "function",
        name: "fn",
        value: undefined
      },
      options: {
        props: {
          a: { type: "number", value: 0 },
          b: {
            type: "object",
            value: undefined
          }
        },
        tries: 1
      },
      children: []
    }
  );
});

test("callStateInfo: virtual", async t => {
  const Service = () => {};

  console.log(
    JSON.stringify(
      transformCallStateInfo({
        type: "virtual",
        value: <Service a={1} />,
        options: {},
        children: []
      })
    )
  );

  t.deepEqual(
    transformCallStateInfo({
      type: "virtual",
      value: <Service a={1} />,
      options: {},
      children: []
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
          value: undefined
        }
      },
      options: {},
      children: []
    }
  );
});
