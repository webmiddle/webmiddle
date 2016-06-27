import WebMiddle from 'webmiddle';
import JSONSelectToJson from './JSONSelectToJson';

const webmiddle = new WebMiddle({
  services: {
    JSONSelectToJson,
  },
});

export default webmiddle.service('JSONSelectToJson');
