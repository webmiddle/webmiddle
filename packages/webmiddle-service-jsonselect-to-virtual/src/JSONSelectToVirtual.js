import WebMiddle, { PropTypes } from 'webmiddle';
import JSONSelect from 'JSONSelect';

// Note: virtual.type must be a string
async function processVirtual(virtual, sourceEl, source, webmiddle) {
  let el = virtual.attributes.el;
  if (!el) {
    el = sourceEl;
  } else if (typeof el === 'string') {
    // TODO
    el = JSONSelect.match(el, undefined, source);
  }

  const condition = virtual.attributes.condition;
  if (condition) {
    if (typeof condition !== 'function') {
      throw new Error(`condition must be a function: ${JSON.stringify(condition)}`);
    }
    el = el.filter(condition);
  }

  return {
    type: virtual.type,
    attributes: {},
    children: await processArray(virtual.children, el, source, webmiddle),
  };
}


async function processArray(array, sourceEl, source, webmiddle) {
  const result = [];

  for (const item of array) {
    const resultItem = await process(item, sourceEl, source, webmiddle);
    result.push(resultItem);
  }

  return result;
}

// converted into an array of virtuals
async function processObject(obj, sourceEl, source, webmiddle) {
  const result = [];

  for (const prop of Object.keys(obj)) {
    const resultItem = await process(obj[prop], sourceEl, source, webmiddle);
    result.push({
      type: prop,
      attributes: {},
      children: [resultItem],
    });
  }

  return result;
}

// @return raw xml conversion of value
async function process(value, sourceEl, source, webmiddle) {
  let result;
  try {
    result = await webmiddle.evaluate(value, {
      functionParameters: [sourceEl, source],
    });
  } catch (err) {
    console.error(err instanceof Error ? err.stack : err);
    result = null;
  }

  if (webmiddle.isVirtual(result)) {
    // virtual type is not a function,
    // otherwise it would have been evaluated
    result = await processVirtual(result, sourceEl, source, webmiddle);
  } else if (Array.isArray(result)) {
    result = await processArray(result, sourceEl, source, webmiddle);
  } else if (typeof result === 'object' && result !== null) {
    result = await processObject(result, sourceEl, source, webmiddle);
  } else if (typeof result === 'undefined') {
    result = null;
  }

  return result;
}

async function JSONSelectToVirtual({
  name, from, fullConversion, children, webmiddle,
}) {
  const source = from.content;

  let targetChildren;
  if (fullConversion) {
    if (children.length !== 0) {
      console.warn('children are ignored when fullConversion is true');
    }
    targetChildren = [await process(source, [source], source, webmiddle)];
  } else {
    targetChildren = await processArray(children, [source], source, webmiddle);
  }

  const target = {
    type: 'root',
    attributes: {},
    children: targetChildren,
  };

  return {
    name,
    contentType: 'application/x-webmiddle-virtual',
    content: target,
  };
}

JSONSelectToVirtual.propTypes = {
  name: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired, // resource
  fullConversion: PropTypes.object,
};

export default JSONSelectToVirtual;
