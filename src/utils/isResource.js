import difference from 'lodash.difference';

export default function isResource(target) {
  return typeof target === 'object' && target !== null &&
    difference(Object.keys(target), ['name', 'contentType', 'content']).length === 0;
}
