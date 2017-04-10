# WebMiddle

> Node.js JSX framework for modular web scraping and data integration 

Because JSX can be more than just React!

**Note:** this project is still in its early stages of development, any feedback or contribution is highly appreciated.
<hr />

WebMiddle is a [JSX](https://facebook.github.io/react/docs/introducing-jsx.html)-driven [Node.js](https://nodejs.org/) framework for extracting, transforming and processing web data from multiple heterogeneous sources, using a multi-layer approach, where each web middleware, or **webmiddle**, abstracts one or more sources of data, so to produce a structured output with the format of your choice, that can be then consumed by the higher-level middleware.

Each web middleware is implemented via JSX services, leading to a highly composable, extensible and declarative approach.

You can create complex wrappers and applications by registering multiple services to a webmiddle instance, specify settings and evaluate options, composing webmiddles and much more!

These applications can range from simple web scrapers to web integration tools targeting both APIs, raw HTML pages, XML resources and so on.

Read the [Documentation](https://webmiddle.github.io/docs/) for a detailed description.

## Examples

- [The site webmiddle for The New York Times](https://github.com/Maluen/webmiddle-site-nytimes)
- [The site webmiddle for Fox News](https://github.com/Maluen/webmiddle-site-foxnews)
- [WebMiddle application for searching articles from news sites](https://github.com/Maluen/webmiddle-project-search-news)

## Getting started

You can use [Yeoman](http://yeoman.io/) to quickly scaffold a new project:

```bash
npm install -g yo
npm install -g generator-webmiddle
yo webmiddle
```

-> [Learn more](https://webmiddle.github.io/docs/getting_started.html)

## JSX services

In terms of syntax, they are very similar to [react stateless functional components](https://medium.com/@housecor/react-stateless-functional-components-nine-wins-you-might-have-overlooked-997b0d933dbc#.91r5f1ish):

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

evaluate(createContext(webmiddle, { expectResource: true }), (
  <FetchPageLinks
    url="https://news.ycombinator.com/"
    query="javascript"
  />,
)).then(outputResource => {
  console.log(
    JSON.stringify(outputResource.content, null, 2)
  );
});
```

This will give us an output like the following:

```json
{
  "root": {
    "anchors": [
      {
        "anchor": {
          "url": "http://nearley.js.org/",
          "text": "Nearley – parser toolkit for JavaScript"
        }
      },
      {
        "anchor": {
          "url": "https://sekao.net/blog/industry.html",
          "text": "ClojureScript is the most-used functional language that compiles to JavaScript"
        }
      }
    ]
  }
}
```

-> [Learn more](https://webmiddle.github.io/docs/technical_documentation/webmiddle.html)

## Multiple layers

![Multi layer](https://webmiddle.github.io/assets/img/documentation/webmiddle_multi-layer.png "Multi layer")

This separation of concerns might seem cumbersome, but it makes possible to reuse the same site webmiddle in all sorts of projects, by writing handlers that are often small and that in any case are wrapping content which is already semantic and supposedly well documented (differently than HTML pages).

-> [Learn more](https://webmiddle.github.io/docs/multiple_layers.html)

## Core features

Features currently provided via the core services and the WebMiddle class:

- **Concurrency**, for executing multiple asynchronous services at the same time.
- **HTTP** requests.
- **PhantomJS** requests, for SPAs and pages using client-side generated content.
- **Cookie JAR**, for sharing cookies among different services and webmiddle instances.
- **Caching**, for resuming work in case of crash.
- **Error handling**, via customizable retries and catch options.
- **Data conversion** from/to multiple formats.
  - Currently HTML/XML/JSON to JSON.
  - New formats can be easily added by targeting the apposite "virtual" intermediate format.

## Open source ecosystem

Create your own services and webmiddles and share them with the community as node modules!

One of the main philosophies of the framework is **reuse**, by creating an ecosystem where webmiddles for websites, services, converters and so on can be published as separate npm modules, so that they can be used in other projects.

**NOTE**: If you think a service / feature is so common and general that it should be in the core, please [open an issue](https://github.com/webmiddle/webmiddle/issues/new) or just do a pull request!

## Future improvements

Here is a list of important features that are still missing and that should be in the core in the future:
- Web service layer (to expose the services via a REST API)
- Proxy support
- HTTP/OAuth Authentication
- Redirects management
- Advanced logging and debugging
- Easy form submissions
- Access to queried server headers
- Delays and timeouts

## Contributing

This is a monorepo, i.e. all the core services and the main webmiddle package are all in this single repository.
It is inspired by [Babel](https://github.com/babel/babel) and other projects, check out this [article](https://github.com/babel/babel/blob/master/doc/design/monorepo.md) to know why this isn't an horrible idea after all.

It uses [Lerna](https://github.com/lerna/lerna) for managing the monorepo, as you might have guessed from the lerna.json file.
You can install it by running:

```bash
npm install --global lerna
```

Once this is done, install all the dependencies and link the packages together by running:

```bash
lerna boostrap
```

Each [package](https://github.com/webmiddle/webmiddle/tree/master/packages) uses the same build / test system.

Once you are inside a package folder, you can build it by running `npm run build` or `npm run build:watch` (for rebuilding on every change).

Tests use [AVA](https://github.com/avajs/ava), thus they can be written in modern JavaScript, moreover they will also run concurrently.
You can run the tests via `npm run test` or `npm run test:watch`. The latter option is highly recommended while developing, as it also produces a much more detailed output.

For running the same npm command in each package, use `lerna run`, example:

```bash
lerna run build
```

For running arbitrary commands, use `lerna exec`, example:

```bash
lerna exec -- rm -rf ./node_modules
```

See [Lerna commands](https://github.com/lerna/lerna#commands) for more info.
