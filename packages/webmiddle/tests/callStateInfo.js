import test from "ava";
import { rootContext, ErrorBoundary } from "../src/index";

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("virtual (service)", async t => {
  const Service = () => "yes";
  const virtual = <Service a={10} b={20} />;

  const context = t.context.context.extend({ debug: true });
  const output = await context.evaluate(virtual);

  t.deepEqual(context._callState, [
    {
      type: "virtual",
      value: virtual,
      options: {},
      children: [],
      path: "0",
      result: output
    }
  ]);
});

// the tries and catch should show as a list
test("virtual (service) with retries and final catch", async t => {
  let tries = 0;
  const retries = 3;

  const Service = () => {
    tries++;
    throw new Error("expected fail");
  };

  const virtual = (
    <ErrorBoundary retries={retries} handleCatch={() => "fallback"}>
      <Service a={10} b={20} />
    </ErrorBoundary>
  );

  const context = t.context.context.extend({
    debug: true
  });

  const output = await context.evaluate(virtual);

  const errorBoundaryCallStateInfo = context._callState[0];
  t.is(errorBoundaryCallStateInfo.type, "virtual");
  t.is(typeof errorBoundaryCallStateInfo.value.type, "function");
  t.is(errorBoundaryCallStateInfo.value.type.name, "ErrorBoundary");

  //console.log(JSON.stringify(errorBoundaryCallStateInfo.children.map(child => child.value.type.name), null, 2));

  // the last child should be the Catch
  const catchCallStateInfo =
    errorBoundaryCallStateInfo.children[
      errorBoundaryCallStateInfo.children.length - 1
    ];
  t.is(catchCallStateInfo.type, "virtual");
  t.is(typeof catchCallStateInfo.value.type, "function");
  t.is(catchCallStateInfo.value.type.name, "Catch");

  // the previous childs should be the tries
  errorBoundaryCallStateInfo.children.slice(0, -1).forEach(child => {
    t.is(child.type, "virtual");
    t.is(typeof child.value.type, "function");
    t.is(child.value.type.name, "Try");
  });

  t.is(errorBoundaryCallStateInfo.children.length, tries + 1); // +1 for the catch
});

// the virtual immediately returned by a service should be evaluated recursively
// (i.e. the virtual callState should be a children of the service callState)
test("service returning virtual (virtual (service) -> virtual (service)", async t => {
  const SubService = () => "more yes!";
  const subVirtual = <SubService c={30} />;

  const Service = () => subVirtual;
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
          type: "virtual",
          value: subVirtual,
          options: {},
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
        children: [],
        path: "0",
        result: output
      }
    }
  ]);
});

test('must emit "add" events that can be traced back to the original objects', async t => {
  const Service = () => "yes";
  const virtual = <Service a={10} b={20} />;

  const context = t.context.context.extend({ debug: true });

  const addData = [];
  const contextPathData = [];
  context.emitter.on("message", message => {
    if (message.topic === "callStateInfo:add") {
      addData.push(message.data);
      contextPathData.push(message.contextPath);
    }
  });

  const output = await context.evaluate(virtual);

  for (let i = 0; i < addData.length; i++) {
    // find the root context of the call state chain
    const contextPath = contextPathData[i];
    const contextPathParts = contextPath.split(".");
    let callStateRootContext = rootContext;
    contextPathParts.forEach(childIndex => {
      callStateRootContext = callStateRootContext.children[childIndex];
    });

    // find the call state info
    const callStateInfoPath = addData[i].path;
    const callStateInfoPathParts = callStateInfoPath.split(".");
    let callStateInfo =
      callStateRootContext._callState[callStateInfoPathParts[0]]; // callStateInfo path is never empty
    callStateInfoPathParts.slice(1).forEach(childIndex => {
      callStateInfo = callStateInfo.children[childIndex];
    });

    t.is(callStateInfo, addData[i].info);
    t.is(callStateInfo.path, addData[i].path);
  }
});

test("context should have separate call state chain", async t => {
  const baseContext = rootContext.extend({ debug: true });
  const childContext = baseContext.extend();

  const Service = () => "yes";
  const virtual = <Service a={10} b={20} />;
  const output = await childContext.evaluate(virtual);

  t.is(baseContext._callState.length, 0);
  t.not(childContext._callState.length, 0);
});
