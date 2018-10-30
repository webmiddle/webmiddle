import { PropTypes } from "webmiddle";
import JSONSelect from "JSONSelect";

// Note: virtual.type must be a string
async function processVirtual(virtual, sourceEl, JSONSelect, options) {
  let el = virtual.attributes.el;
  if (!el) {
    el = sourceEl;
  } else if (typeof el === "string") {
    el = JSONSelect.match(el, undefined, sourceEl);
  }

  const condition = virtual.attributes.condition;
  if (condition) {
    if (typeof condition !== "function") {
      throw new Error(
        `condition must be a function: ${JSON.stringify(condition)}`
      );
    }
    el = el.filter(condition);
  }

  return options.context.createVirtual(
    virtual.type,
    {},
    await processArray(virtual.children, el, JSONSelect, options)
  );
}

async function processArray(array, sourceEl, JSONSelect, options) {
  return Promise.all(
    array.map(item => process(item, sourceEl, JSONSelect, options))
  );
}

async function processObject(obj, sourceEl, JSONSelect, options) {
  const result = {};

  for (const prop of Object.keys(obj)) {
    result[prop] = await process(obj[prop], sourceEl, JSONSelect, options);
  }

  return result;
}

// Used by $$ functions: instead of calling process() directly,
// functions can return a new instance of this.
// Purpose is avoiding multiple process() calls on data (e.g. objects, arrays)
// that was already processed
class ToProcess {
  constructor(value, sourceEl) {
    this.value = value;
    this.sourceEl = sourceEl;
  }
}

// @return raw xml conversion of value
async function process(value, sourceEl, JSONSelect, options) {
  let result;
  try {
    result = await options.context
      .extend({
        expectResource: false,
        functionParameters: [sourceEl, JSONSelect, options]
      })
      .evaluate(value);
  } catch (err) {
    console.error(err instanceof Error ? err.stack : err);
    result = null;
  }

  if (result instanceof ToProcess) {
    return process(result.value, result.sourceEl, JSONSelect, options);
  }
  if (Array.isArray(result)) {
    return processArray(result, sourceEl, JSONSelect, options);
  }
  if (typeof result === "object" && result !== null) {
    return processObject(result, sourceEl, JSONSelect, options);
  }
  if (typeof result === "undefined") {
    return null;
  }

  return result;
}

async function match(selector, sourceEl, JSONSelect, options) {
  // selector can be a function that retuns a collection
  let matchedEl;
  if (typeof selector === "function") {
    matchedEl = await process(selector, sourceEl, JSONSelect, options);
    matchedEl = Array.isArray(matchedEl) ? matchedEl : [matchedEl];
  } else {
    matchedEl =
      typeof selector !== "string"
        ? selector
        : [].concat(
            ...sourceEl.map(rawItem =>
              JSONSelect.match(selector, undefined, rawItem)
            )
          );
  }
  return matchedEl;
}

export const $$ = selector => (sourceEl, JSONSelect, options) =>
  match(selector, sourceEl, JSONSelect, options);
Object.assign($$, {
  find: selector => (sourceEl, JSONSelect, options) =>
    match(selector, sourceEl, JSONSelect, options),

  within: (selector, body) => async (sourceEl, JSONSelect, options) => {
    const newSourceEl = await match(selector, sourceEl, JSONSelect, options);
    return new ToProcess(body, newSourceEl);
  },

  get: i => sourceEl => (typeof i === "undefined" ? sourceEl : sourceEl[i]),

  map: body => sourceEl =>
    sourceEl.map(
      (
        rawItem // rawItem could be a domNode or any javascript value
      ) =>
        // within
        new ToProcess(body, [rawItem])
    ),

  filter: fn => (sourceEl, JSONSelect, options) =>
    sourceEl.filter(
      rawItem =>
        // within
        !!fn([rawItem], JSONSelect, options)
    ),

  pipe: (...tasks) => sourceEl => {
    const handleNext = (i, result) => {
      const task = tasks[i];
      if (!task) return result;
      return $$.within(task, (...args) => handleNext(i + 1, ...args));
    };
    return handleNext(0, sourceEl);
  },

  postprocess: (body, postprocessFn) => async (
    sourceEl,
    JSONSelect,
    options
  ) => {
    const result = await process(body, sourceEl, JSONSelect, options);
    const postProcessedResult = postprocessFn(result, JSONSelect, options);
    return postProcessedResult;
  }
});

async function JSONSelectToJson({ name, from, children }, context) {
  if (children.length !== 1) {
    throw new Error("JSONSelectToJson MUST get exactly one child!");
  }

  const content = await process(children[0], [from.content], JSONSelect, {
    context
  });

  return context.createResource(name, "application/json", content);
}

JSONSelectToJson.propTypes = {
  name: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired, // resource
  children: PropTypes.array
};

export default JSONSelectToJson;
