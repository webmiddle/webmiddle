import webmiddle, {
  PropTypes,
  evaluate,
  createContext,
  isVirtual
} from "webmiddle";
import JSONSelect from "JSONSelect";

// Note: virtual.type must be a string
async function processVirtual(virtual, sourceEl, source, context) {
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

  return {
    type: virtual.type,
    attributes: {},
    children: await processArray(virtual.children, el, source, context)
  };
}

async function processArray(array, sourceEl, source, context) {
  const result = [];

  for (const item of array) {
    const resultItem = await process(item, sourceEl, source, context);
    result.push(resultItem);
  }

  return result;
}

// converted into an array of virtuals
async function processObject(obj, sourceEl, source, context) {
  const result = [];

  for (const prop of Object.keys(obj)) {
    const resultItem = await process(obj[prop], sourceEl, source, context);
    result.push({
      type: prop,
      attributes: {},
      children: [resultItem]
    });
  }

  return result;
}

// @return raw xml conversion of value
async function process(value, sourceEl, source, context) {
  let result;
  try {
    result = await evaluate(
      createContext(context, {
        expectResource: false,
        functionParameters: [sourceEl, source]
      }),
      value
    );
  } catch (err) {
    console.error(err instanceof Error ? err.stack : err);
    result = null;
  }

  if (isVirtual(result)) {
    // virtual type is not a function,
    // otherwise it would have been evaluated
    result = await processVirtual(result, sourceEl, source, context);
  } else if (Array.isArray(result)) {
    result = await processArray(result, sourceEl, source, context);
  } else if (typeof result === "object" && result !== null) {
    result = await processObject(result, sourceEl, source, context);
  } else if (typeof result === "undefined") {
    result = null;
  }

  return result;
}

async function JSONSelectToVirtual(
  { name, from, fullConversion, children },
  context
) {
  const source = from.content;

  if (typeof fullConversion === "undefined" && children.length === 0) {
    throw new Error('Either "fullConversion" or "children" must be specified.');
  }

  let targetChildren;
  if (fullConversion) {
    if (children.length !== 0) {
      console.warn("children are ignored when fullConversion is true");
    }
    targetChildren = [await process(source, [source], source, context)];
  } else {
    targetChildren = await processArray(children, [source], source, context);
  }

  const target = {
    type: "root",
    attributes: {},
    children: targetChildren
  };

  return {
    name,
    contentType: "application/x-webmiddle-virtual",
    content: target
  };
}

JSONSelectToVirtual.propTypes = {
  name: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired, // resource
  fullConversion: PropTypes.bool,
  children: PropTypes.array
};

export default JSONSelectToVirtual;
