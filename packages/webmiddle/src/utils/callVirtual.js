import call from "./call";
import evaluate from "./evaluate";

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

// Call the service multiple times based on the "retries" option.
// As last resort, use the "catch" option.
// Note: retries < 0 means infinite retries.
// TODO: use evaluate for retries and catch?
async function callService(service, props, context, tries = 1) {
  try {
    // "await" needed to throw here in case of error
    return await call(
      newContext => {
        const result = service(props, newContext);
        return evaluate(newContext, result);
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

    let { retries } = context.options;
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

  const props = {
    ...virtual.attributes,
    children: virtual.children
  };

  // calculate new context with service options (if any)
  if (service && service.options) {
    context = context.extend(
      typeof service.options === "function"
        ? service.options(props, context)
        : service.options
    );
  }

  if (service && service.propTypes) {
    validateProps(props, service.propTypes, service);
  }

  let result;
  if (service) {
    const callServiceReturn = await callService(service, props, context);
    ({ result, context } = callServiceReturn);
  } else {
    result = virtual;
  }

  return { result, context };
}
