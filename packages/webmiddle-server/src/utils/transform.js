import mapValues from "lodash/mapValues";
import { isResource, isVirtual } from "webmiddle";

const DEFAULT_RECURSION = 1;

function transformVirtual(virtual, recursion = DEFAULT_RECURSION) {
  const transformedValue = {
    type: transformValue(virtual.type, Math.max(0, recursion - 1)),
    attributes: mapValues(virtual.attributes, (
      attrValue // always include attributes
    ) => transformValue(attrValue, Math.max(0, recursion - 1))),
    children: transformValue(virtual.children, 0) // always omit children
  };

  return {
    type: "virtual",
    value: transformedValue
  };
}

function transformResource(resource, recursion = DEFAULT_RECURSION) {
  const transformedValue = {
    name: resource.name,
    contentType: resource.contentType,
    content: transformValue(resource.content, 0) // always omit content
  };

  return {
    type: "resource",
    value: transformedValue
  };
}

function transformFunction(fn) {
  return {
    type: "function",
    value: undefined, // lazily loaded
    name: fn.name
  };
}

function transformArray(array, recursion = DEFAULT_RECURSION) {
  const transformedValue =
    recursion === 0
      ? undefined
      : array.map(v => transformValue(v, recursion - 1));

  return {
    type: "array",
    value: transformedValue,
    length: array.length
  };
}

function transformPlainObject(obj, recursion = DEFAULT_RECURSION) {
  const transformedValue =
    recursion === 0
      ? undefined
      : mapValues(obj, v => transformValue(v, recursion - 1));

  return {
    type: "object",
    value: transformedValue
  };
}

export function transformValue(value, recursion = DEFAULT_RECURSION) {
  if (isVirtual(value)) return transformVirtual(value, recursion);
  if (isResource(value)) return transformResource(value, recursion);
  if (typeof value === "function") return transformFunction(value, recursion);
  if (Array.isArray(value)) return transformArray(value, recursion);
  if (typeof value === "object" && value !== null)
    return transformPlainObject(value, recursion);

  // Note: value === null will still have type === 'object'

  const type = typeof value;
  const transformedValue = value;

  return {
    type,
    value: transformedValue
  };
}

export function transformCallStateInfo(info) {
  if (!info) return undefined;

  function transformInfoValue(type, value) {
    if (type === "virtual") {
      // value is the virtual
      return transformValue(value).value;
    }

    return transformValue(value);
  }

  function transformInfoOptions(type, options) {
    if (type === "service") {
      // props, tries
      return {
        props: mapValues(options.props, propValue =>
          transformValue(propValue, 0)
        )
      };
    }

    return mapValues(options, optionValue => transformValue(optionValue));
  }

  // type, value, options, children
  return {
    type: info.type,
    value: transformInfoValue(info.type, info.value),
    options: transformInfoOptions(info.type, info.options),
    children: info.children.map(child => transformValue(child, 0))
  };
}
