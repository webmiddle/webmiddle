import every from "lodash.every";

const props = ["type", "next", "prev", "parent"];

export default target =>
  typeof target === "object" &&
  target !== null &&
  every(props, p => p in target);
