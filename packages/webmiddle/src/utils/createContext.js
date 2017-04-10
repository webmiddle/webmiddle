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
  return {
    _isContext: true,
    webmiddle: webmiddleOrContext,
    options,
  };
}
