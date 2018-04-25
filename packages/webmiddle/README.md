[![npm version](https://badge.fury.io/js/webmiddle.svg)](https://badge.fury.io/js/webmiddle)

# webmiddle

This module should be installed in any webmiddle application, as it provides the machinery to parse JSX.

## Install

```bash
npm install --save webmiddle
```

## Exports

## rootContext

The base context that webmiddle applications can extend to create new context objects with the required options.

It can also be used directly to evaluate services if no context options are required.

```jsx
import { rootContext } from 'webmiddle';

const firstContext = rootContext.extend({ foo: "bar" });
const secondContext = rootContext.extend({ foo: "some"  });
const firstChildContext = firstContext.extend({ test: "more" });

console.log(rootContext.options); // {}
console.log(firstContext.options); // { foo: "bar" }
console.log(secondContext.options); // { foo: "some" }
console.log(firstChildContext.options); // { foo: "bar", test: "more" }

rootContext.evaluate(...);

firstChildContext.evaluate(...);
```

### isResource

A function that returns `true` if the given value is a `resource`.

Example:

```jsx
import { rootContext, isResource } from 'webmiddle';

const resource = rootContext.createResource("rawHtml", "text/html", "<html></html>");
console.log(isResource(resource)); // true

console.log(isResource("<html></html>")); // false
```

### rootContext.isVirtual

A function that returns `true` if the given value is a **JSX virtual element**

Example:

```jsx
import { rootContext } from 'webmiddle';

const Service = () => {};

console.log(rootContext.isVirtual(<Service />)); // true
console.log(rootContext.isVirtual(Service)); // false
```

## ErrorBoundary

A service used for error handling, evaluates its **only** child by wrapping it in a `try...catch` and allowing for retries and catch handling.

A negative `retries` number means unlimited retries.

Example:

```jsx
import { rootContext, ErrorBoundary } from 'webmiddle';

const FallbackService = (props, context) => context.createResource(
  "result",
  "text/plain",
  "fallback"
);

const ThrowService = () => throw new Error('expected fail');

const Service = () => (
  <ErrorBoundary
    retries={-1}
    isRetryable={{err => err.message !== 'expected fail'}}
    handleCatch={{err => <FallbackService />}}
  >
    <ThrowService />
  </ErrorBoundary>
);

rootContext.evaluate(
  <Service />
).then(resource => {
  console.log(resource.content); // "fallback"
});
```

### Properties

Name                   | Description
-----------------------|------------------------------------------------------
retries (optional)     | The number of retries, defaults to zero. Use a negative number for unlimited retries.
isRetryable (optional) | Function that given the error returns a boolean stating if a retry should be attempted. Defaults to a function that always return `true`.
handleCatch (optional) | Function called in case no further retries can be attempted. Gets the error as parameter and must return the value to use as fallback. If this property is not specified, then the error will be thrown instead.
children               | Array containing a single child that should be evaluated.

## WithOptions

A service that evaluates its **only** child by extending the current context with the new given options.

```jsx
import { rootContext, WithOptions } from 'webmiddle';

const ReturnOption = ({ optionName }, context) => context.createResource(
  "result",
  "text/plain",
  context.options[optionName],
);

const Service = () => (
  <WithOptions foo="bar">
    <ReturnOption optionName="foo" />
  </WithOptions>
);

rootContext.extend({
  foo: "some"
}).evaluate(
  <Service />
).then(resource => {
  console.log(resource.content); // "bar"
});
```

### Properties

Name                   | Description
-----------------------|------------------------------------------------------
children               | Array containing a single child that should be evaluated.
...options             | All the other passed properties are used as the new context options.

### PropTypes

Directly extracted from the [https://www.npmjs.com/package/proptypes](proptypes) package.

Example:

```jsx
import { PropTypes } from 'webmiddle';

const Multiply = ({ a, b }, context) => context.createResource(
  'result',
  'text/plain',
  String(a * b)
);

Multiply.propTypes = {
  a: PropTypes.number.isRequired,
  b: PropTypes.number.isRequired,
};
```
