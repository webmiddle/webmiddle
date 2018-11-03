import PropTypes from "prop-types"; // explicit import because of circular dependency with index
import evaluate from "./evaluate";

// see https://www.npmjs.com/package/prop-types#proptypescheckproptypes
function validateProps(props, propTypes, component) {
  PropTypes.checkPropTypes(
    propTypes,
    props,
    "prop",
    component.name || "Component"
  );
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
