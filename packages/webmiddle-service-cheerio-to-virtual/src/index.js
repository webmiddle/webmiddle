import WebMiddle from 'webmiddle';
import CheerioToVirtual from './CheerioToVirtual';
import * as helpers from './helpers';

export { helpers };

const webmiddle = new WebMiddle({
  services: {
    CheerioToVirtual,
  },
});

export default webmiddle.service('CheerioToVirtual');
