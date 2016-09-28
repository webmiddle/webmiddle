import virtualElement from 'virtual-element';
import isVirtual from './utils/isVirtual';
import isResource from './utils/isResource';
import callVirtual from './utils/callVirtual';
import evaluate from './utils/evaluate';
import PropTypes from 'proptypes';
import get from 'lodash.get';
import cloneDeep from 'lodash.clonedeep';
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
    const ComposedService = ({ children, ...props }) => (
      <Service
        {...props}
      >
        {children}
      </Service>
    );
    ComposedService.propTypes = Service.propTypes;
    ComposedService.webmiddle = this;

    this.services[path] = ComposedService;
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

    return cloneDeep(finalSetting);
  }
}
