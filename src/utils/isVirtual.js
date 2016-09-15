import isEqual from 'lodash.isequal';
import sortBy from 'lodash.sortby';

// https://github.com/dekujs/virtual-element/blob/master/index.js#L30
export default function isVirtual(target) {
  return typeof target === 'object' && target !== null &&
    isEqual(sortBy(Object.keys(target)), sortBy(['type', 'attributes', 'children']));
}
