import WebMiddle, { PropTypes } from 'webmiddle';
import phantom from 'phantom';

// promise-based implementation of http://stackoverflow.com/a/19070446
function waitForFn(config) {
  config._start = config._start || new Date();

  if (config.timeout && new Date - config._start > config.timeout) {
    const errorMessage = 'waitForFn timedout ' + (new Date - config._start) + 'ms';
    if (config.debug) console.log(errorMessage);
    return Promise.reject(errorMessage);
  }

  return config.check().then(result => {
    if (result) {
      if (config.debug) console.log('waitForFn success ' + (new Date - config._start) + 'ms');
      return result;
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        waitForFn(config).then(resolve, reject);
      }, config.interval || 0);
    });
  });
}

function setCookies(page, webmiddle) {
  const allCookies = webmiddle.cookieManager.jar.toJSON().cookies;
  return Promise.all(allCookies.map(cookie =>
    page.addCookie({
      name: cookie.key,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      httponly: cookie.httpOnly,
      secure: cookie.secure,
      expires: cookie.expires,
    })
  ));
}

// TODO: cookies
async function Browser({
  name, contentType, url, method = 'GET', body = {}, httpHeaders = {}, waitFor, webmiddle,
}) {
  let sitepage = null;
  let phInstance = null;
  const pageResponses = {};
  let finalUrl = url;

  if (typeof body === 'object' && body !== null) {
    // body as string
    if (httpHeaders && httpHeaders['Content-Type'] === 'application/json') {
      body = JSON.stringify(body);
    } else {
      // default: convert to form data
      body = Object.keys(body).reduce((list, prop) => {
        const value = body[prop];
        list.push(`${encodeURIComponent(prop)}=${encodeURIComponent(value)}`);
        return list;
      }, []).join('&');
    }
  }

  return phantom.create()
  .then(instance => {
    phInstance = instance;
    return instance.createPage();
  })
  .then(async page => {
    sitepage = page;

    //page.customHeaders = httpHeaders; // TODO: doesn't seem to work

    page.on('onResourceReceived', (response) => {
      // track final response (after redirects)
      // https://github.com/ariya/phantomjs/issues/10185#issuecomment-38856203
      pageResponses[response.url] = response;

      // save new cookies
      response.headers.forEach(header => {
        if (header.name.toLowerCase() === 'set-cookie') {
          const values = header.value.split('\n');
          values.forEach(value => {
            const cookie = webmiddle.cookieManager.Cookie.parse(value, {
              loose: true,
            });
            webmiddle.cookieManager.jar.setCookieSync(cookie, response.url, {});
          });
        }
      });
    });
    page.on('onUrlChanged', (targetUrl) => {
      finalUrl = targetUrl;
    });

    // TODO: are httpHeaders still sent in case of redirect?
    const settings = {
      operation: method,
      headers: httpHeaders,
      data: body,
    };

    // TODO: check if all cookies are added, it might be that
    // those not relevant to the page url are discarded
    // (even though at this moment the page doesn't even have an url)
    // Also check in case of redirects or XHR.
    await setCookies(page, webmiddle);

    return page.open(url, settings);
  })
  .then(status => {
    const pageResponse = pageResponses[finalUrl];

    if (status !== 'success' || pageResponse.status !== 200) {
      throw pageResponse;
    }

    if (waitFor) {
      return waitForFn({
        debug: true,  // optional
        interval: 0,  // optional
        timeout: 10000,  // optional
        check: () => sitepage.evaluate((waitFor) =>
          document.querySelector(waitFor) !== null
        , waitFor),
      });
    }
    return Promise.resolve();
  })
  .then(() => sitepage.property('content'))
  .then(content => {
    sitepage.close();
    phInstance.exit();

    return {
      name,
      contentType,
      content: (contentType === 'application/json') ? JSON.parse(content) : content,
    };
  })
  .catch(error => {
    phInstance.exit();
    throw error;
  });
}

Browser.options = ({ webmiddle }) => ({
  retries: webmiddle.setting('network.retries'),
});

Browser.propTypes = {
  name: PropTypes.string.isRequired,
  contentType: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  method: PropTypes.string,
  body: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
  httpHeaders: PropTypes.object,
  waitFor: PropTypes.string,
  webmiddle: PropTypes.object.isRequired,
};

export default Browser;
