<p align="center">
  <a href="https://travis-ci.org/webmiddle/webmiddle"><img alt="Build Status" src="https://travis-ci.org/webmiddle/webmiddle.svg?branch=master"></a>
  <a href="https://gemnasium.com/github.com/webmiddle/webmiddle"><img alt="Dependency Status" src="https://gemnasium.com/badges/github.com/webmiddle/webmiddle.svg"></a>
  <a href="https://codecov.io/gh/webmiddle/webmiddle"><img alt="Coverage Status" src="https://img.shields.io/codecov/c/github/webmiddle/webmiddle/master.svg?maxAge=43200"></a>
</p>

# webmiddle

> Node.js JSX framework for modular web scraping and data integration 

webmiddle is a Node.js framework for extracting, transforming and combining data from multiple websites and web APIs.

webmiddle applications can range from simple web scrapers to complex web integration tools targeting JSON APIs, raw HTML pages, XML resources and so on.

webmiddle applications are written in a declarative, functional and modular way, by using their most evident aspect: **[JSX](https://facebook.github.io/jsx/) services**.

Each service executes one task, or controls the execution of other tasks, by composing together other services in a tree-like fashion.

```jsx
function Main(props) {
  const { sites: siteNames } = props;
  return (
    <Pipe>
      <Parallel name="articlesBySite">
        {siteNames.map(siteName => {
          const site = sites[siteName];
          return (
            <SiteMain
              {...props}
              site={site}
              name={siteName}
            />
          );
        })}
      </Parallel>

      {({ articlesBySite }) =>
        <MergeArticles
          name="articles"
          articlesBySite={articlesBySite}
        />
      }
    </Pipe>
  );
}
```

Each service can be registered with a **webmiddle**, which is similar to a WEB API: a collection of services, each with its own endpoint, that can be called to execute the service at that endpoint with the given parameters.

A webmiddle exposes settings accessible by all of its services and can be easily turned into an actual REST API for remote access.

Services registered with remote webmiddles can be used locally as if they were regular services, allowing seamless development of distributed applications.

## Examples

- [The site webmiddle for The New York Times](https://github.com/Maluen/webmiddle-site-nytimes)
- [The site webmiddle for Fox News](https://github.com/Maluen/webmiddle-site-foxnews)
- [webmiddle application for searching articles from news sites](https://github.com/Maluen/webmiddle-project-search-news)

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

**Yes, you got this right, JSX for defining application logic!**

Calling the previous service with

```jsx
<FetchPageLinks
  url="https://news.ycombinator.com/"
  query="javascript"
/>
```

Will give an output like the following

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

Services are the building blocks of the webmiddle framework, they can be defined and composed to perform all the web data integration tasks.

[Pipe](/packages/webmiddle-service-pipe), [Browser](/packages/webmiddle-service-browser) and [HtmlToJson](/packages/webmiddle-service-cheerio-to-json) are all core services, however there is no actual difference between a core service and a service that you may want to develop yourself.  

This means that anyone can contribute by adding new services for doing the more disparate things!

-> [Learn more](https://webmiddle.github.io/docs/jsx_services.html)

## Remote execution

webmiddle services can be turned into REST APIs by using the `webmiddle-server` package, allowing remote access via HTTP or WebSocket.

Suppose you have the following services:

```javascript
const textResource = (content, name = "result") => ({
  name,
  contentType: "text/plain",
  content:
    typeof content !== "undefined" && content !== null
      ? String(content)
      : content
});

const Multiply = ({ a, b }) => textResource(a * b);
const Divide = ({ a, b }) => textResource(a / b);
```

Turn them into a server listening on port 3000:

```javascript
import Server from 'webmiddle-server';

const server = new Server({
  "math/multiply": Multiply,
  "math/divide": Divide,
}, { port: 3000 });
server.start();
```

In another machine, you can then use the `webmiddle-client` package to create a replica of the services run by the server, and execute them remotely. In term of usage it will be just like executing local services:

```javascript
// "localhost" since the server is in the same machine in this example
const client = new Client({
  protocol: "http",
  hostname: "localhost",
  port: "3000"
});

// get the service
const Multiply = client.service("math/multiply");

// execute it
evaluate(createContext({ retries: 2 }),
  <Multiply
    a={10}
    b={20}
  />
).then(result => {
  console.log(result);
}).catch(err => {
  console.log((err && err.stack) || err);
});
```

## Core features

Features currently provided via the core packages:

- **[Concurrency](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-parallel)**, for executing multiple asynchronous services at the same time.
- **[HTTP](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-http-request)** requests.
- **[Headless Chrome](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-browser)** requests, for SPAs and pages using client-side generated content.
- **[Cookie JAR](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-manager-cookie)**, for sharing cookies among different services and webmiddle objects.
- **[Caching](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-resume)**, for resuming work in case of crash.
- **Error handling**, via customizable retries and catch options.
- **[Data conversion](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-cheerio-to-virtual)** from/to multiple formats.
  - Currently HTML/XML/JSON to JSON.
  - New formats can be easily added by targeting the apposite "virtual" intermediate format.

## Open source ecosystem

Create your own services and webmiddles and share them with the community as node modules!

One of the main philosophies of the framework is **reuse**, by creating an ecosystem where webmiddles for websites, services, converters and so on can be published as separate npm modules, so that they can be used in other projects.

**NOTE**: If you think that a service / feature is so common and general that it should be in the core, [open an issue](https://github.com/webmiddle/webmiddle/issues/new) or just do a pull request!

## Future improvements

Here is a list of important features that are still missing and that should be in the core in the future:
- Proxy support
- HTTP/OAuth Authentication
- Redirects management
- Advanced logging and debugging
- Easy form submissions
- Access to queried server headers
- Delays and timeouts

## Contributing

This is a monorepo, i.e. all the core services and the main webmiddle package are all in this single repository.
It is inspired by [Babel](https://github.com/babel/babel) and other projects, check out this [article](https://github.com/babel/babel/blob/master/doc/design/monorepo.md) to see why this isn't an horrible idea after all.

It uses [Yarn](https://yarnpkg.com) and [Lerna](https://github.com/lerna/lerna) for managing the monorepo, as you might have guessed from the lerna.json file.

Start by installing the root dependencies with:

```bash
yarn
```

Then install all the packages dependencies and link the packages together by running:

```bash
yarn run lerna bootstrap
```

Build all the packages by running:

```bash
yarn run build
```

To run the tests for all the packages at once and get coverage info, execute:

```bash
yarn run test
```

> **NOTE**: make sure to build before running the tests.

> **NOTE**: If you are on Windows, you might need to run the install and bootstrap commands as administrator.

Each [package](https://github.com/webmiddle/webmiddle/tree/master/packages) uses the same build / test system.

Once you are inside a package folder, you can build it by running `yarn run build` or `yarn run build:watch` (for rebuilding on every change).

Tests use [AVA](https://github.com/avajs/ava), thus they can be written in modern JavaScript, moreover they will also run concurrently. You can run the tests with `yarn run test`. To run the tests on every change you can use `yarn run test:watch`. The latter option is highly recommended while developing, as it also produces a much more detailed output.

For running the same npm command in all the packages, use `lerna run`, example:

```bash
yarn run lerna run build
```

For running arbitrary commands, use `lerna exec`, example:

```bash
yarn run lerna -- exec -- rm -rf ./node_modules
```

See [Lerna commands](https://github.com/lerna/lerna#commands) for more info.
