import { PropTypes, ErrorBoundary } from "webmiddle";
import HttpError from "webmiddle/dist/utils/HttpError";
import request from "request";

const giveupErrorCodes = [410];
function isRetryable(err) {
  return (
    !(err instanceof Error && err.name === "HttpError") ||
    giveupErrorCodes.indexOf(err.statusCode) === -1
  );
}

function retries(context) {
  return typeof context.options.networkRetries !== "undefined"
    ? context.options.networkRetries
    : -1; // unlimited retries
}

function normalizeHttpHeaders(headers) {
  const newHeaders = {};
  Object.keys(headers).forEach(headerName => {
    newHeaders[headerName.toLowerCase()] = headers[headerName];
  });
  return newHeaders;
}

// TODO: cookies
function HttpRequest(
  { name, contentType, url, method = "GET", body = {}, httpHeaders = {} },
  context
) {
  return (
    <ErrorBoundary isRetryable={isRetryable} retries={retries(context)}>
      {
        new Promise((resolve, reject) => {
          try {
            console.log("HttpRequest", url);

            method = method.toUpperCase();
            httpHeaders = normalizeHttpHeaders(httpHeaders);

            if (method !== "GET" && !httpHeaders["content-type"]) {
              // default content type
              httpHeaders["content-type"] = "application/x-www-form-urlencoded";
            }

            const isJsonBody =
              httpHeaders && httpHeaders["content-type"] === "application/json";

            // remember cookies for future use
            // HACK: "request" and "cookieManager" both use "tough-cookie",
            // thus we just use the webmiddle cookie jar directly.
            // Things might go wrong in case of incompatible versions!
            const jar = request.jar();
            jar._jar = context.cookieManager.jar;

            if (typeof body === "object" && body !== null) {
              // body as string
              if (isJsonBody) {
                body = JSON.stringify(body);
              } else {
                // default: convert to form data
                body = Object.keys(body)
                  .reduce((list, prop) => {
                    const value = body[prop];
                    list.push(
                      `${encodeURIComponent(prop)}=${encodeURIComponent(value)}`
                    );
                    return list;
                  }, [])
                  .join("&");
              }
            }

            request(
              {
                uri: url,
                method,
                body,
                headers: {
                  // default form content type needs to be explicitly set
                  // (request doesn't do it automatically when using the body property)
                  "content-type": !isJsonBody
                    ? "application/x-www-form-urlencoded"
                    : undefined,
                  ...httpHeaders
                },
                jar
              },
              (error, response, content) => {
                if (
                  !error &&
                  response.statusCode >= 200 &&
                  response.statusCode <= 299
                ) {
                  contentType = contentType || response.headers["content-type"];
                  resolve({
                    name,
                    contentType,
                    content:
                      contentType === "application/json"
                        ? JSON.parse(content)
                        : content
                  });
                } else {
                  reject(
                    new HttpError(
                      error || "success",
                      response ? response.statusCode : null
                    )
                  );
                }
              }
            );
          } catch (err) {
            reject(err);
          }
        })
      }
    </ErrorBoundary>
  );
}

HttpRequest.propTypes = {
  name: PropTypes.string.isRequired,
  contentType: PropTypes.string,
  url: PropTypes.string.isRequired,
  method: PropTypes.string,
  body: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  httpHeaders: PropTypes.object
};

export default HttpRequest;
