// extracted from https://github.com/developit/propTypes README
function validateProps(props, propTypes, service) {
  for (const prop in propTypes) {
    if (propTypes.hasOwnProperty(prop)) {
      if (typeof propTypes[prop] !== 'function') {
        console.error('Error: invalid prop type', prop, propTypes, service);
      }
      const err = propTypes[prop](props, prop, service, 'prop');
      if (err) {
        console.warn(err);
        return false;
      }
    }
  }
  return true;
}

function getWebmiddleAncestors(webmiddle) {
  const ancestors = [];

  let currentWebmiddle = webmiddle;
  while (currentWebmiddle.parent) {
    currentWebmiddle = currentWebmiddle.parent;
    ancestors.push(currentWebmiddle);
  }

  return ancestors;
}

function getTopWebmiddle(webmiddle) {
  const ancestors = getWebmiddleAncestors(webmiddle);
  return (ancestors.length > 0) ? ancestors[ancestors.length - 1] : webmiddle;
}

// Two webmiddles are related if they are the same
// or if one is ancestor of the other
function areWebmiddlesRelated(first, second) {
  const firstAncestors = getWebmiddleAncestors(first);
  const secondAncestors = getWebmiddleAncestors(second);
  return (first === second) ||
         (firstAncestors.indexOf(second) !== -1 || secondAncestors.indexOf(first) !== -1);
}

// Call the service multiple times based on the "retries" prop.
async function callService(service, props) {
  try {
    const result = await service(props);
    return result;
  } catch (err) {
    const retries = props.options.retries || 0;
    if (retries === 0) { // < 0 for infinite retries
      throw err;
    }
    console.error((err instanceof Error) ? err.stack : err);
    console.log('Retries left:', (retries < 0) ? '(infinity)' : retries);
    return callService(service, {
      ...props,
      options: {
        ...props.options,
        retries: (retries < 0) ? retries : (retries - 1),
      },
    });
  }
}

export default async function callVirtual(virtual, options = {}) {
  const service = virtual.type;

  if (typeof service !== 'function') {
    return { result: virtual, webmiddle: this, linkedWebmiddle: null };
  }

  const webmiddle = service.webmiddle || this;

  const linkedWebmiddle = areWebmiddlesRelated(this, webmiddle) ? null : getTopWebmiddle(webmiddle);
  if (linkedWebmiddle) {
    // link (set temp parent)
    linkedWebmiddle.parent = this;
  }

  const props = {
    ...virtual.attributes,
    children: virtual.children,
    webmiddle,
    options,
  };
  // options prop
  const serviceOptions = (typeof service.options === 'function') ?
    service.options(props) : service.options;
  props.options = {
    ...options,
    ...(serviceOptions || {}),
  };

  if (service.propTypes) {
    validateProps(virtual.attributes, service.propTypes, service);
  }

  const result = await callService(service, props);

  return { result, webmiddle, linkedWebmiddle };
};
