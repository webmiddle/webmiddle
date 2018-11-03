import PropTypes from "prop-types"; // explicit import because of circular dependency with index

export default function WithOptions({ children, ...options }, context) {
  if (children.length !== 1) {
    throw new Error("WithOptions MUST get exactly one child!");
  }

  return context.extend(options).evaluate(children[0]);
}

WithOptions.propTypes = {
  children: PropTypes.array.isRequired
};
