import virtualElement from "virtual-element";
import PropTypes from "proptypes";
import get from "lodash.get";
import set from "lodash.set";
import cloneDeepWith from "lodash.clonedeepwith";
import isPlainObject from "lodash.isplainobject";
import merge from "lodash.merge";
import CookieManager from "webmiddle-manager-cookie";
import isVirtual from "./utils/isVirtual";

import isResource from "./utils/isResource";
import createContext from "./utils/createContext";
import evaluate from "./utils/evaluate";
import callVirtual from "./utils/callVirtual";
import pickDefaults from "./utils/pickDefaults";
import WithOptions from "./utils/WithOptions";

export { PropTypes };
export { isVirtual };
export { isResource };
export { createContext };
export { evaluate };
export { callVirtual };
export { pickDefaults };
export { WithOptions };

function mapObjectDeep(obj, onLeaf) {
  if (typeof obj !== "object" || obj === null || isVirtual(obj))
    return onLeaf(obj);

  const newObj = {};
  for (const prop of Object.keys(obj)) {
    newObj[prop] = mapObjectDeep(obj[prop], onLeaf);
  }
  return newObj;
}

function wrapService(Service, webmiddle) {
  if (typeof Service !== "function") {
    throw new Error("Invalid service: is not a function", Service);
  }

  const HigherService = ({ children, ...rest }) => (
    <Service {...rest}>{children}</Service>
  );
  HigherService.propTypes = Service.propTypes;
  HigherService.webmiddle = webmiddle;
  return HigherService;
}

function mergeAndGet(obj, prop, path, fnProp) {
  const result = get(obj[prop], path);
  const parentResult = obj.parent ? obj.parent[fnProp](path) : undefined;

  let finalResult = result;
  if (isPlainObject(result) && isPlainObject(parentResult)) {
    finalResult = merge({}, parentResult, result);
  } else if (
    typeof result === "undefined" &&
    typeof parentResult !== "undefined"
  ) {
    finalResult = parentResult;
  }

  return cloneDeepWith(finalResult, value => {
    // don't try to clone functions (since they are converted to an empty object)
    if (typeof value === "function") return value;
    return undefined; // default behaviour
  });
}

export default class WebMiddle {
  static h(...args) {
    return virtualElement(...args);
  }

  constructor(options = {}) {
    this.name = options.name;
    this.parent = options.parent;

    this.services = mapObjectDeep(options.services || {}, val =>
      wrapService(val, this)
    );

    global.webmiddle = global.webmiddle || {
      cookieManager: new CookieManager()
    };
    this.cookieManager = global.webmiddle.cookieManager;
  }

  registerService(path, Service) {
    const HigherService = wrapService(Service, this);
    set(this.services, path, HigherService);
  }

  service(path) {
    return mergeAndGet(this, "services", path, "service");
  }

  // TODO: move to context (so to be able to read verbose option)
  log(...args) {
    //if (this.options.verbose) console.log(...args);
  }
}
