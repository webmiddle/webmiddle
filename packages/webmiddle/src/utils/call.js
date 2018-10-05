// Note: this should be called AFTER the info has been pushed
// to the parent children array
function makeCallStateInfoPath(parentCallStateInfo) {
  const pathPrefix = parentCallStateInfo.path ? "." : "";
  return (
    parentCallStateInfo.path +
    pathPrefix +
    (parentCallStateInfo.children.length - 1)
  );
}

function emitBubble(context, eventName, topic, data) {
  const target = context;
  let propagationStopped = false;
  const stopPropagation = () => {
    propagationStopped = true;
  };
  while (context) {
    context.emitter.emit(
      eventName,
      {
        topic,
        data,
        target
      },
      stopPropagation
    );
    if (propagationStopped) break;
    context = context.parent;
  }
}

export default async function call(fn, context, info) {
  if (!context.options.debug) {
    return { result: await fn(context), context };
  }

  const callStateInfo = {
    options: {},
    ...info,
    children: [],
    callRootContextPath: context.path,
    path: "" // relative to callRootContextPath
  };
  context._callState.push(callStateInfo);
  callStateInfo.path = String(context._callState.length - 1);

  // after this, ascendant context will have updated the
  // path for this callStateInfo (if pending call)
  emitBubble(context, "internal", "callStateInfo:add:before", {
    info: callStateInfo
  });

  emitBubble(context, "message", "callStateInfo:add", {
    info: callStateInfo
  });

  const newContext = context.extend();

  // listen for new callStateInfos in the new context or in its descendants,
  // to setup the parent/children link
  const handleMessage = (message, stopPropagation) => {
    if (message.topic === "callStateInfo:add:before") {
      const newCallStateInfo = message.data.info;
      newCallStateInfo.callRootContextPath = callStateInfo.callRootContextPath;
      callStateInfo.children.push(newCallStateInfo);
      newCallStateInfo.path = makeCallStateInfoPath(callStateInfo);
      // stop bubbling to prevent other ascendants from linking this callStateInfo
      stopPropagation();
    }
  };
  newContext.emitter.on("internal", handleMessage);

  try {
    callStateInfo.result = await fn(newContext);
  } catch (err) {
    callStateInfo.error = err;
  } finally {
    newContext.emitter.removeListener("internal", handleMessage);
  }

  // result/error is ready => notify
  emitBubble(context, "message", "callStateInfo:update", {
    info: callStateInfo
  });

  if (callStateInfo.error) {
    throw callStateInfo.error;
  }

  return { result: callStateInfo.result, context: newContext };
}
