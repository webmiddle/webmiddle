import WebMiddle, { PropTypes } from 'webmiddle';
import request from 'request';

const HttpRequest =
({ name, contentType, url, method = 'GET', body = {}, httpHeaders = {}, cookies = {} }) => {
  // TODO: cookies
  return new Promise((resolve, reject) => {
    request({
      uri: url,
      method,
      form: body,
      headers: httpHeaders,
      jar: true, // remember cookies for future use
    }, (error, response, content) => {
      if (!error && response.statusCode === 200) {
        resolve({ name, contentType, content });
      } else {
        reject(error || response.statusCode);
      }
    });
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
