import { PropTypes, isVirtual } from "webmiddle";
import cheerio from "cheerio";
import isDomNode from "./isDomNode";
import isCheerioCollection from "./isCheerioCollection";

// NOTE: el.text() returns the concatenated text of all the
// elements in the collection,
// while this function only returns the first one.
function getElementValue(el) {
  if (!isDomNode(el[0])) {
    return el[0]; // plain value
  }

  return el.first().val() || el.first().text();
}

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

  const el = $(domNode);
  return getElementValue(el);
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

export const $$ = selector => (sourceEl, $) => $(selector, sourceEl);
Object.assign($$, {
  find: (...args) => sourceEl => sourceEl.find(...args),

  within: (selector, body) => async (sourceEl, $, options) => {
    // selector can be a function that retuns a cheerio collection
    let newSourceEl;
    if (typeof selector === "function") {
      newSourceEl = await process(selector, sourceEl, $, {
        ...options,
        keepNodes: true
      });
      if (!isCheerioCollection(newSourceEl)) {
        newSourceEl = Array.isArray(newSourceEl)
          ? $(newSourceEl)
          : $([newSourceEl]);
      }
    } else {
      newSourceEl = $(selector, sourceEl);
    }

    return new ToProcess(body, newSourceEl);
  },

  attr: (...args) => sourceEl => sourceEl.attr(...args),

  value: () => sourceEl => getElementValue(sourceEl),

  map: body => (sourceEl, $) =>
    sourceEl.map(
      (i, rawItem) =>
        // rawItem could be a domNode or any javascript value
        // NOTE: use [] to make sure strings aren't treated as selectors
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

  postprocess: (body, postProcessFn) => async (sourceEl, $, options) => {
    const result = await process(body, sourceEl, $, options);
    const postProcessedResult = postProcessFn(result, $, options);
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
