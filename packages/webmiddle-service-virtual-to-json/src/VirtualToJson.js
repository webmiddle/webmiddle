import WebMiddle, { PropTypes } from 'webmiddle';
import values from 'lodash.values';

async function processVirtual(virtual, webmiddle) {
  const targetAttributes = {};
  Object.keys(virtual.attributes).forEach((attributeName, i) => {
    targetAttributes[`@attribute#${i}`] = virtual.attributes[attributeName];
  });

  const targetValue = await processArray(virtual.children, {
    ...targetAttributes,
  }, webmiddle);

  return {
    [virtual.type]: targetValue,
  };
}

async function processArray(array, result = {}, webmiddle) {
  let dataCount = 0;

  const usedProps = {}; // <prop, count>
  for (let i = 0; i < array.length; i++) {
    const itemResult = await process(array[i], webmiddle);

    if (itemResult.type === 'prop') {
      if (usedProps[itemResult.prop] > 0) {
        // duplicate prop, switch to data
        if (usedProps[itemResult.prop] === 1) {
          // convert original prop
          result[`@data#${dataCount}`] = {
            [itemResult.prop]: result[itemResult.prop],
          };
          dataCount++;
          delete result[itemResult.prop];
        }
        result[`@data#${dataCount}`] = {
          [itemResult.prop]: itemResult.value,
        };
        dataCount++;
        usedProps[itemResult.prop]++;
      } else {
        result[itemResult.prop] = itemResult.value;
        usedProps[itemResult.prop] = 1;
      }
    } else {
      result[`@data#${dataCount}`] = itemResult.value;
      dataCount++;
    }
  }

  if (dataCount === Object.keys(result).length) {
    // all data
    result = values(result); // array
    if (result.length === 1) {
      result = result[0];
    } else if (result.length === 0) {
      result = null;
    }
  }

  return result;
}

async function process(value, webmiddle) {
  let result = value;

  if (webmiddle.isVirtual(result)) {
    result = {
      type: 'prop',
      prop: result.type,
      value: (await processVirtual(result, webmiddle))[result.type],
    };
  } else if (Array.isArray(result)) {
    result = {
      type: 'data',
      value: await processArray(result, undefined, webmiddle),
    };
  } else {
    result = {
      type: 'data',
      value: result,
    };
  }

  return result;
}

async function VirtualToJson({ name, from, webmiddle }) {
  const source = from.content;

  const target = await processVirtual(source, webmiddle);

  return {
    name,
    contentType: 'application/json',
    content: target,
  };
}

VirtualToJson.propTypes = {
  name: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired, // resource
  webmiddle: PropTypes.object.isRequired,
};

export default VirtualToJson;
