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

function callService(service, props, context) {
  const result = service(props, context);
  return evaluate(context, result);
}

export default async function callVirtual(context, virtual) {
  const service = typeof virtual.type === "function" ? virtual.type : null;

  const props = {
    ...virtual.attributes,
    children: virtual.children
  };

  if (service && service.propTypes) {
    validateProps(props, service.propTypes, service);
  }

  let result;
  if (service) {
    result = await callService(service, props, context);
  } else {
    result = virtual;
  }

  return { result, context };
}
