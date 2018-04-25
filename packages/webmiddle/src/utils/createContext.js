import EventEmitter from "events";
import CookieManager from "webmiddle-manager-cookie";
import evaluate from "./evaluate";
import { createResource } from "./resource";
import { createVirtual, isVirtual } from "./virtual";

// Note: this should be called AFTER the context has been pushed
// to the parent children array
function makeContextPath(parentContext) {
  const pathPrefix = parentContext.path ? "." : "";
  return parentContext.path + pathPrefix + (parentContext.children.length - 1);
}

// createContext()
// createContext(options)
// createContext(parentContext, options)
export default function createContext(...args) {
  const parentContext = args[0] && args[0]._isContext ? args[0] : null;
  const options = (args[0] && args[0]._isContext ? args[1] : args[0]) || {};

  if (parentContext) {
    const context = {
      ...parentContext,
      _callState: [],
      parent: parentContext,
      children: [],
      path: "",
      emitter: new EventEmitter(),
      options: {
        ...parentContext.options,
        ...options
      }
    };
    parentContext.children.push(context);
    context.path = makeContextPath(parentContext);
    return context;
  }

  const callState = [];
  const context = {
    _isContext: true,
    _callState: callState,
    parent: null,
    children: [],
    path: "",
    emitter: new EventEmitter(),
    resources: [],

    cookieManager: new CookieManager(),
    extend(options) {
      return createContext(this, options);
    },
    evaluate(value) {
      return evaluate(this, value);
    },
    createResource(...args) {
      return createResource(this, ...args);
    },
    createVirtual(...args) {
      return createVirtual(this, ...args);
    },
    isVirtual(...args) {
      return isVirtual(...args);
    },
    log(...args) {
      if (this.options.verbose) console.log(...args);
    },
    options
  };
  context.rootContext = context;
  return context;
}
