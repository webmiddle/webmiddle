# webmiddle-service-arraymap

> Maps an array into an array of resources by executing a callback on each
item.

## Install

```bash
npm install --save webmiddle-service-arraymap
```

## Usage

```jsx
import WebMiddle, { PropTypes } from 'webmiddle';
import ArrayMap from 'webmiddle-service-arraymap';

const MyService = () => (
  <ArrayMap
    name="myResources"
    array={[1, 2, 3]}
    callback={num =>
      <SubService
        name={"resource" + num}
        {/*...*/}
      />
    }
  />
);

const webmiddle = new WebMiddle();
webmiddle.evaluate(<MyService />)
.then(resource => {
  console.log(resource.name); // "myResources" 
  console.log(resource.contentType); // "application/json"
  console.log(resource.content); // [resource1, resource2, resource3]
});
```

## How it works

In terms of implementation it is similar to the **Parallel** service,
meaning that the items are mapped concurrently.

The service resolves with a JSON resource whose content is the obtained
array.

## Properties

Name                   | Description
-----------------------|------------------------------------------------------
name                   | The name of the returned resource.
limit (optional)       | An integer for setting the maximum concurrency.
array                  | The array that needs to be mapped.
callback               | The function to call for each item; it is called with the current array item and its index, and it is expected to return a resource.
