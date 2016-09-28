import { CookieJar } from 'tough-cookie';

export default class CookieManager {
  constructor() {
    this.jar = new CookieJar(undefined, {
      looseMode: true,
    });
  }
}
