import WebMiddle from 'webmiddle';
import CheerioToJson from './CheerioToJson';
import { helpers } from 'webmiddle-service-cheerio-to-virtual';

export { helpers };

const webmiddle = new WebMiddle({
  services: {
    CheerioToJson,
  },
});

export default webmiddle.service('CheerioToJson');
