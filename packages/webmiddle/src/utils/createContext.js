import EventEmitter from 'events';

export default function createContext(webmiddleOrContext, options = {}) {
  if (webmiddleOrContext._isContext) {
    return {
      ...webmiddleOrContext,
      options: {
        ...webmiddleOrContext.options,
        ...options,
      },
    };
  }

  const callState = [];
  return {
    _isContext: true,
    _callState: callState,
    _callStateParentPath: '',
    _callStateRoot: callState,
    rootEmitter: new EventEmitter(),

    webmiddle: webmiddleOrContext,
    options,
  };
}
