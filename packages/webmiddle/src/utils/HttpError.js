export default class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "HttpError";

    this.statusCode = statusCode;
  }
}
