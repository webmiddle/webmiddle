// HACK: transpile JSX by using the src webmiddle object
// instead that the compiled one obtained by the default require('webmiddle')
import webmiddle from "../src/index.js";
global.webmiddle = webmiddle;

import test from "ava";
import { rootContext, ErrorBoundary } from "../src/index";

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("virtual (component)", async t => {
  const Component = () => "yes";
  const virtual = <Component a={10} b={20} />;

  const context = t.context.context.extend({ debug: true });
  const output = await context.evaluate(virtual);

  t.deepEqual(context._callState, [
    {
      type: "virtual",
      value: virtual,
      options: {},
      children: [],
      callRootContextPath: context.path,
      path: "0",
      result: output
    }
  ]);
});

// the tries and catch should show as a list
test("virtual (component) with retries and final catch", async t => {
  let tries = 0;
  const retries = 3;

  const Component = () => {
    tries++;
    throw new Error("expected fail");
  };

  const virtual = (
    <ErrorBoundary retries={retries} handleCatch={() => "fallback"}>
      <Component a={10} b={20} />
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

// the virtual immediately returned by a component should be evaluated recursively
// (i.e. the virtual callState should be a children of the component callState)
test("component returning virtual (virtual (component) -> virtual (component)", async t => {
  const SubComponent = () => "more yes!";
  const subVirtual = <SubComponent c={30} />;

  const Component = () => subVirtual;
  const virtual = <Component a={10} b={20} />;

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
          callRootContextPath: context.path,
          path: "0.0",
          result: output
        }
      ],
      callRootContextPath: context.path,
      path: "0",
      result: output
    }
  ]);
});

test('must emit "add" events with correct paths', async t => {
  const Component = () => "yes";
  const virtual = <Component a={10} b={20} />;

  const context = t.context.context.extend({ debug: true });

  const addData = [];
  context.emitter.on("message", message => {
    if (message.topic === "callStateInfo:add") addData.push(message.data);
  });

  const output = await context.evaluate(virtual);

  t.deepEqual(addData, [
    {
      info: {
        type: "virtual",
        value: virtual,
        options: {},
        children: [],
        callRootContextPath: context.path,
        path: "0",
        result: output
      }
    }
  ]);
});

test('must emit "add" events that can be traced back to the original objects', async t => {
  // NOTE: make sure to test deep levels of virtual calls
  // (to make sure paths are generated correctly)
  const SubComponent = () => "yes";
  const Component = ({ a, ...rest }) =>
    a >= 0 ? <Component {...rest} a={a - 1} /> : <SubComponent />;
  const virtual = <Component a={10} b={20} />;

  const context = t.context.context.extend({ debug: true });

  const addData = [];
  context.emitter.on("message", message => {
    if (message.topic === "callStateInfo:add") {
      addData.push(message.data);
    }
  });

  const output = await context.evaluate(virtual);

  for (let i = 0; i < addData.length; i++) {
    // find the root context of the call state chain
    const contextPath = addData[i].info.callRootContextPath;
    const contextPathParts = contextPath.split(".");
    let callStateRootContext = rootContext;
    contextPathParts.forEach(childIndex => {
      callStateRootContext = callStateRootContext.children[childIndex];
    });

    // find the call state info
    const callStateInfoPath = addData[i].info.path;
    const callStateInfoPathParts = callStateInfoPath.split(".");
    let callStateInfo =
      callStateRootContext._callState[callStateInfoPathParts[0]]; // callStateInfo path is never empty
    callStateInfoPathParts.slice(1).forEach(childIndex => {
      callStateInfo = callStateInfo.children[childIndex];
    });

    t.is(callStateInfo, addData[i].info);
  }
});

test('must emit "update" events with correct results', async t => {
  const Component = () => "yes";
  const virtual = <Component a={10} b={20} />;

  const context = t.context.context.extend({ debug: true });

  const updateResults = [];
  context.emitter.on("message", message => {
    if (message.topic === "callStateInfo:update") {
      if (
        message.target === context &&
        typeof message.data.info.result !== "undefined"
      ) {
        updateResults.push(message.data.info.result);
      }
    }
  });

  const output = await context.evaluate(virtual);

  t.deepEqual(updateResults, [output]);
});

test('must emit "update" events with correct errors', async t => {
  const expectedErr = new Error("expected");
  const Component = () => {
    throw expectedErr;
  };
  const virtual = <Component />;

  const context = t.context.context.extend({ debug: true });

  const updateErrors = [];
  context.emitter.on("message", message => {
    if (message.topic === "callStateInfo:update") {
      if (
        message.target === context &&
        typeof message.data.info.error !== "undefined"
      ) {
        updateErrors.push(message.data.info.error);
      }
    }
  });

  try {
    await context.evaluate(virtual);
  } catch (err) {
    if (err !== expectedErr) throw err;
  }

  t.is(updateErrors.length, 1);
  t.is(updateErrors[0], expectedErr);
});

test("context should have separate call state chain", async t => {
  const baseContext = rootContext.extend({ debug: true });
  const childContext = baseContext.extend();

  const Component = () => "yes";
  const virtual = <Component a={10} b={20} />;
  const output = await childContext.evaluate(virtual);

  t.is(baseContext._callState.length, 0);
  t.not(childContext._callState.length, 0);
});

test("should not emit messages when not in debug mode", async t => {
  const Component = () => "yes";
  const virtual = <Component a={10} b={20} />;

  const context = t.context.context.extend({ debug: false });

  const messages = [];
  context.emitter.on("message", message => {
    messages.push(message);
  });

  const output = await context.evaluate(virtual);

  t.deepEqual(messages, []);
});
