# webmiddle-service-cheerio-to-virtual 

> Service that converts a resource, whose content is parsed by the
[Cheerio](https://github.com/cheeriojs/cheerio) library (a NodeJS implementation of jQuery), to a resource
whose content is a virtual.

## Install

```bash
npm install --save webmiddle-service-cheerio-to-virtual 
```

## Usage

```jsx
import WebMiddle, { PropTypes } from 'webmiddle';
import Pipe from 'webmiddle-service-pipe';
import HttpRequest from 'webmiddle-service-http-request';
import CheerioToVirtual, { helpers } from 'webmiddle-service-cheerio-to-virtual';
const { elText, alAttr, elMap } = helpers;

const MyService = ({ query }) => (
  <Pipe>
    <HttpRequest
      name="rawHtml"
      contentType="text/html"
      url="https://news.ycombinator.com/"
    />

    {({ rawHtml }) =>
      <CheerioToVirtual name="result" from={rawHtml}>
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
      </CheerioToVirtual>
    }
  </Pipe>
);

const webmiddle = new WebMiddle();
webmiddle.evaluate(<MyService query="javascript" />)
.then(resource => {
  console.log(resource.contentType); // "application/x-webmiddle-virtual"
  console.log(resource.content); // { type, attributes, children }
});
```

## How it works

The cheerio library is able to parse both **HTML and XML documents**, so
effectively this service can be seen as a converter from HTML/XML to
virtual.

A **virtual** is just an object with the *type*, *attributes*
and *children* properties.<br />
Such an object can thus represent any tree or even any graph structure,
where nodes can be annotated with attributes.

A resource whose content is a virtual has the custom contentType
“**application/x-webmiddle-virtual**”.

The virtual is used as an **intermediate format**, similarly to an
intermediate language in a compiler; this separation allows other users
to develop converters that take the virtual resource as a target, and
then to compose the two types of converters.

<hr />
**Example:**

Suppose we have the following converters:

-   HTML/XML to virtual

-   JSON to virtual

Other users develop independently the following converters:

-   virtual to JSON

-   virtual to HTML/XML

Now, by just **piping** the converter that produces a virtual to the one
that takes the virtual as input, we end up having the following
converters:

-   HTML/XML to JSON

-   HTML/XML to HTML/XML

-   JSON to JSON

-   JSON to HTML/XML

<hr />

Every converter that produces a virtual, such as this one, also allow to
specify the **schema** that the result should have. In the other end,
the converters that take the virtual as input just execute a **full
conversion**, without modifying the schema.

The schema is defined by selecting parts of the source document, by
means of the library used to parse it, i.e. Cheerio in this case. Such
parts are then mapped to the target document elements as specified in
the schema.

The schema is really just another JSX/virtual document.

<hr />
**Example**:

Suppose we have the following fragment of a schema:

```jsx
<article el="article">
 { /* ... */ }
</article>
```

With `el="article"` we are telling to the Cheerio library to return
the collection of source elements that pass the “article” selector, i.e.
it will select all the HTML elements having the “article” tagName.

We are then creating an **“article”** element in our target document,
which is conceptually associated to the cheerio collection we just
obtained.

Since our target document is a virtual, the **created element** is the
following:

```javascript
{ type: 'article', attributes: [], children: [/* … */] }
```

We then proceed by **recursively** evaluating the children of the schema
article element.

Every query selector specified in such children is restricted to the
portion(s) of the HTML document selected by the parent.
<hr />

Is important to note that when we use a selector, we are always getting
as output a **collection of elements**, even if only one element is
found. This is how jQuery and other selector libraries work, it is just
a more general approach.

This applies to all the “to virtual” converters.

The service also provides helper functions that can be used to extract
data from the selected collection, e.g. the value of an attribute, the
text content and so on.

Most of these helper functions are executed on the first element of the
collection, but there are others that are executed on every element.

<hr />

Every **schema element** can have the following **properties**:

-   **el.** Can be specified as:

    -   Cheerio selector.

    -   Cheerio collection.<br />
        Defaults to the parent collection.

-   **condition**. A filter function that is called with every element
    of the current Cheerio collection, must return true to include the
    element, false to exclude it.

<br />
Every child of a schema element is **processed** by executing the
following steps::

1)  As first thing, it is **evaluated** by means of the webmiddle
    evaluate function. The “functionParameters” option is set to
    \[sourceEl, source\], where sourceEl is the current Cheerio
    collection, while source is the whole source document, as parsed by
    Cheerio.

<br />
2)  If the result is a **virtual** (i.e. a part of the schema), then its
    “el” and “condition” properties are used to select a new Cheerio
    collection, moreover a new element with the same type of the virtual
    is created in the target document. The virtual children are then
    processed recursively.

<br />
3)  If the result is a **DOM node**, then we check if such node is
    either a DOM element or another type, like a text node.<br />
    In the former case, a new element with the same type of the DOM
    element is created in the target document, moreover the DOM element
    children are processed recursively.<br />
    In the latter case, the result is just the content of the DOM node,
    i.e. its text content in case of a text node.

<br />
4)  If the result is an **Array**, then the array is mapped by
    processing recursively every item. The result is thus a new array
    where each item is the result of evaluating the original item.

<br />
5)  If the result is a **Cheerio collection**, then the collection is
    just converted into a regular array and then the array is processed.

<br />
6)  If the result is a **plain object**, then the object is mapped into
    an array of virtuals, where each virtual has the respective object
    property as a type, no attribute and a single child with the result
    of processing the respective object value.

```javascript
// converted into an array of virtuals
async function processObject(obj, sourceEl, source, webmiddle) {
  const result = [];

  for (const prop of Object.keys(obj)) {
    const resultItem = await process(
      obj[prop], sourceEl, source, webmiddle
    );
    result.push({
      type: prop,
      attributes: {},
      children: [resultItem],
    });
  }

  return result;
}
```

<br />
7)  If the result is **undefined**, then it is converted to **null**.
    This is because properties having undefined as values are stripped
    when creating JSON documents, and the virtual document is really
    just a subset of JSON.

<br />
8)  As **default**, the result is kept as is.

<br />
<hr />
The following **helper functions** are provided. Note that every helper
function always return a function that, given a Cheerio collection and
the Cheerio parser (\$), does something on that collection and then
returns the result.

-   **eAttr(attrName)**: returns the value of the attrName attribute of
    the first element in the collection.

-   **elText()**: returns the text of the first element of the
    collection. If the element is a form input / textarea, then its
    value is returned instead.

-   **elJoin(separator)**: returns a string obtained by concatenating
    all the collection elements with the specified separator. This is
    useful because a Cheerio collection can also contain plain
    JavaScript types such as strings.

-   **elMap(callback)**: a map implementation for Cheerio collections.
    The callback is called with the current element wrapped into a new
    collection.

-   **elPipe(tasks)**: given an array of functions that take the current
    Cheerio element and the Cheerio parser as arguments, calls every
    function in order, piping its result to the next one. Returns the
    result of the last function.

## Properties


Name                       | Description
---------------------------|------------------------------------------------------
name                       | The name of the returned resource.
from                       | The HTML/XML resource to convert.
fullConversion (optional)  | Set this to true to do a 1:1 conversion, without having to specify a schema.
