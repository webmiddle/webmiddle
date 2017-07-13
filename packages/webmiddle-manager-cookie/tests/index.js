import test from "ava";
import CookieManager from "../src/index";

test.beforeEach(t => {});

test("main", async t => {
  const cookieManager = new CookieManager();

  t.truthy(cookieManager.jar);
  t.truthy(cookieManager.Cookie);
});
