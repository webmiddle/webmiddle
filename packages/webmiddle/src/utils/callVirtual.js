// extracted from https://github.com/developit/propTypes README
function validateProps(props, propTypes) {
  for (const prop in propTypes) {
    if (propTypes.hasOwnProperty(prop)) {
      const err = propTypes[prop](props, prop, 'name', 'prop');
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
    if (props.retries === 0) { // < 0 for infinite retries
      throw err;
    }
    console.error((err instanceof Error) ? err.stack : err);
    console.log('Retries left:', (props.retries < 0) ? '(infinity)' : props.retries);
    return callService(service, {
      ...props,
      retries: (props.retries < 0) ? props.retries : (props.retries - 1),
    });
  }
}

export default async function callVirtual(virtual) {
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
    retries: virtual.attributes.retries || 0,
    children: virtual.children,
    webmiddle,
  };
  if (service.propTypes) {
    validateProps(virtual.attributes, service.propTypes);
  }

  const result = await callService(service, props);

  return { result, webmiddle, linkedWebmiddle };
};
