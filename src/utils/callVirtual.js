import isResource from './isResource';

export default async function callVirtual(virtual) {
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

  return { result, webmiddle };
};
