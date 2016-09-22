import WebMiddle, { PropTypes } from 'webmiddle';
import request from 'request';

const HttpRequest =
({ name, contentType, url, method = 'GET', body = {}, httpHeaders = {}, cookies = {} }) => {
  // TODO: cookies
  return new Promise((resolve, reject) => {
    try {
      const isJsonBody = httpHeaders && httpHeaders['Content-Type'] === 'application/json';

      if (typeof body === 'object' && body !== null) {
        // body as string
        if (isJsonBody) {
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

      request({
        uri: url,
        method,
        body,
        headers: {
          // default form content type needs to be explicitly set
          // (request doesn't do it automatically when using the body property)
          'Content-Type': !isJsonBody ? 'application/x-www-form-urlencoded' : undefined,
          ...httpHeaders,
        },
        jar: true, // remember cookies for future use
      }, (error, response, content) => {
        if (!error && response.statusCode === 200) {
          resolve({
            name,
            contentType,
            content: (contentType === 'application/json') ? JSON.parse(content) : content,
          });
        } else {
          reject(error || response.statusCode);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

HttpRequest.propTypes = {
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
};

export default HttpRequest;
