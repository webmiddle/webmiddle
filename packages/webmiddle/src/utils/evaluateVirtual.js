import evaluate from "./evaluate";

// extracted from https://github.com/developit/propTypes README
function validateProps(props, propTypes, component) {
  for (const prop in propTypes) {
    if (propTypes.hasOwnProperty(prop)) {
      if (typeof propTypes[prop] !== "function") {
        console.error(
          "Error: invalid prop type",
          prop,
          propTypes,
          component && component.name ? component.name : component
        );
      }
      const err = propTypes[prop](props, prop, component, "prop");
      if (err) {
        console.warn(err);
        return false;
      }
    }
  }
  return true;
}

function evaluateComponent(context, component, props) {
  const result = component(props, context);
  return evaluate(context, result);
}

export default async function evaluateVirtual(context, virtual) {
  const component = typeof virtual.type === "function" ? virtual.type : null;

  const props = {
    ...virtual.attributes,
    children: virtual.children
  };

  if (component && component.propTypes) {
    validateProps(props, component.propTypes, component);
  }

  let result;
  if (component) {
    result = await evaluateComponent(context, component, props);
  } else {
    result = virtual;
  }

  return { result, context };
}
