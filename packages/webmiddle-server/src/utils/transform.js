import mapValues from 'lodash/mapValues';
import { isResource, isVirtual } from 'webmiddle';

const DEFAULT_RECURSION = 1;

function transformVirtual(virtual, recursion = DEFAULT_RECURSION) {
  // always include the minimal info regardless of recursion
  // (full info can be loaded lazily)
  const transformedValue = mapValues(virtual, (v, k) => {
    return transformValue(v,
      k === 'children' ? 0 : // always omit children
      k === 'attributes' ? Math.max(1, recursion - 1) : // always include attributes
      Math.max(0, recursion - 1));
  });

  return {
    type: 'virtual',
    value: transformedValue,
  };
}

function transformResource(resource, recursion = DEFAULT_RECURSION) {
  // always include the minimal info regardless of recursion
  // (full info can be loaded lazily)
  const transformedValue = mapValues(resource, (v, k) => {
    return transformValue(v, k === 'content' ? 0 : Math.max(0, recursion - 1));
  });

  return {
    type: 'resource',
    value: transformedValue,
  };
}

function transformFunction(fn) {
  return {
    type: 'function',
    value: undefined, // lazily loaded
    name: fn.name,
  };
}

function transformArray(array, recursion = DEFAULT_RECURSION) {
  const transformedValue = (recursion === 0) ? undefined :
    array.map(v => transformValue(v, recursion - 1));

  return {
    type: 'array',
    value: transformedValue,
    length: array.length,
  };
}

function transformPlainObject(obj, recursion = DEFAULT_RECURSION) {
  const transformedValue = (recursion === 0) ? undefined :
    mapValues(obj, v => transformValue(v, recursion - 1));

  return {
    type: 'object',
    value: transformedValue,
  };
}

export function transformValue(value, recursion = DEFAULT_RECURSION) {
  if (isVirtual(value)) return transformVirtual(value, recursion);
  if (isResource(value)) return transformResource(value, recursion);
  if (typeof value === 'function') return transformFunction(value, recursion);
  if (Array.isArray(value)) return transformArray(value, recursion);
  if (typeof value === 'object' && value !== null) return transformPlainObject(value, recursion);

  // Note: value === null will still have type === 'object'

  const type = typeof value;
  const transformedValue = value;

  return {
    type,
    value: transformedValue,
  };
}

export function transformCallStateInfo(info) {
  if (!info) return undefined;
  return mapValues(info, (v) => transformValue(v));
}
