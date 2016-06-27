import WebMiddle from 'webmiddle';
import Pipe from './Pipe';

const webmiddle = new WebMiddle({
  services: {
    Pipe,
  },
});

export default webmiddle.service('Pipe');
