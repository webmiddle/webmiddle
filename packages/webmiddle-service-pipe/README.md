# webmiddle-service-pipe 

> Executes a sequence of services, piping their results (resources) to the subsequent services in the chain.

## Install

```bash
npm install --save webmiddle-service-pipe
```

## Usage


```jsx
import WebMiddle, { PropTypes, evaluate, createContext } from 'webmiddle';
import Pipe from 'webmiddle-service-pipe';

const MyService = () => (
  <Pipe>
    <SubService1
      name="resource1"
    />

    {({ resource1 }) =>
      <SubService2
        name="resource2"
        {/*...*/}
      />
    }

    {({ resource1, resource2 }) =>
      <SubService3
        name="resource3"
        {/*...*/}
      />
    }
  </Pipe>
);

const webmiddle = new WebMiddle();
evaluate(createContext(webmiddle), <MyService />)
.then(resource => {
  console.log(resource.name); // "output3"
});
```

## How it works

The services to execute are specified via **children**. In case a
function is specified, then such function is called with an object
containing all the resources retrieved up to that point. The resources
object can be seen as a map  
`<resource name, resource>`.

Every child service is supposed to return a **resource**, this is
ensured internally by setting the **expectResource** option to true.

The service resolves with the resource returned by the last child.

## Properties

Name                   | Description
-----------------------|------------------------------------------------------
children               | The tasks to execute.
