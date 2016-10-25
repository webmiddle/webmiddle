import virtualElement from 'virtual-element';
import isVirtual from './utils/isVirtual';
import isResource from './utils/isResource';
import callVirtual from './utils/callVirtual';
import evaluate from './utils/evaluate';
import PropTypes from 'proptypes';
import get from 'lodash.get';
import cloneDeepWith from 'lodash.clonedeepwith';
import isPlainObject from 'lodash.isplainobject';
import merge from 'lodash.merge';
import CookieManager from 'webmiddle-manager-cookie';

export { PropTypes };

export default class WebMiddle {
  static h(...args) {
    return virtualElement(...args);
  }

  isVirtual(...args) {
    return isVirtual.apply(this, args);
  }

  isResource(...args) {
    return isResource.apply(this, args);
  }

  callVirtual(...args) {
    return callVirtual.apply(this, args);
  }

  evaluate(...args) {
    return evaluate.apply(this, args);
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
    const HigherService = ({ webmiddle, options, children, ...rest }) => (
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
