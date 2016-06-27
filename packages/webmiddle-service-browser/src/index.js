import WebMiddle from 'webmiddle';
import Browser from './Browser';

const webmiddle = new WebMiddle({
  services: {
    Browser,
  },
});

export default webmiddle.service('Browser');
