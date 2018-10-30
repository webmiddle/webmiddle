import { PropTypes } from "webmiddle";
import cheerio from "cheerio";
import isDomNode from "./isDomNode";
import isCheerioCollection from "./isCheerioCollection";

async function processArray(array, sourceEl, $, options) {
  return Promise.all(array.map(item => process(item, sourceEl, $, options)));
}

async function processObject(obj, sourceEl, $, options) {
  const result = {};

  for (const prop of Object.keys(obj)) {
    result[prop] = await process(obj[prop], sourceEl, $, options);
  }

  return result;
}

async function processDomNode(domNode, sourceEl, $, options) {
  if (options.keepNodes) return domNode;

  if (domNode.type !== "tag" && domNode.type !== "root") {
    return domNode.data;
  }

  // NOTE: el.text() returns the concatenated text of all the
  // elements in the collection,
  // while this function only returns the first one.
  const el = $(domNode);
  return el.first().val() || el.first().text();
}

async function processCheerioCollection(el, sourceEl, $, options) {
  const result = await processArray(Array.from(el.get()), sourceEl, $, options);
  if (options.keepNodes) {
    return $(result);
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
async function process(value, sourceEl, $, options) {
  let result;
  try {
    result = await options.context
      .extend({
        expectResource: false,
        functionParameters: [sourceEl, $, options]
      })
      .evaluate(value);
  } catch (err) {
    console.error(err instanceof Error ? err.stack : err);
    result = null;
  }

  if (result instanceof ToProcess) {
    return process(result.value, result.sourceEl, $, options);
  }
  if (isDomNode(result)) {
    return processDomNode(result, sourceEl, $, options);
  }
  if (isCheerioCollection(result)) {
    return processCheerioCollection(result, sourceEl, $, options);
  }
  if (Array.isArray(result)) {
    return processArray(result, sourceEl, $, options);
  }
  if (typeof result === "object" && result !== null) {
    return processObject(result, sourceEl, $, options);
  }
  if (typeof result === "undefined") {
    return null;
  }
  return result;
}

async function match(selector, sourceEl, $, options) {
  // selector can be a function that retuns a cheerio collection
  let matchedEl;
  if (typeof selector === "function") {
    matchedEl = await process(selector, sourceEl, $, {
      ...options,
      keepNodes: true
    });
    if (!isCheerioCollection(matchedEl)) {
      matchedEl = Array.isArray(matchedEl) ? $(matchedEl) : $([matchedEl]);
    }
  } else {
    matchedEl = $(selector, sourceEl);
  }
  return matchedEl;
}

export const $$ = selector => (sourceEl, $, options) =>
  match(selector, sourceEl, $, options);
Object.assign($$, {
  within: (selector, body) => async (sourceEl, $, options) => {
    const newSourceEl = await match(selector, sourceEl, $, options);
    return new ToProcess(body, newSourceEl);
  },

  attr: (...args) => sourceEl => sourceEl.attr(...args),

  get: (...args) => sourceEl => sourceEl.get(...args),

  getFirst: selector =>
    typeof selector === "undefined"
      ? $$.get(0)
      : $$.within(selector, $$.get(0)),

  map: body => (sourceEl, $) =>
    sourceEl.map(
      (i, rawItem) =>
        // rawItem could be a domNode or any javascript value
        // NOTE: use [] to make sure strings aren't treated as string selectors
        new ToProcess(body, $([rawItem]))
    ),

  filter: fn => (sourceEl, $, options) =>
    sourceEl.filter(
      (i, rawItem) =>
        // within
        !!fn($([rawItem]), $, options)
    ),

  pipe: (...tasks) => sourceEl => {
    const handleNext = (i, result) => {
      const task = tasks[i];
      if (!task) return result;
      return $$.within(task, (...args) => handleNext(i + 1, ...args));
    };
    return handleNext(0, sourceEl);
  },

  postprocess: (body, postprocessFn) => async (sourceEl, $, options) => {
    const result = await process(body, sourceEl, $, options);
    const postProcessedResult = postprocessFn(result, $, options);
    return postProcessedResult;
  }
});

async function CheerioToJson({ name, from, children }, context) {
  if (children.length !== 1) {
    throw new Error("CheerioToJson MUST get exactly one child!");
  }

  // parse html or xml
  const $ = cheerio.load(from.content, {
    xmlMode: from.contentType === "text/xml"
  });

  const content = await process(children[0], $.root(), $, { context });

  return context.createResource(name, "application/json", content);
}

CheerioToJson.propTypes = {
  name: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired, // resource
  children: PropTypes.array
};

export default CheerioToJson;
