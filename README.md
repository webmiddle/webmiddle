<p align="center">
  <a href="https://travis-ci.org/webmiddle/webmiddle"><img alt="Build Status" src="https://travis-ci.org/webmiddle/webmiddle.svg?branch=master"></a>
  <a href="https://codecov.io/gh/webmiddle/webmiddle"><img alt="Coverage Status" src="https://img.shields.io/codecov/c/github/webmiddle/webmiddle/master.svg?maxAge=43200"></a>
</p>

# webmiddle

> Node.js framework for modular web scraping and data extraction

The building block of any webmiddle application is the [JSX](http://facebook.github.io/jsx/) component.  
Each component executes one task or controls the execution of other tasks by composing other components.

```jsx
const FetchPageLinks({ url, query, name }) = () =>
  <Pipe>
    <HttpRequest contentType="text/html" url={url} />

    {rawHtml =>
      <HtmlToJson name={name} from={rawHtml} content={
        {
          anchors: $$.within("a", $$.pipe(
            $$.filter(el => el.text().toUpperCase().indexOf(query.toUpperCase()) !== -1),
            $$.map({
              url: $$.attr("href"),
              text: $$.getFirst()
            })
          ))
        }
      }/>
    }
  </Pipe>
```

The framework provides a set of core components for the most common operations, but there is no difference between a core component and a component that you may want to develop yourself.

Webmiddle applications can be quickly turned into REST APIs, allowing remote access via HTTP or WebSocket.
Use [webmiddle-devtools](https://github.com/webmiddle/webmiddle-devtools) for running and debugging your components and test them remotely.

## Links

- [Getting Started](https://webmiddle.github.io/docs/introduction/getting-started)
- [Try it live](https://repl.it/@Maluen/webmiddle-try-it-out)
- [Starter App repository](https://github.com/webmiddle/webmiddle-starter-app)
- [Devtools repository](https://github.com/webmiddle/webmiddle-devtools)

## Features

Built-in features provided by the core components:

- **[Concurrency](https://webmiddle.github.io/docs/control-flow/parallel)**, for executing multiple asynchronous components at the same time.
- **[HTTP](https://webmiddle.github.io/docs/fetching/httprequest)** requests.
- **[Puppeteer](https://webmiddle.github.io/docs/fetching/browser)** requests, for SPAs and pages using client-side generated content.
- **[Cookie JAR](https://webmiddle.github.io/docs/fetching/managercookie)**, for sharing cookies among different components and webmiddle objects.
- **[Caching](https://webmiddle.github.io/docs/storing/resume)**, for resuming work in case of crash.
- **[Error handling](https://webmiddle.github.io/docs/webmiddle/errorboundary)**, via customizable retries and catch options.
- **Resource transformations**
  - **[HTML/XML to JSON](https://webmiddle.github.io/docs/transforming/cheeriotojson)**
  - **[JSON to JSON](https://webmiddle.github.io/docs/transforming/jsonselecttojson)**

## Core packages

<table align="center">
  <thead>
    <tr>
      <td><b>Name</b></td>
      <td><b>Description</b></td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>webmiddle</td>
      <td><a href="https://badge.fury.io/js/webmiddle"><img src="https://badge.fury.io/js/webmiddle.svg" alt="npm version" height="18"></a></td>
    </tr>
    <tr>
      <td>webmiddle-manager-cookie</td>
      <td><a href="https://badge.fury.io/js/webmiddle-manager-cookie"><img src="https://badge.fury.io/js/webmiddle-manager-cookie.svg" alt="npm version" height="18"></a></td>
    </tr>
    <tr>
      <td>webmiddle-component-pipe</td>
      <td><a href="https://badge.fury.io/js/webmiddle-component-pipe"><img src="https://badge.fury.io/js/webmiddle-component-pipe.svg" alt="npm version" height="18"></a></td>
    </tr>
    <tr>
      <td>webmiddle-component-parallel</td>
      <td><a href="https://badge.fury.io/js/webmiddle-component-parallel"><img src="https://badge.fury.io/js/webmiddle-component-parallel.svg" alt="npm version" height="18"></a></td>
    </tr>
    <tr>
      <td>webmiddle-component-resume</td>
      <td><a href="https://badge.fury.io/js/webmiddle-component-resume"><img src="https://badge.fury.io/js/webmiddle-component-resume.svg" alt="npm version" height="18"></a></td>
    </tr>
    <tr>
      <td>webmiddle-component-http-request</td>
      <td><a href="https://badge.fury.io/js/webmiddle-component-http-request"><img src="https://badge.fury.io/js/webmiddle-component-http-request.svg" alt="npm version" height="18"></a></td>
    </tr>
    <tr>
      <td>webmiddle-component-browser</td>
      <td><a href="https://badge.fury.io/js/webmiddle-component-browser"><img src="https://badge.fury.io/js/webmiddle-component-browser.svg" alt="npm version" height="18"></a></td>
    </tr>
    <tr>
      <td>webmiddle-component-cheerio-to-json</td>
      <td><a href="https://badge.fury.io/js/webmiddle-component-cheerio-to-json"><img src="https://badge.fury.io/js/webmiddle-component-cheerio-to-json.svg" alt="npm version" height="18"></a></td>
    </tr>
    <tr>
      <td>webmiddle-component-jsonselect-to-json</td>
      <td><a href="https://badge.fury.io/js/webmiddle-component-jsonselect-to-json"><img src="https://badge.fury.io/js/webmiddle-component-jsonselect-to-json.svg" alt="npm version" height="18"></a></td>
    </tr>
    <tr>
      <td>webmiddle-server</td>
      <td><a href="https://badge.fury.io/js/webmiddle-server"><img src="https://badge.fury.io/js/webmiddle-server.svg" alt="npm version" height="18"></a></td>
    </tr>
    <tr>
      <td>webmiddle-client</td>
      <td><a href="https://badge.fury.io/js/webmiddle-client"><img src="https://badge.fury.io/js/webmiddle-client.svg" alt="npm version" height="18"></a></td>
    </tr>
  </tbody>
</table>

## Open source ecosystem

Create your own components and publish them to npm!

One of the main philosophies of the framework is **reuse**, by creating an ecosystem where components can be published as separate npm modules to be usable in other projects.

**NOTE**: If you think that a component / feature is so common and general that it should be in the core, [open an issue](https://github.com/webmiddle/webmiddle/issues/new) or just do a pull request!

## Contributing

This is a monorepo, i.e. all the core components and the main webmiddle package are all in this single repository.

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
