# webmiddle-client

> Creates a local replica of a remote webmiddle run by a webmiddle-server, allowing remote services execution.

## Install

```bash
npm install --save webmiddle-client
```

## Usage

Given a [webmiddle-server](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-server) running on port 3000 on localhost:

```javascript
import webmiddleClient from 'webmiddle-client';
import WebMiddle, { evaluate, createContext } from 'webmiddle';

webmiddleClient('http://localhost:3000/') // "localhost" since we are using the same machine in this example
.then(webmiddleRemote => {
  // you can now use webmiddleRemote just like a normal webmiddle
  // e.g. if the remote webmiddle has a Multiply service registered at path "math.multiply"
  // that returns a text resource
  const Multiply = webmiddleRemote.service('math.multiply');

  evaluate(createContext(webmiddleRemote, { retries: 2 }),
    <Multiply
      a={10}
      b={20}
    />
  ).then(result => {
    console.log(result); // { name: 'result', contentType: 'text/plain', content: '200' }
  });
})
.catch(err => {
  console.log(err && err.stack || err);
});
```

## How it works

Under the hood, it uses the `web-server` REST API to fetch the list of service paths.

For each path, it then creates a local version of the remote service, that, when evaluated, executes an HTTP request to the web-server,
asking it to execute the remote service at that path. The response is used as the service output.
