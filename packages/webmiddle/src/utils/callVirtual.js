import call from "./call";

// extracted from https://github.com/developit/propTypes README
function validateProps(props, propTypes, service) {
  for (const prop in propTypes) {
    if (propTypes.hasOwnProperty(prop)) {
      if (typeof propTypes[prop] !== "function") {
        console.error(
          "Error: invalid prop type",
          prop,
          propTypes,
          service && service.name ? service.name : service
        );
      }
      const err = propTypes[prop](props, prop, service, "prop");
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
  return ancestors.length > 0 ? ancestors[ancestors.length - 1] : webmiddle;
}

// Two webmiddles are related if they are the same
// or if one is ancestor of the other
function areWebmiddlesRelated(first, second) {
  const firstAncestors = getWebmiddleAncestors(first);
  const secondAncestors = getWebmiddleAncestors(second);
  return (
    first === second ||
    (firstAncestors.indexOf(second) !== -1 ||
      secondAncestors.indexOf(first) !== -1)
  );
}

function getLinkedWebmiddle(webmiddle, newWebmiddle) {
  return areWebmiddlesRelated(webmiddle, newWebmiddle)
    ? null
    : getTopWebmiddle(newWebmiddle);
}

// Call the service multiple times based on the "retries" option.
// As last resort, use the "catch" option.
// Note: retries < 0 means infinite retries.
// TODO: use evaluate for retries and catch?
async function callService(service, props, context, tries = 1) {
  try {
    // "await" needed to throw here in case of error
    return await call(
      newContext => {
        return service(props, newContext);
      },
      context,
      {
        type: "service",
        value: service,
        options: { props, tries }
      }
    );
  } catch (err) {
    // Note: still use the old context in case of error
    // since the tries should show as a list in the callState

    let retries = context.options.retries;
    if (typeof retries === "function") retries = retries(err);
    retries = (await retries) || 0;

    if (tries === retries + 1) {
      // last resort
      let catchExpr = context.options.catch;
      if (typeof catchExpr === "undefined") throw err;
      try {
        return await call(
          () => {
            if (typeof catchExpr === "function") catchExpr = catchExpr(err);
            return catchExpr;
          },
          context,
          {
            type: "catch",
            value: catchExpr,
            options: { service, props }
          }
        );
      } catch (err) {
        throw err;
      }
    }
    const retriesLeft = retries - (tries - 1);
    console.error(err instanceof Error ? err.stack : err);
    console.log(
      "Retries left:",
      retriesLeft < 0 ? "(infinity)" : retriesLeft,
      "Tries",
      tries
    );
    return callService(service, props, context, tries + 1);
  }
}

export default async function callVirtual(context, virtual) {
  const service = typeof virtual.type === "function" ? virtual.type : null;

  // clone the context
  context = { ...context };

  // calculate new webmiddle
  const newWebmiddle =
    service && service.webmiddle ? service.webmiddle : context.webmiddle;
  const linkedWebmiddle = getLinkedWebmiddle(context.webmiddle, newWebmiddle);
  if (linkedWebmiddle) {
    // link (set temp parent)
    linkedWebmiddle.parent = context.webmiddle;
  }
  context.webmiddle = newWebmiddle;

  const props = {
    ...virtual.attributes,
    children: virtual.children
  };
  // calculate new options:
  // 1) context options
  // 2) service options
  // the final options are obtained by merging.
  const serviceOptions = service && service.options ? service.options : {};
  [serviceOptions].forEach(moreOptions => {
    if (typeof moreOptions === "function")
      moreOptions = moreOptions(props, context);
    context.options = {
      ...context.options,
      ...(moreOptions || {})
    };
  });

  if (service && service.propTypes) {
    validateProps(props, service.propTypes, service);
  }

  let result;
  if (service) {
    const callServiceReturn = await callService(service, props, context);
    result = callServiceReturn.result;
    context = callServiceReturn.context;
  } else {
    result = virtual;
  }

  return { result, context, linkedWebmiddle };
}
