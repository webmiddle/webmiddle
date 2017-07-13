import JSONSelect from "JSONSelect";

// selector and values are optional
export function elGet(selector, values) {
  return el => {
    if (selector) {
      el = JSONSelect.match(selector, values, el);
    }
    return el[0];
  };
}
