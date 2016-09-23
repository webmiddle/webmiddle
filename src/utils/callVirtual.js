// extracted from https://github.com/developit/propTypes README
function validateProps(props, propTypes) {
  for (const prop in propTypes) {
    if (propTypes.hasOwnProperty(prop)) {
      const err = propTypes[prop](props, prop, 'name', 'prop');
      if (err) {
        console.warn(err);
        return false;
      }
    }
  }
  return true;
}

export default async function callVirtual(virtual) {
  const service = virtual.type;

  if (typeof service !== 'function') {
    return { result: virtual, webmiddle: this };
  }

  // TODO: merge service.webmiddle with this.
  const webmiddle = service.webmiddle || this;

  const props = {
    ...virtual.attributes,
    children: virtual.children,
    webmiddle,
  };
  if (virtual.propTypes) {
    validateProps(virtual.attributes, virtual.propTypes);
  }

  const result = await service(props);

  return { result, webmiddle };
};
