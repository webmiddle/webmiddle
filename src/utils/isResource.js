import isEqual from 'lodash.isequal';

export default function isResource(target) {
  return typeof target === 'object' && target !== null &&
    isEqual(Object.keys(target), ['name', 'contentType', 'content']);
}
