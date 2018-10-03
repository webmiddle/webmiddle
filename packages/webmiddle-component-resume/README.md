# webmiddle-component-resume

> A component that makes its children **resumable** by caching the result.

## Install

```bash
npm install --save webmiddle-component-resume
```

## Usage

```jsx
import { PropTypes, rootContext } from 'webmiddle';
import Resume from 'webmiddle-component-resume';

const MyComponent = () => (
  <Resume savePath="./cache/resource1">
    <SubComponent
      name="resource1"
    />
  </Resume>
);

rootContext.evaluate(<MyComponent />)
.then(resource => {
  console.log(resource.name); // "resource1"
});
```

## How it works

The children are internally wrapped with a **Pipe** component and
executed. The resulting resource is then saved to the **filesystem**.

On subsequent executions, the component checks if the result is already
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
