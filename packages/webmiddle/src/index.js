import virtualElement from "virtual-element";
import PropTypes from "prop-types";
import createContext from "./utils/createContext";
import { isResource } from "./utils/resource";
import { isVirtual } from "./utils/virtual";
import WithOptions from "./utils/WithOptions";
import ErrorBoundary from "./utils/ErrorBoundary";

export { PropTypes };
export { isResource };
export { isVirtual };
export { WithOptions };
export { ErrorBoundary };

const rootContext = createContext();
export { rootContext };

export default {
  h(...args) {
    const element = virtualElement(...args);
    return rootContext.createVirtual(
      element.type,
      element.attributes,
      element.children
    );
  }
};
