import EventEmitter from "events";
import CookieManager from "webmiddle-manager-cookie";

global.webmiddle = global.webmiddle || {
  cookieManager: new CookieManager()
};

// createContext()
// createContext(options)
// createContext(parentContext, options)
export default function createContext(...args) {
  const parentContext = args[0] && args[0]._isContext ? args[0] : null;
  const options = (args[0] && args[0]._isContext ? args[1] : args[0]) || {};

  if (parentContext) {
    return {
      ...parentContext,
      options: {
        ...parentContext.options,
        ...options
      }
    };
  }

  const callState = [];
  return {
    _isContext: true,
    _callState: callState,
    _callStateParentPath: "",
    _callStateRoot: callState,
    rootEmitter: new EventEmitter(),

    cookieManager: global.webmiddle.cookieManager,
    log(...args) {
      if (this.options.verbose) console.log(...args);
    },
    options
  };
}
