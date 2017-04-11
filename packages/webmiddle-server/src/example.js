import Server from './index';
import WebMiddle from 'webmiddle';

const textResource = (content, name = 'result') => ({
  name,
  contentType: 'text/plain',
  content: (typeof content !== 'undefined' && content !== null) ? String(content) : content,
});

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

const parentWebmiddle = new WebMiddle({
  services: {
    divide: ({ a, b }) => delay(60000).then(() => textResource(a / b)),
  },
  settings: {
    some: 'other',
    foo: 'original',
    deeply: {
      very: {
        nested: {
          property: 'let',
        },
      },
      nested: {
        property: 'const',
      },
    },
  },
});

const webmiddle = new WebMiddle({
  parent: parentWebmiddle,
  services: {
    multiply: ({ a, b }) => textResource(a * b),
  },
  settings: {
    foo: 'bar',
    deeply: {
      nested: {
        property: 'val',
      },
    },
  },
});

const server = new Server(webmiddle);
server.start();
