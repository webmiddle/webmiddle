import test from "ava";
import WebMiddle, { evaluate, createContext } from "../src/index";

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test("virtual -> service", async t => {
  const Service = () => "yes";
  const virtual = <Service a={10} b={20} />;

  const context = createContext(t.context.webmiddle, { debug: true });
  const output = await evaluate(context, virtual);

  t.deepEqual(context._callStateRoot, [
    {
      type: "virtual",
      value: virtual,
      options: {},
      children: [
        {
          type: "service",
          value: Service,
          options: {
            props: { a: 10, b: 20, children: [] },
            tries: 1
          },
          children: [],
          result: output
        }
      ],
      result: output
    }
  ]);
});

test("virtual -> service with retries", async t => {
  let fails = 0;
  const Service = () => {
    if (fails === 0) {
      fails += 1;
      throw new Error("expected fail");
    }
    return "yes";
  };
  const virtual = <Service a={10} b={20} />;

  const context = createContext(t.context.webmiddle, {
    debug: true,
    retries: 1
  });
  const output = await evaluate(context, virtual);

  t.deepEqual(context._callStateRoot, [
    {
      type: "virtual",
      value: virtual,
      options: {},
      children: [
        {
          type: "service",
          value: Service,
          options: {
            props: { a: 10, b: 20, children: [] },
            tries: 1
          },
          children: []
        },
        {
          type: "service",
          value: Service,
          options: {
            props: { a: 10, b: 20, children: [] },
            tries: 2
          },
          children: [],
          result: output
        }
      ],
      result: output
    }
  ]);
});

test("virtual -> service with retries and final catch", async t => {
  const Service = () => {
    throw new Error("expected fail");
  };

  const catchExpr = () => "failsafe";
  const virtual = <Service a={10} b={20} />;

  const context = createContext(t.context.webmiddle, {
    debug: true,
    retries: 1,
    catch: catchExpr
  });
  const output = await evaluate(context, virtual);

  t.deepEqual(context._callStateRoot, [
    {
      type: "virtual",
      value: virtual,
      options: {},
      children: [
        {
          type: "service",
          value: Service,
          options: {
            props: { a: 10, b: 20, children: [] },
            tries: 1
          },
          children: []
        },
        {
          type: "service",
          value: Service,
          options: {
            props: { a: 10, b: 20, children: [] },
            tries: 2
          },
          children: []
        },
        {
          type: "catch",
          value: catchExpr,
          options: {
            service: Service,
            props: { a: 10, b: 20, children: [] }
          },
          children: [],
          result: "failsafe"
        }
      ],
      result: output
    }
  ]);
});

test("service returning virtual (virtual -> service -> virtual -> service)", async t => {
  const SubService = () => "more yes!";
  const subVirtual = <SubService c={30} />;

  const Service = () => subVirtual;
  const virtual = <Service a={10} b={20} />;

  const context = createContext(t.context.webmiddle, { debug: true });
  const output = await evaluate(context, virtual);

  t.deepEqual(context._callStateRoot, [
    {
      type: "virtual",
      value: virtual,
      options: {},
      children: [
        {
          type: "service",
          value: Service,
          options: {
            props: { a: 10, b: 20, children: [] },
            tries: 1
          },
          children: [
            {
              type: "virtual",
              value: subVirtual,
              options: {},
              children: [
                {
                  type: "service",
                  value: SubService,
                  options: {
                    props: { c: 30, children: [] },
                    tries: 1
                  },
                  children: [],
                  result: output
                }
              ],
              result: output
            }
          ],
          result: subVirtual
        }
      ],
      result: output
    }
  ]);
});

test('must emit "add" events with correct paths', async t => {
  const Service = () => "yes";
  const virtual = <Service a={10} b={20} />;

  const context = createContext(t.context.webmiddle, { debug: true });

  const addData = [];
  context.rootEmitter.on("message", message => {
    if (message.topic === "callStateInfo:add") addData.push(message.data);
  });

  const output = await evaluate(context, virtual);

  t.deepEqual(addData, [
    {
      path: "0",
      info: {
        type: "virtual",
        value: virtual,
        options: {},
        children: [
          {
            type: "service",
            value: Service,
            options: {
              props: { a: 10, b: 20, children: [] },
              tries: 1
            },
            children: [],
            result: output
          }
        ],
        result: output
      }
    },
    {
      path: "0.0",
      info: {
        type: "service",
        value: Service,
        options: {
          props: { a: 10, b: 20, children: [] },
          tries: 1
        },
        children: [],
        result: output
      }
    }
  ]);
});
