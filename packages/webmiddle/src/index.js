import virtualElement from 'virtual-element';
import PropTypes from 'proptypes';
import get from 'lodash.get';
import set from 'lodash.set';
import cloneDeepWith from 'lodash.clonedeepwith';
import isPlainObject from 'lodash.isplainobject';
import merge from 'lodash.merge';
import CookieManager from 'webmiddle-manager-cookie';
import isVirtual from './utils/isVirtual';

export { PropTypes };

export isResource from './utils/isResource';
export { isVirtual };
export createContext from './utils/createContext';
export evaluate from './utils/evaluate';
export callVirtual from './utils/callVirtual';
export pickDefaults from './utils/pickDefaults';
export WithOptions from './utils/WithOptions';

function mapObjectDeep(obj, onLeaf) {
  if (typeof obj !== 'object' || obj === null || isVirtual(obj)) return onLeaf(obj);

  const newObj = {};
  for (const prop of Object.keys(obj)) {
    newObj[prop] = mapObjectDeep(obj[prop], onLeaf);
  }
  return newObj;
}

function wrapService(Service, webmiddle) {
  if (typeof Service !== 'function') {
    throw new Error('Invalid service: is not a function', Service);
  }

  const HigherService = ({ children, ...rest }) => (
    <Service
      {...rest}
    >
      {children}
    </Service>
  );
  HigherService.propTypes = Service.propTypes;
  HigherService.webmiddle = webmiddle;
  return HigherService;
}

function mergeAndGet(obj, prop, path, fnProp) {
  const result = get(obj[prop], path);
  const parentResult = obj.parent ? (obj.parent[fnProp])(path) : undefined;

  let finalResult = result;
  if (isPlainObject(result) && isPlainObject(parentResult)) {
    finalResult = merge({}, parentResult, result);
  } else if (typeof result === 'undefined' && typeof parentResult !== 'undefined') {
    finalResult = parentResult;
  }

  return cloneDeepWith(finalResult, value => {
    // don't try to clone functions (since they are converted to an empty object)
    if (typeof value === 'function') return value;
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
    this.settings = options.settings || {};

    this.services = mapObjectDeep(options.services || {}, (val) =>
      wrapService(val, this)
    );

    global.webmiddle = global.webmiddle || {
      cookieManager: new CookieManager(),
    };
    this.cookieManager = global.webmiddle.cookieManager;
  }

  registerService(path, Service) {
    const HigherService = wrapService(Service, this);
    set(this.services, path, HigherService);
  }

  service(path) {
    return mergeAndGet(this, 'services', path, 'service');
  }

  setting(path) {
    return mergeAndGet(this, 'settings', path, 'setting');
  }

  log(...args) {
    if (this.setting('verbose')) console.log(...args);
  }
}
