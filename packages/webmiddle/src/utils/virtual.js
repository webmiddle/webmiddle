class Virtual {
  constructor(data) {
    Object.assign(this, data);
  }
}

// https://github.com/dekujs/virtual-element/blob/master/index.js#L30
export function createVirtual(context, type, attributes, children) {
  const virtual = new Virtual({
    type,
    attributes,
    children
  });
  return virtual;
}

export function isVirtual(target) {
  return target instanceof Virtual;
}
