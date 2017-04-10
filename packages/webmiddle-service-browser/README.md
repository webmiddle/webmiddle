# webmiddle-service-browser

> Similar to the HttpRequest service, but it uses the headless browser [PhantomJS](http://phantomjs.org/) to fetch html pages.

## Install

```bash
npm install --save webmiddle-service-browser
```

## Usage

```jsx
import WebMiddle, { PropTypes, evaluate, createContext } from 'webmiddle';
import Browser from 'webmiddle-service-browser';

const MyService = () => (
  <Browser
    name="rawHtml"
    contentType="text/html"
    url="https://news.ycombinator.com/"
    waitFor=".athing"
  />
);

const webmiddle = new WebMiddle();
evaluate(createContext(webmiddle), <MyService />)
.then(resource => {
  console.log(resource.content); // the html page as a string
});
```

## How it works

The advantage of using such a service is that any **JavaScript**
contained in the page is executed, thus this service is a must for
fetching SPAs (single page applications) or any other page with dynamic
content created in the client-side.

On the other end, the service has a bigger resource usage **footprint**,
as it needs to spawn a separate PhantomJS process that communicates with
the main Node process.

The service is built on top of the [phantomjs-node](https://github.com/amir20/phantomjs-node) library.

It uses the [CookieManager](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-manager-cookie) as a jar, so that **cookies** obtained from
Browser calls can be shared in the HttpRequest calls and vice versa.

In terms of body conversion, http errors and retries works very
similarly to the HttpRequest service.

The main difference is the **waitFor** property, which tells the service
to wait until the selector specified in the property is found on the
page.

Such property can be used to wait for client-side parts of the page to
be rendered before returning the resource.

Note that we are effectively using a browser for fetching the specified
url, this means that the response body will be always **wrapped into an
html document**, even in case the url points to a JSON file (the JSON
content will be wrapped into a “pre” HTML element).

## Properties

Name                   | Description
-----------------------|------------------------------------------------------
name                   | The name of the returned resource.
contentType            | The contentType of the returned resource
url                    | The url of the http request.
method (optional)      | The method of the http request, e.g. 'GET', 'POST'. Defaults to 'GET'.
body (optional)        | The body of the http request.
httpHeaders (optional) | Additional http headers to use in the http request.
waitFor (optional)     | A query selector, such as `.articles`, that the service needs to wait for.
