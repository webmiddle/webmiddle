import isEqual from 'lodash.isequal';

// https://github.com/dekujs/virtual-element/blob/master/index.js#L30
export default function isVirtual(target) {
  return typeof target === 'object' && target !== null &&
    isEqual(Object.keys(target), ['type', 'attributes', 'children']);
}
