class HttpError {
  constructor(message, statusCode) {
    this.name = 'HttpError';
    this.stack = new Error().stack;

    this.message = message;
    this.statusCode = statusCode;
  }
}
HttpError.prototype = Object.create(Error.prototype);

export default HttpError;
