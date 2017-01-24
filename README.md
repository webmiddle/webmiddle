# WebMiddle

> JSX framework for multi-layer web data integration

Because JSX can be more than just React.

**Note:** this project is still in its early stages of development, any feedback or contribution is highly appreciated!
<hr />

WebMiddle is a JSX-driven Node.js framework for extracting, transforming and processing web data from multiple heterogeneous sources, using a multi-layer approach, where each web middleware, or **webmiddle**, abstracts one or more sources of data, so to produce a structured output with the format of your choice, that can be then consumed by the higher-level middleware.

Each web middleware is implemented via JSX services, leading to a highly composable, extensible and declarative approach.

You can create complex wrappers and applications by registering multiple services to a webmiddle instance, specify settings and evaluate options, composing webmiddles and much more!

These applications can range from simple web scrapers to web integration tools targeting both APIs, raw HTML pages, XML resources and so on.

Read the [Documentation](https://webmiddle.github.io/docs/) for a detailed description.

## JSX services

```jsx
const FetchPageLinks = ({ url, query, waitFor }) =>
  <Pipe>
    <Browser
      name="rawHtml"
      contentType="text/html"
      url={url}
      waitFor={waitFor}
    />

    {({ rawHtml }) =>
      <HtmlToJson name="result" from={rawHtml}>
        <anchors
          el="a"
          condition={el =>
            el.text().toUpperCase().indexOf(query.toUpperCase()) !== -1
          }
        >
          {elMap(el => (
            <anchor el={el}>
              <url>{elAttr('href')}</url>
              <text>{elText()}</text>
            </anchor>
          ))}
        </anchors>
      </HtmlToJson>
    }
  </Pipe>
);

FetchPageLinks.propTypes = {
  url: PropTypes.string.isRequired,
  query: PropTypes.string.isRequired,
  waitFor: PropTypes.string,
};
```

**Yes, you got this right, JSX for defining application logic :)**

Services are the building blocks of the webmiddle framework, they can be defined and composed to perform all the web data integration tasks.

[Pipe](/packages/webmiddle-service-pipe), [Browser](/packages/webmiddle-service-browser) and [HtmlToJson](/packages/webmiddle-service-cheerio-to-json) are all core services, however there is no actual difference between a core service and a service that you may want to develop yourself.  

This means that anyone can contribute by adding new services for doing the more disparate things!

-> [Learn more](https://webmiddle.github.io/docs/jsx_services.html)

## WebMiddle instances

```jsx
const webmiddle = new WebMiddle();

webmiddle.evaluate(
  <FetchPageLinks
    url="https://news.ycombinator.com/"
    query="javascript"
  />,
{ expectResource: true })
.then(outputResource => {
  console.log(
    JSON.stringify(outputResource.content, null, 2)
  );
});
```

-> [Learn more](https://webmiddle.github.io/docs/technical_documentation/webmiddle.html)

## Multiple layers

![Multi layer](https://webmiddle.github.io/assets/img/documentation/webmiddle_multi-layer.png "Multi layer")

This separation of concerns might seem cumbersome, but it makes possible to reuse the same site webmiddle in all sorts of projects, by writing handlers that are often small and that in any case are wrapping content which is already semantic and supposedly well documented (differently than HTML pages).

-> [Learn more](https://webmiddle.github.io/docs/multiple_layers.html)

## Core features

Features currently provided via the core services and the WebMiddle class:

- **Concurrency**, for executing multiple asynchronous services at the same time
- **HTTP** requests
- **PhantomJS** requests, for pages using client-side generated content
- **Cookie JAR**, for sharing cookies among different services and webmiddle instances
- **Caching**, for resuming work in case of crash
- **Error handling**, via customizable retries and catch options
- **Data conversion** from/to multiple formats
  - Currently HTML/XML/JSON to JSON
  - New formats can be easily added by targeting the apposite "virtual" intermediate format

## Want more services or webmiddles for popular sites?

Create your own and share them with the community as node modules!

**NOTE**: If you think a service / feature is so common and general purpose that it should be in the core, please [open an issue](https://github.com/webmiddle/webmiddle/issues/new) or just do a pull request!

## Contribute

Here is a list of possibile core improvements that are still missing:
- Web service layer (to expose the services via a REST API)
- Proxy support
- HTTP/OAuth Authentication
- Redirects management
- Advanced logging and debugging
- Easy form submissions
- Access to queried server headers
- Retry delay and timeouts
