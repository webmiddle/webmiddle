import WebMiddle from 'webmiddle';
import HttpRequest from './HttpRequest';

const webmiddle = new WebMiddle({
  services: {
    HttpRequest,
  },
});

export default webmiddle.service('HttpRequest');
