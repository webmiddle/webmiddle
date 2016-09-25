import WebMiddle from 'webmiddle';
import Resume from './Resume';

const webmiddle = new WebMiddle({
  services: {
    Resume,
  },
});

export default webmiddle.service('Resume');
