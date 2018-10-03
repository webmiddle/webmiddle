# webmiddle-component-pipe 

> Executes a sequence of components, piping their results (resources) to the subsequent components in the chain.

## Install

```bash
npm install --save webmiddle-component-pipe
```

## Usage


```jsx
import { PropTypes, rootContext } from 'webmiddle';
import Pipe from 'webmiddle-component-pipe';

const MyComponent = () => (
  <Pipe>
    <SubComponent1
      name="resource1"
    />

    {({ resource1 }) =>
      <SubComponent2
        name="resource2"
        {/*...*/}
      />
    }

    {({ resource1, resource2 }) =>
      <SubComponent3
        name="resource3"
        {/*...*/}
      />
    }
  </Pipe>
);

rootContext.evaluate(<MyComponent />)
.then(resource => {
  console.log(resource.name); // "output3"
});
```

## How it works

The components to execute are specified via **children**. In case a
function is specified, then such function is called with an object
containing all the resources retrieved up to that point. The resources
object can be seen as a map  
`<resource name, resource>`.

Every child component is supposed to return a **resource**, this is
ensured internally by setting the **expectResource** option to true.

The component resolves with the resource returned by the last child.

## Properties

Name                   | Description
-----------------------|------------------------------------------------------
children               | The tasks to execute.
