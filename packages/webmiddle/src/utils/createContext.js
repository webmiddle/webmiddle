import EventEmitter from "events";
import CookieManager from "webmiddle-manager-cookie";
import evaluate from "./evaluate";

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

    cookieManager: new CookieManager(),
    extend(options) {
      return createContext(this, options);
    },
    evaluate(value) {
      return evaluate(this, value);
    },
    log(...args) {
      if (this.options.verbose) console.log(...args);
    },
    options
  };
}
