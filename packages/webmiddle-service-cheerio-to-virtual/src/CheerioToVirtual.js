import WebMiddle, { PropTypes, evaluate, createContext, isVirtual } from 'webmiddle';
import cheerio from 'cheerio';
import isDomNode from './isDomNode';

// Note: virtual.type must be a string
async function processVirtual(virtual, sourceEl, source, context) {
  let el = virtual.attributes.el;
  if (!el) {
    el = sourceEl;
  } else if (typeof el === 'string') {
    el = sourceEl.find(el);
  }

  const condition = virtual.attributes.condition;
  if (condition) {
    if (typeof condition !== 'function') {
      throw new Error(`condition must be a function: ${JSON.stringify(condition)}`);
    }
    el = el.filter((i, currDomEl) => condition(source(currDomEl)));
  }

  return {
    type: virtual.type,
    attributes: {},
    children: await processArray(virtual.children, el, source, context),
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
      children: [resultItem],
    });
  }

  return result;
}

async function processDomNode(domNode, sourceEl, source, context) {
  let result;

  if (domNode.type === 'tag' || domNode.type === 'root') {
    result = {
      type: domNode.name,
      attributes: domNode.attribs,
      children: await processArray(domNode.children, sourceEl, source, context),
    };
  } else {
    result = domNode.data;
  }

  return result;
}

async function processCheerioElement(el, sourceEl, source, context) {
  return await processArray(Array.from(el.get()), sourceEl, source, context);
}

// @return raw xml conversion of value
async function process(value, sourceEl, source, context) {
  let result;
  try {
    result = await evaluate(createContext(context, {
      expectResource: false,
      functionParameters: [sourceEl, source],
    }), value);
  } catch (err) {
    console.error(err instanceof Error ? err.stack : err);
    result = null;
  }

  if (isVirtual(result)) {
    // virtual type is not a function,
    // otherwise it would have been evaluated
    result = await processVirtual(result, sourceEl, source, context);
  } else if (isDomNode(result)) {
    result = await processDomNode(result, sourceEl, source, context);
  } else if (Array.isArray(result)) {
    result = await processArray(result, sourceEl, source, context);
  } else if (typeof result === 'object' && result !== null) {
    if (result.cheerio && 'length' in result) {
      result = await processCheerioElement(result, sourceEl, source, context);
    } else {
      result = await processObject(result, sourceEl, source, context);
    }
  } else if (typeof result === 'undefined') {
    result = null;
  }

  return result;
}

async function CheerioToVirtual({
  name, from, fullConversion, children,
}, context) {
  // parse html or xml
  const source = cheerio.load(from.content, {
    xmlMode: from.contentType === 'text/xml',
  });

  if (typeof fullConversion === 'undefined' && children.length === 0) {
    throw new Error('Either "fullConversion" or "children" must be specified.');
  }

  let targetChildren;
  if (fullConversion) {
    if (children.length !== 0) {
      console.warn('children are ignored when fullConversion is true');
    }
    targetChildren = await processCheerioElement(source.root(), source.root(), source, context);
  } else {
    targetChildren = await processArray(children, source.root(), source, context);
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

CheerioToVirtual.propTypes = {
  name: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired, // resource
  fullConversion: PropTypes.bool,
  children: PropTypes.array,
};

export default CheerioToVirtual;
