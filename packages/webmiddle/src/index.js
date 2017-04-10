import virtualElement from 'virtual-element';
import PropTypes from 'proptypes';
import get from 'lodash.get';
import cloneDeepWith from 'lodash.clonedeepwith';
import isPlainObject from 'lodash.isplainobject';
import merge from 'lodash.merge';
import CookieManager from 'webmiddle-manager-cookie';

export { PropTypes };

export isResource from './utils/isResource';
export isVirtual from './utils/isVirtual';
export createContext from './utils/createContext';
export evaluate from './utils/evaluate';
export callVirtual from './utils/callVirtual';
export pickDefaults from './utils/pickDefaults';
export WithOptions from './utils/WithOptions';

export default class WebMiddle {
  static h(...args) {
    return virtualElement(...args);
  }

  constructor(options = {}) {
    this.name = options.name;

    this.parent = options.parent;

    this.services = {}; // <path, Service>

    const userServices = options.services || {};
    for (const path of Object.keys(userServices)) {
      this.registerService(path, userServices[path]);
    }

    this.settings = options.settings || {};

    global.webmiddle = global.webmiddle || {
      cookieManager: new CookieManager(),
    };
    this.cookieManager = global.webmiddle.cookieManager;
  }

  registerService(path, Service) {
    const HigherService = ({ children, ...rest }) => (
      <Service
        {...rest}
      >
        {children}
      </Service>
    );
    HigherService.propTypes = Service.propTypes;
    HigherService.webmiddle = this;

    this.services[path] = HigherService;
  }

  service(path) {
    const Service = this.services[path];
    if (Service) return Service;
    if (this.parent) return this.parent.service(path);
    return undefined;
  }

  setting(path) {
    const setting = get(this.settings, path);
    const parentSetting = this.parent ? this.parent.setting(path) : undefined;

    let finalSetting = setting;
    if (isPlainObject(setting) && isPlainObject(parentSetting)) {
      finalSetting = merge({}, parentSetting, setting);
    } else if (typeof setting === 'undefined' && typeof parentSetting !== 'undefined') {
      finalSetting = parentSetting;
    }

    return cloneDeepWith(finalSetting, value => {
      // don't try to clone functions (since they are converted to an empty object)
      if (typeof value === 'function') return value;
      return undefined; // default behaviour
    });
  }

  log(...args) {
    if (this.setting('verbose')) console.log(...args);
  }
}
