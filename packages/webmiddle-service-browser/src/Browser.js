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

const Browser =
({ name, contentType, url, method = 'GET', body = {}, httpHeaders = {}, cookies = {}, waitFor }) => {
  // TODO: cookies
  return new Promise((resolve, reject) => {
    let sitepage = null;
    let phInstance = null;
    const pageResponses = {};
    let finalUrl = url;

    if (typeof body === 'object' && body !== null) {
      // TODO: body to string (form string or stringified json data etc. depending on "Content-Type" header)
    }

    phantom.create()
    .then(instance => {
      phInstance = instance;
      return instance.createPage();
    })
    .then(page => {
      sitepage = page;

      //page.customHeaders = httpHeaders; // TODO: doesn't seem to work

      // track final response (after redirects)
      // https://github.com/ariya/phantomjs/issues/10185#issuecomment-38856203
      page.on('onResourceReceived', (response) => {
        pageResponses[response.url] = response;
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
    })
    .then(() => sitepage.property('content'))
    .then(content => {
      sitepage.close();
      phInstance.exit();

      resolve({ name, contentType, content });
    })
    .catch(error => {
      phInstance.exit();
      reject(error);
    });
  });
};

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
  cookies: PropTypes.object,
  waitFor: PropTypes.string,
};

export default Browser;
