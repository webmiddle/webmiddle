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

  const newContext = {
    ...context,
    _callState: callStateInfo.children,
  };

  const result = callStateInfo.result = await fn(newContext);

  return { result, context: newContext };
}
