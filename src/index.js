import virtualElement from 'virtual-element';
import isVirtual from './utils/isVirtual';
import isResource from './utils/isResource';
import callVirtual from './utils/callVirtual';
import evaluate from './utils/evaluate';
import PropTypes from 'proptypes';

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
}