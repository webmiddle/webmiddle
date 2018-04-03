# webmiddle-service-resume

> A service that makes its children **resumable** by caching the result.

## Install

```bash
npm install --save webmiddle-service-resume
```

## Usage

```jsx
import webmiddle, { PropTypes, evaluate, createContext } from 'webmiddle';
import Resume from 'webmiddle-service-resume';

const MyService = () => (
  <Resume savePath="./cache/resource1">
    <SubService
      name="resource1"
    />
  </Resume>
);

evaluate(createContext(), <MyService />)
.then(resource => {
  console.log(resource.name); // "resource1"
});
```

## How it works

The children are internally wrapped with a **Pipe** service and
executed. The resulting resource is then saved to the **filesystem**.

On subsequent executions, the service checks if the result is already
stored in the filesystem, and if so it just returns such result.

Since the result is stored in the filesystem, it will last even among
different executions of the application. This makes possible to resume
work in case the application terminated abruptly and in other similar
scenarios.

The save path is specified via the **savePath** attribute, which is
relative to the **outputBasePath** context option.

## Properties

Name                   | Description
-----------------------|------------------------------------------------------
savePath               | The filesystem path where the result should be saved.
children               | The list of steps to make resumable. It is wrapped into a Pipe, so effectively only the last returned resource will be cached.
