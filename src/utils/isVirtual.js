import difference from 'lodash.difference';

// https://github.com/dekujs/virtual-element/blob/master/index.js#L30
export default function isVirtual(target) {
  return typeof target === 'object' && target !== null &&
    difference(Object.keys(target), ['type', 'attributes', 'children']).length === 0;
}
