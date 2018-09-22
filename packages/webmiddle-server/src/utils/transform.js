import mapValues from "lodash/mapValues";
import { isResource, isVirtual } from "webmiddle";

const DEFAULT_RECURSION = 1;

function shouldLazyLoad(value, recursion) {
  return (
    recursion === 0 &&
    typeof value !== "number" &&
    (typeof value !== "string" || value.length > 100) &&
    (!Array.isArray(value) || value.length !== 0) &&
    typeof value !== "boolean" &&
    typeof value !== "function" &&
    typeof value !== "undefined" &&
    value !== null
  );
}

function lazyLoad(value) {
  return {
    type: "more"
  };
}

function transformVirtual(virtual, recursion = DEFAULT_RECURSION) {
  const transformedValue = {
    type: transformValue(virtual.type, Math.max(0, recursion - 1)),
    attributes: shouldLazyLoad(virtual.attributes, recursion) // don't wrap attributes in a { type: 'object' } since we know it's always an object
      ? lazyLoad(virtual.attributes)
      : mapValues(virtual.attributes, attrValue =>
          transformValue(attrValue, Math.max(0, recursion - 1))
        ),
    children: transformValue(virtual.children, Math.max(0, recursion - 1))
  };

  return {
    type: "virtual",
    value: transformedValue
  };
}

function transformResource(resource, recursion = DEFAULT_RECURSION) {
  const transformedValue = {
    id: resource.id,
    name: resource.name,
    contentType: resource.contentType,
    content: transformValue(resource.content, Math.max(0, recursion - 1))
  };

  return {
    type: "resource",
    value: transformedValue
  };
}

function transformFunction(fn) {
  return {
    type: "function",
    value: undefined, // always omitted
    name: fn.name
  };
}

function transformArray(array, recursion = DEFAULT_RECURSION) {
  const transformedValue = shouldLazyLoad(array, recursion)
    ? lazyLoad(array)
    : array.map(v => transformValue(v, recursion - 1));

  return {
    type: "array",
    value: transformedValue,
    length: array.length
  };
}

function transformPlainObject(obj, recursion = DEFAULT_RECURSION) {
  const transformedValue = shouldLazyLoad(obj, recursion)
    ? lazyLoad(obj)
    : mapValues(obj, v => transformValue(v, recursion - 1));

  return {
    type: "object",
    value: transformedValue
  };
}

export function transformValue(value, recursion = DEFAULT_RECURSION) {
  if (shouldLazyLoad(value, recursion)) {
    return lazyLoad(value);
  }

  if (isVirtual(value)) return transformVirtual(value, recursion);
  if (isResource(value)) return transformResource(value, recursion);
  if (typeof value === "function") return transformFunction(value, recursion);
  if (Array.isArray(value)) return transformArray(value, recursion);
  if (typeof value === "object" && value !== null)
    return transformPlainObject(value, recursion);

  // Note: value === null will still have type === 'object'

  return {
    type: typeof value,
    value
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
    return mapValues(options, optionValue => transformValue(optionValue));
  }

  // type, value, options, children
  return {
    type: info.type,
    value: transformInfoValue(info.type, info.value),
    options: transformInfoOptions(info.type, info.options),
    result: transformValue(info.result, 0),
    children: info.children.map(child => transformValue(child, 0))
  };
}
