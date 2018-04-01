import WebMiddle, { PropTypes, pickDefaults } from "webmiddle";
import HttpError from "webmiddle/dist/utils/HttpError";
import request from "request";

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
  return new Promise((resolve, reject) => {
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
      jar._jar = context.webmiddle.cookieManager.jar;

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
  });
}

HttpRequest.options = (props, context) =>
  pickDefaults(
    {
      retries: context.webmiddle.setting("network.retries")
    },
    context.options
  );

HttpRequest.propTypes = {
  name: PropTypes.string.isRequired,
  contentType: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  method: PropTypes.string,
  body: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  httpHeaders: PropTypes.object
};

export default HttpRequest;
