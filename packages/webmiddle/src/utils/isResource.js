import isEqual from 'lodash.isequal';
import sortBy from 'lodash.sortby';

export default function isResource(target) {
  return typeof target === 'object' && target !== null &&
    isEqual(sortBy(Object.keys(target)), sortBy(['name', 'contentType', 'content']));
}
