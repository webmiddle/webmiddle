// Note: this should be called AFTER the node has been pushed
// to the parent children array
function makeCallNodePath(parentCallNode) {
  const pathPrefix = parentCallNode.path ? "." : "";
  return (
    parentCallNode.path + pathPrefix + (parentCallNode.children.length - 1)
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

export default async function addCallNode(fn, context, node) {
  if (!context.options.debug) {
    return { result: await fn(context), context };
  }

  const callNode = {
    options: context.options,
    ...node,
    children: [],
    callRootContextPath: context.path,
    path: "" // relative to callRootContextPath
  };
  context._callState.push(callNode);
  callNode.path = String(context._callState.length - 1);

  // after this, ascendant context will have updated the
  // path for this callNode (if pending call)
  emitBubble(context, "internal", "callNode:add:before", {
    node: callNode
  });

  emitBubble(context, "message", "callNode:add", {
    node: callNode
  });

  const newContext = context.extend();

  // listen for new callNodes in the new context or in its descendants,
  // to setup the parent/children link
  const handleMessage = (message, stopPropagation) => {
    if (message.topic === "callNode:add:before") {
      const newCallNode = message.data.node;
      newCallNode.callRootContextPath = callNode.callRootContextPath;
      callNode.children.push(newCallNode);
      newCallNode.path = makeCallNodePath(callNode);
      // stop bubbling to prevent other ascendants from linking this callNode
      stopPropagation();
    }
  };
  newContext.emitter.on("internal", handleMessage);

  try {
    callNode.result = await fn(newContext);
  } catch (err) {
    callNode.error = err;
  } finally {
    newContext.emitter.removeListener("internal", handleMessage);
  }

  // result/error is ready => notify
  emitBubble(context, "message", "callNode:update", {
    node: callNode
  });

  if (callNode.error) {
    throw callNode.error;
  }

  return { result: callNode.result, context: newContext };
}
