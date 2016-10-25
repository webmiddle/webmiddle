// extracted from https://github.com/developit/propTypes README
function validateProps(props, propTypes, service) {
  for (const prop in propTypes) {
    if (propTypes.hasOwnProperty(prop)) {
      if (typeof propTypes[prop] !== 'function') {
        console.error(
          'Error: invalid prop type',
          prop,
          propTypes,
          (service && service.name) ? service.name : service
        );
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

// Call the service multiple times based on the "retries" option.
// As last resort, use the "catch" option.
// Note: retries < 0 means infinite retries.
// TODO: use webmiddle.evaluate for retries and catch?
async function callService(service, props, tries = 1) {
  try {
    const result = await service(props);
    return result;
  } catch (err) {
    let retries = props.options.retries;
    if (typeof retries === 'function') retries = retries(err);
    retries = (await retries) || 0;

    if (tries === retries + 1) {
      // last resort
      let catchExpr = props.options.catch;
      if (typeof catchExpr === 'function') catchExpr = catchExpr(err);
      catchExpr = await catchExpr;
      if (typeof catchExpr !== 'undefined') return catchExpr;

      throw err;
    }
    const retriesLeft = retries - (tries - 1);
    console.error((err instanceof Error) ? err.stack : err);
    console.log(
      'Retries left:', (retriesLeft < 0) ? '(infinity)' : retriesLeft,
      'Tries', tries
    );
    return callService(service, props, tries + 1);
  }
}

export default async function callVirtual(virtual, options = {}) {
  const service = virtual.type;

  if (typeof service !== 'function') {
    return { result: virtual, webmiddle: this, linkedWebmiddle: null, options };
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
  };
  // options prop:
  // 1) evaluate options
  // 2) service options
  // 3) attributes options
  // the final options are obtained by merging.
  props.options = { ...options };
  [service.options, virtual.attributes.options].forEach(moreOptions => {
    if (typeof moreOptions === 'function') moreOptions = moreOptions(props);
    props.options = {
      ...props.options,
      ...(moreOptions || {}),
    };
  });

  if (service.propTypes) {
    validateProps(props, service.propTypes, service);
  }

  const result = await callService(service, props);

  return { result, webmiddle, linkedWebmiddle, options: props.options };
};
