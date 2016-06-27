import WebMiddle from 'webmiddle';
import Parallel from './Parallel';

const webmiddle = new WebMiddle({
  services: {
    Parallel,
  },
});

export default webmiddle.service('Parallel');
