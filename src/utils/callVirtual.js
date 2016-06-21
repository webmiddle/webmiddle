import isResource from './isResource';

export default async function callVirtual(virtual) {
  try {
    const service = virtual.type;

    if (typeof service !== 'function') {
      return { result: virtual, webmiddle: this };
    }

    // TODO: merge service.webmiddle with this.
    const webmiddle = service.webmiddle || this;

    const result = await service({
      ...virtual.attributes,
      children: virtual.children,
      webmiddle,
    });

    if (isResource(result)) {
      // resource overrides
      ['name', 'contentType'].forEach(p => {
        if (typeof virtual.attributes[p] !== 'undefined') {
          result[p] = virtual.attributes[p];
        }
      });
    }

    return { result, webmiddle };
  } catch (e) {
    console.log('callVirtual', e);
    throw e;
  }
};
