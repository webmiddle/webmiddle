import { PropTypes, isVirtual } from "webmiddle";
import values from "lodash.values";

async function processVirtual(virtual, context) {
  const targetAttributes = {};
  Object.keys(virtual.attributes).forEach((attributeName, i) => {
    targetAttributes[`@attribute#${i}`] = virtual.attributes[attributeName];
  });

  const targetValue = await processArray(
    virtual.children,
    {
      ...targetAttributes
    },
    context
  );

  return {
    [virtual.type]: targetValue
  };
}

async function processArray(array, result = {}, context) {
  let dataCount = 0;

  const usedProps = {}; // <prop, count>
  for (let i = 0; i < array.length; i++) {
    const itemResult = await process(array[i], context);

    if (itemResult.type === "prop") {
      if (usedProps[itemResult.prop] > 0) {
        // duplicate prop, switch to data
        if (usedProps[itemResult.prop] === 1) {
          // convert original prop
          result[`@data#${dataCount}`] = {
            [itemResult.prop]: result[itemResult.prop]
          };
          dataCount++;
          delete result[itemResult.prop];
        }
        result[`@data#${dataCount}`] = {
          [itemResult.prop]: itemResult.value
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

async function process(value, context) {
  let result = value;

  if (isVirtual(result)) {
    result = {
      type: "prop",
      prop: result.type,
      value: (await processVirtual(result, context))[result.type]
    };
  } else if (Array.isArray(result)) {
    result = {
      type: "data",
      value: await processArray(result, undefined, context)
    };
  } else {
    result = {
      type: "data",
      value: result
    };
  }

  return result;
}

async function VirtualToJson({ name, from }, context) {
  const source = from.content;

  const target = await processVirtual(source, context);

  return {
    name,
    contentType: "application/json",
    content: target
  };
}

VirtualToJson.propTypes = {
  name: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired // resource
};

export default VirtualToJson;
