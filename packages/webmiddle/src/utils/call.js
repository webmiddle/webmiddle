// Note: this should be called AFTER the info has been pushed
function makeCallStateInfoPath(context) {
  const pathPrefix = context._callStateParentPath ? '.' : '';
  return context._callStateParentPath + pathPrefix + (context._callState.length - 1);
}

export default async function call(fn, context, info) {
  if (process.env.NODE_ENV === 'production') {
    return { result: await fn(context), context };
  }

  const callStateInfo = {
    options: {},
    children: [],
    ...info,
  };
  context._callState.push(callStateInfo);

  const callStateInfoPath = makeCallStateInfoPath(context);

  context._rootEmitter.emit('callStateInfo:add', {
    path: callStateInfoPath,
    info: callStateInfo,
  });

  const newContext = {
    ...context,
    _callState: callStateInfo.children,
    _callStateParentPath: callStateInfoPath,
  };

  const result = callStateInfo.result = await fn(newContext);

  return { result, context: newContext };
}
