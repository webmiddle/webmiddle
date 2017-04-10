import WebMiddle, { evaluate, createContext } from '../index';
import PropTypes from 'proptypes'; // explicit import because of circular dependency with index

export default function WithOptions({ children, ...options }, context) {
  if (children.length !== 1) {
    throw new Error('WithOptions MUST get exactly one child!');
  }

  return evaluate(createContext(context, options), children[0]);
}

WithOptions.propTypes = {
  children: PropTypes.array.isRequired,
};
