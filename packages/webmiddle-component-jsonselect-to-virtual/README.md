# webmiddle-component-jsonselect-to-virtual 

> Similar to the [CheerioToVirtual](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-component-cheerio-to-virtual) component, but for **JSON** resources via the [JSONSelect](https://github.com/lloyd/JSONSelect) library.

## Install

```bash
npm install --save webmiddle-component-jsonselect-to-virtual 
```

## Usage

```jsx
import { PropTypes, rootContext, isResource } from 'webmiddle';
import Pipe from 'webmiddle-component-pipe';
import HttpRequest from 'webmiddle-component-http-request';
import JSONSelectToVirtual, { helpers } from 'webmiddle-component-jsonselect-to-virtual';
const { elGet, elMap, elPipe } = helpers;

const MyComponent = ({ apiKey, query, pageNumber }) => (
  <Pipe>
    <HttpRequest
      name="rawJson"
      contentType="application/json"
      url={
        `https://api.nytimes.com/svc/search/v2/articlesearch.json` +
         `?q=${encodeURIComponent(query)}` +
        `&response-format=json&api-key=${encodeURIComponent(apiKey)}` +
        `&page=${encodeURIComponent(pageNumber)}`
      }
    />

    {({ rawJson }) =>
      <JSONSelectToVirtual
        name="searchArticles"
        from={rawJson}
      >
        <articles el=".docs > *">
            {elMap(el =>
              <article el={el}>
                <url el=".web_url">{elGet()}</url>
                <title el=".headline > .main">{elGet()}</title>
                <description el=".snippet">{elGet()}</description>
                <image
                  el=".multimedia > *"
                  condition={currEl =>
                    currEl.subtype === 'thumbnail'}
                >
                  {elPipe([
                    elGet('.url'),
                    relativeUrl => relativeUrl ?
                      `http://www.nytimes.com/${relativeUrl}`
                      : null,
                  ])}
                </image>
              </article>
            )}
        </articles>
      </JSONSelectToVirtual>
    }
  </Pipe>
);

rootContext.evaluate(
  <MyComponent
    apiKey="MY API KEY HERE"
    query="javascript"
    pageNumber={0}
  />
).then(resource => {
  console.log(isResource(output)); // true
  console.log(resource.contentType); // "x-webmiddle-virtual"
  console.log(resource.content); // { type, attributes, children }
});
```

## How it works

The following values can be specified as child in the virtual schema, as
they will be **processed** in the same way of CheerioToVirtual:

-   Any element that can be **evaluated** by means of the evaluate
    function.

-   **virtual**

-   **array**

-   **object**

-   **undefined**

-   **(default): any other value is kept as is.**

<br />

**Helper functions:**

-   **elGet(selector, values):** if selector is set, then it starts by
    querying the collection of elements with such selector. The values
    property is used in case the selector contains placeholders (see the
    [JSONSelect documentation](https://github.com/lloyd/JSONSelect/blob/master/JSONSelect.md)).<br />
    Returns the first element of the (obtained) collection.

-   **elJoin(separator)**: plain Array join.

-   **elMap(callback):** plain Array map, however the function is called
    with a collection (i.e. an array) containing the single current
    element.

-   **elPipe(tasks):** plain Array reduce on the given tasks, where the
    initial value is the collection of elements.

## Properties

Name                       | Description
---------------------------|------------------------------------------------------
name                       | The name of the returned resource.
from                       | The JSON resource to convert.
fullConversion (optional)  | Set this to true to do a 1:1 conversion, without having to specify a schema.
children (optional)        | The conversion schema.
