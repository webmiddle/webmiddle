import { CookieJar, Cookie } from "tough-cookie";

export default class CookieManager {
  constructor() {
    this.jar = new CookieJar(undefined, {
      looseMode: true
    });

    this.Cookie = Cookie;
  }
}
