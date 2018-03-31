import WebMiddle, { PropTypes, pickDefaults } from "webmiddle";
import HttpError from "webmiddle/dist/utils/HttpError";
import puppeteer from "puppeteer";

function pageSetCookies(page, context) {
  const allCookies = context.webmiddle.cookieManager.jar.toJSON().cookies;
  return Promise.all(
    allCookies.map(cookie =>
      page.setCookie({
        name: cookie.key,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        expires: cookie.expires
      })
    )
  );
}

function bodyToFormData(body) {
  if (typeof body !== "string") return body;
  const formData = {};
  body.split("&").map(entry => {
    const [name, value] = entry.split("=");
    formData[decodeURIComponent(name)] = decodeURIComponent(value);
  });
  return formData;
}

async function pageGoto(page, url, options = {}) {
  const { method, headers, body } = options;
  let pageResponse = null;
  let isFetch = false;
  let onRequest = null;
  try {
    // extra http requests only for the initial request
    onRequest = request => {
      if (
        request.frame() === page.mainFrame() &&
        (isFetch || request.resourceType() === "document") &&
        request.redirectChain().length === 0
      ) {
        page.removeListener("request", onRequest);
        page.setExtraHTTPHeaders({});
      }
    };
    page.on("request", onRequest);
    await page.setExtraHTTPHeaders(headers);

    if (method === "GET") {
      await page.evaluate(`window.location.href = ${JSON.stringify(url)}`);
      pageResponse = await page.waitForNavigation({
        waitUntil: "domcontentloaded"
      });
    } else if (
      headers["content-type"] === "application/x-www-form-urlencoded"
    ) {
      const formData = bodyToFormData(body);
      await page.setContent(`
        <form
          method=${JSON.stringify(method)}
          action=${JSON.stringify(url)}
        >
          ${Object.keys(formData).map(
            name => `
            <input
              type="hidden"
              name=${JSON.stringify(name)}
              value=${JSON.stringify(formData[name])}
            />
          `
          )}
        </form>
      `);
      await page.evaluate("document.querySelector('form').submit()");
      pageResponse = await page.waitForNavigation({
        waitUntil: "domcontentloaded"
      });
    } else {
      isFetch = true;
      let lastResponse = null;
      let onResponse = null;
      try {
        onResponse = response => {
          lastResponse = response;
        };
        page.on("response", onResponse);

        let bodyString = typeof body === "string" ? body : JSON.stringify(body); // assumes body is an object

        await page.evaluate(`
          fetch(${JSON.stringify(url)}, {
            method: ${JSON.stringify(method)},
            body: ${JSON.stringify(bodyString)},
            credentials: 'include',
            redirect: 'follow',
          }).then(response => {
            return response.text();
          }).then(content => {
            var pre = document.createElement('pre');
            pre.textContent = content;
            document.write(pre.outerHTML);
          });
        `);
      } finally {
        page.removeListener("response", onResponse);
      }
      pageResponse = lastResponse;
    }
  } finally {
    page.removeListener("request", onRequest);
    await page.setExtraHTTPHeaders({});
  }
  return pageResponse;
}

function normalizeHttpHeaders(headers) {
  const newHeaders = {};
  Object.keys(headers).forEach(headerName => {
    newHeaders[headerName.toLowerCase()] = headers[headerName];
  });
  return newHeaders;
}

let browser = null;
async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch();
  }
  return browser;
}

// TODO: cookies
async function Browser(
  {
    name,
    contentType,
    url,
    method = "GET",
    body = {},
    httpHeaders = {},
    waitFor
  },
  context
) {
  console.log("Browser", url);

  method = method.toUpperCase();
  httpHeaders = normalizeHttpHeaders(httpHeaders);

  if (body && !httpHeaders["content-type"]) {
    // default content type
    httpHeaders["content-type"] = "application/x-www-form-urlencoded";
  }

  let browser = null;
  let page = null;
  let onResponse = null;
  try {
    browser = await getBrowser();
    page = await browser.newPage();

    // track new cookies and store them into the jar
    onResponse = response => {
      const headers = response.headers();
      Object.keys(headers).forEach(headerName => {
        const headerValue = headers[headerName];
        if (headerName.toLowerCase() === "set-cookie") {
          const values = headerValue.split("\n");
          values.forEach(value => {
            const cookie = context.webmiddle.cookieManager.Cookie.parse(value, {
              loose: true
            });
            context.webmiddle.cookieManager.jar.setCookieSync(
              cookie,
              response.url(),
              {}
            );
          });
        }
      });
    };
    page.on("response", onResponse);

    // TODO: check if all cookies are added, it might be that
    // those not relevant to the page url are discarded
    // (even though at this moment the page doesn't even have an url)
    // Also check in case of redirects or XHR.
    await pageSetCookies(page, context);

    let pageResponse = null;
    let statusMessage;
    try {
      pageResponse = await pageGoto(page, url, {
        method,
        headers: httpHeaders,
        body
      });
      statusMessage = "success";
    } catch (err) {
      console.error(err);
      pageResponse = null;
      statusMessage = err instanceof Error ? err.message : String(err);
    }

    if (
      statusMessage !== "success" ||
      !pageResponse ||
      pageResponse.status() !== 200
    ) {
      throw new HttpError(
        statusMessage,
        pageResponse ? pageResponse.status() : null
      );
    }

    if (waitFor) {
      await page.waitForFunction(
        `document.querySelector(${JSON.stringify(waitFor)})`,
        {
          polling: 500,
          timeout: 10000
        }
      );
    }

    const content = await page.content();

    return {
      name,
      contentType,
      content:
        contentType === "application/json" ? JSON.parse(content) : content
    };
  } finally {
    if (page) {
      page.removeListener("response", onResponse);
      await page.close();
    }
  }
}

Browser.options = (props, context) =>
  pickDefaults(
    {
      retries: context.webmiddle.setting("network.retries")
    },
    context.options
  );

Browser.propTypes = {
  name: PropTypes.string.isRequired,
  contentType: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  method: PropTypes.string,
  body: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  httpHeaders: PropTypes.object,
  waitFor: PropTypes.string
};

export default Browser;
