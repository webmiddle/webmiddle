# webmiddle-service-http-request 

> Service built on top of the [request](https://github.com/request/request) library, it is used to perform http requests.

## Install

```bash
npm install --save webmiddle-service-http-request
```

## Usage

```jsx
import WebMiddle, { PropTypes } from 'webmiddle';
import HttpRequest from 'webmiddle-service-http-request';

const MyService = () => (
  <HttpRequest
    name="rawHtml"
    contentType="text/html"
    url="https://news.ycombinator.com/"
  />
);

const webmiddle = new WebMiddle();
webmiddle.evaluate(<MyService />)
.then(resource => {
  console.log(resource.content); // the html page as a string
});
```

## How it works

It uses the CookieManager for storing and retrieving cookies.

The **request body** can be specified either directly as a string or as
a JSON object, in the latter case it will be converted to a string by
the service.

The **body conversion** to string depends on the ‘Content-Type’ http
header, if it is set to “application/json”, then the body will be
JSON-stringified, otherwise the default
“application/x-www-form-urlencode” content type is assumed, thus the
body will be converted to form data.

The service resolves with the **response body** wrapped in a resource,
whose name and contentType must be specified as attributes.

If the contentType attribute is set to “application/json”, then the
content will be JSON-parsed, otherwise it will be kept as is.

In case of **http error**, the service fails with an **HttpError
object** containing the error status code.

The service sets the `retries` option as the one set in the
`network.retries` webmiddle setting. This way such number can be
configured at application/webmiddle level:

```jsx
HttpRequest.options = ({ webmiddle }) => ({
  retries: webmiddle.setting('network.retries'),
});
```

## Properties

Name                   | Description
-----------------------|------------------------------------------------------
name                   | The name of the returned resource.
contentType            | The contentType of the returned resource
url                    | The url of the http request.
method (optional)      | The method of the http request, e.g. 'GET', 'POST'. Defaults to 'GET'.
body (optional)        | The body of the http request.
httpHeaders (optional) | Additional http headers to use in the http request.
