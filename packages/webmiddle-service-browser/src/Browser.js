import WebMiddle, { PropTypes, pickDefaults } from 'webmiddle';
import HttpError from 'webmiddle/dist/utils/HttpError';
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

function setCookies(page, context) {
  const allCookies = context.webmiddle.cookieManager.jar.toJSON().cookies;
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
  name, contentType, url, method = 'GET', body = {}, httpHeaders = {}, waitFor,
}, context) {
  console.log('Browser', url);

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
            const cookie = context.webmiddle.cookieManager.Cookie.parse(value, {
              loose: true,
            });
            context.webmiddle.cookieManager.jar.setCookieSync(cookie, response.url, {});
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
    await setCookies(page, context);

    return page.open(url, settings);
  })
  .then(status => {
    const pageResponse = pageResponses[finalUrl];

    if (status !== 'success' || pageResponse.status !== 200) {
      throw new HttpError(status, pageResponse ? pageResponse.status : null);
    }

    if (waitFor) {
      return waitForFn({
        debug: true,  // optional
        interval: 500,  // optional
        timeout: 10000,  // optional
        check: () => sitepage.evaluateJavaScript( // we don't use "evaluate" since it fails under nyc
          `function() { return document.querySelector(${JSON.stringify(waitFor)}) !== null; }`
        ),
      });
    }
    return Promise.resolve();
  })
  .then(() => sitepage.property('content'))
  .then(content => {
    //sitepage.close();
    return phInstance.exit().then(() => {
      return {
        name,
        contentType,
        content: (contentType === 'application/json') ? JSON.parse(content) : content,
      };
    });
  })
  .catch(error => {
    return phInstance.exit().then(() => {
      throw error;
    });
  });
}

Browser.options = (props, context) => pickDefaults({
  retries: context.webmiddle.setting('network.retries'),
}, context.options);

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
};

export default Browser;
