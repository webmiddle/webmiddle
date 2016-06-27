import WebMiddle from 'webmiddle';
import VirtualToJson from './VirtualToJson';

const webmiddle = new WebMiddle({
  services: {
    VirtualToJson,
  },
});

export default webmiddle.service('VirtualToJson');
