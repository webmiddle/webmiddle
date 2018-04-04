# webmiddle-service-parallel 

> Its purpose is similar to Pipe, i.e. the execution of services, but they are executed concurrently.

## Install

```bash
npm install --save webmiddle-service-parallel
```

## Usage

```jsx
import { PropTypes, rootContext } from 'webmiddle';
import Parallel from 'webmiddle-service-parallel';

const MyService = () => (
  <Parallel name="myResources">
    <SubService1
      name="resource1"
    />

    <SubService2
      name="resource2"
      {/*...*/}
    />

    <SubService3
      name="resource3"
      {/*...*/}
    />
  </Parallel>
);

rootContext.evaluate(<MyService />)
.then(resource => {
  console.log(resource.name); // "myResources" 
  console.log(resource.contentType); // "application/json"
  console.log(resource.content); // { resource1, resource2, resource3 }
});
```

## How it works

If every child is fully synchronous, then its behavior is the
same of Pipe.<br />
In the other end, if the child returns a promise, then such promise will
be added to a pool and the next child will be executed immediately.

The service resolves with a JSON resource whose content is an object
`<resource name, resource>`, where the resource names are extracted
directly from the resources returned by the children.

If any of the child fails, then the whole Parallel fails with the error
returned by the failed child.

This service also supports a **limit** property that can be used to
limit the maximum number of concurrent tasks that should be running at
any given time. If limit is 1, then the children will be executed in
order, one after another, similarly to the Pipe service.

## Properties

Name                   | Description
-----------------------|------------------------------------------------------
name                   | The name of the returned resource.
limit (optional)       | An integer for setting the maximum concurrency.
children               | The tasks to execute.
