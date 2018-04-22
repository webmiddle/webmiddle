class Resource {
  constructor(data) {
    Object.assign(this, data);
  }
}

export function createResource(context, name, contentType, content) {
  const id = String(context.rootContext.resources.length);
  const resource = new Resource({
    id,
    name,
    contentType,
    content
  });
  context.rootContext.resources.push(resource);
  return resource;
}

export function isResource(target) {
  return target instanceof Resource;
}
