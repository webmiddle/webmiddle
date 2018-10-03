# webmiddle-component-browser

> Similar to the HttpRequest component, but it uses [Headless Chrome](https://developers.google.com/web/updates/2017/04/headless-chrome) to fetch html pages.

## Install

```bash
npm install --save webmiddle-component-browser
```

## Usage

```jsx
import { PropTypes, rootContext } from 'webmiddle';
import Browser from 'webmiddle-component-browser';

const MyComponent = () => (
  <Browser
    name="rawHtml"
    contentType="text/html"
    url="https://news.ycombinator.com/"
    waitFor=".athing"
  />
);

rootContext.evaluate(<MyComponent />)
.then(resource => {
  console.log(resource.content); // the html page as a string
});
```

## How it works

The advantage of using such a component is that any **JavaScript**
contained in the page is executed, thus this component is a must for
fetching SPAs (single page applications) or any other page with dynamic
content created in the client-side.

On the other end, the component has a bigger resource usage **footprint**,
as it needs to spawn separate Headless Chrome processes that communicate with
the main Node process.

The component is built on top of the [puppeteer](https://github.com/GoogleChrome/puppeteer) library.

It uses the [CookieManager](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-manager-cookie)
as a jar, so that **cookies** obtained from
Browser calls can be shared in the HttpRequest calls and vice versa.

In terms of body conversion, http errors and retries works very
similarly to the HttpRequest component.

The main difference is the **waitFor** property, which tells the component
to wait until the selector specified in the property is found on the
page.

Such property can be used to wait for client-side parts of the page to
be rendered before returning the resource.

If the response content-type isn't relative to an html document,
then the **waitFor** property is ignored and the response body
is returned as is.

The default response content-type can be overridden by using the **contentType**
property.

## Properties

Name                   | Description
-----------------------|------------------------------------------------------
name                   | The name of the returned resource.
contentType            | The contentType of the returned resource
url                    | The url of the http request.
method (optional)      | The method of the http request, e.g. 'GET', 'POST'. Defaults to 'GET'.
body (optional)        | The body of the http request.
httpHeaders (optional) | Additional http headers to use in the http request.
waitFor (optional)     | A query selector, such as `.articles`, that the component needs to wait for.