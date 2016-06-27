import WebMiddle from 'webmiddle';
import JSONSelectToVirtual from './JSONSelectToVirtual';

const webmiddle = new WebMiddle({
  services: {
    JSONSelectToVirtual,
  },
});

export default webmiddle.service('JSONSelectToVirtual');
