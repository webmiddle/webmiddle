import virtualElement from "virtual-element";
import PropTypes from "proptypes";
import isVirtual from "./utils/isVirtual";
import isResource from "./utils/isResource";
import createContext from "./utils/createContext";
import pickDefaults from "./utils/pickDefaults";
import WithOptions from "./utils/WithOptions";
import ErrorBoundary from "./utils/ErrorBoundary";

export { PropTypes };
export { isVirtual };
export { isResource };
export { pickDefaults };
export { WithOptions };
export { ErrorBoundary };

const rootContext = createContext();
export { rootContext };

export default {
  h(...args) {
    return virtualElement(...args);
  }
};
