import virtualElement from "virtual-element";
import PropTypes from "proptypes";
import isVirtual from "./utils/isVirtual";
import isResource from "./utils/isResource";
import createContext from "./utils/createContext";
import callVirtual from "./utils/callVirtual";
import pickDefaults from "./utils/pickDefaults";
import WithOptions from "./utils/WithOptions";

export { PropTypes };
export { isVirtual };
export { isResource };
export { callVirtual };
export { pickDefaults };
export { WithOptions };

const rootContext = createContext();
export { rootContext };

export default {
  h(...args) {
    return virtualElement(...args);
  }
};
