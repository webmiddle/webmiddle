import WebMiddle from 'webmiddle';
import ArrayMap from './ArrayMap';

const webmiddle = new WebMiddle({
  services: {
    ArrayMap,
  },
});

export default webmiddle.service('ArrayMap');
