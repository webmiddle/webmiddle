import test from "ava";
import { rootContext } from "../src/index";

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("virtual -> service", async t => {
  const Service = () => "yes";
  const virtual = <Service a={10} b={20} />;

  const context = t.context.context.extend({ debug: true });
  const output = await context.evaluate(virtual);

  t.deepEqual(context._callState, [
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
          path: "0.0",
          result: output
        }
      ],
      path: "0",
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

  const context = t.context.context.extend({
    debug: true,
    retries: 1
  });
  const output = await context.evaluate(virtual);

  t.deepEqual(context._callState, [
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
          path: "0.0"
        },
        {
          type: "service",
          value: Service,
          options: {
            props: { a: 10, b: 20, children: [] },
            tries: 2
          },
          children: [],
          path: "0.1",
          result: output
        }
      ],
      path: "0",
      result: output
    }
  ]);
});

// the tries should show as a list
test("virtual -> service with retries and final catch", async t => {
  const Service = () => {
    throw new Error("expected fail");
  };

  const catchExpr = () => "failsafe";
  const virtual = <Service a={10} b={20} />;

  const context = t.context.context.extend({
    debug: true,
    retries: 1,
    catch: catchExpr
  });
  const output = await context.evaluate(virtual);

  t.deepEqual(context._callState, [
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
          path: "0.0"
        },
        {
          type: "service",
          value: Service,
          options: {
            props: { a: 10, b: 20, children: [] },
            tries: 2
          },
          children: [],
          path: "0.1"
        },
        {
          type: "catch",
          value: catchExpr,
          options: {
            service: Service,
            props: { a: 10, b: 20, children: [] }
          },
          children: [],
          path: "0.2",
          result: "failsafe"
        }
      ],
      path: "0",
      result: output
    }
  ]);
});

// the virtual immediately returned by a service should be evaluated recursively
// (i.e. the virtual callState should be a children of the service callState)
test("service returning virtual (virtual -> service -> virtual -> service)", async t => {
  const SubService = () => "more yes!";
  const subVirtual = <SubService c={30} />;

  const Service = () => subVirtual;
  const virtual = <Service a={10} b={20} />;

  const context = t.context.context.extend({ debug: true });
  const output = await context.evaluate(virtual);

  console.log(JSON.stringify(context._callState, null, 2));

  t.deepEqual(context._callState, [
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
                  path: "0.0.0.0",
                  result: output
                }
              ],
              path: "0.0.0",
              result: output
            }
          ],
          path: "0.0",
          result: output
        }
      ],
      path: "0",
      result: output
    }
  ]);
});

test('must emit "add" events with correct paths', async t => {
  const Service = () => "yes";
  const virtual = <Service a={10} b={20} />;

  const context = t.context.context.extend({ debug: true });

  const addData = [];
  context.emitter.on("message", message => {
    if (message.topic === "callStateInfo:add") addData.push(message.data);
  });

  const output = await context.evaluate(virtual);

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
            path: "0.0",
            result: output
          }
        ],
        path: "0",
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
        path: "0.0",
        result: output
      }
    }
  ]);
});
