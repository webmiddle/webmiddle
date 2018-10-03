# webmiddle-component-arraymap

> Maps an array into an array of resources by executing a callback on each
item.

## Install

```bash
npm install --save webmiddle-component-arraymap
```

## Usage

```jsx
import { PropTypes, rootContext, isResource } from 'webmiddle';
import ArrayMap from 'webmiddle-component-arraymap';

const MyComponent = () => (
  <ArrayMap
    name="myResources"
    array={[1, 2, 3]}
    callback={num =>
      <SubComponent
        name={"resource" + num}
        {/*...*/}
      />
    }
  />
);

rootContext.evaluate(<MyComponent />)
.then(resource => {
  console.log(isResource(resource)); // true
  console.log(resource.name); // "myResources" 
  console.log(resource.contentType); // "x-webmiddle-type"
  console.log(resource.content); // [resource1, resource2, resource3]
});
```

## How it works

In terms of implementation it is similar to the **Parallel** component,
meaning that the items are mapped concurrently.

The component resolves with a JSON resource whose content is the obtained
array.

## Properties

Name                   | Description
-----------------------|------------------------------------------------------
name                   | The name of the returned resource.
limit (optional)       | An integer for setting the maximum concurrency.
array                  | The array that needs to be mapped.
callback               | The function to call for each item; it is called with the current array item and its index, and it is expected to return a resource.
