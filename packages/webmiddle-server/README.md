# webmiddle-server

> Easily turns webmiddles into REST APIs, allowing remote access via HTTP.

## Install

```bash
npm install --save webmiddle-server
```

## Usage

Given a `webmiddle` instance, turn it into a server listening on port 3000:

```jsx
import Server from 'webmiddle-server';

const server = new Server(webmiddle, { port: 3000 });
server.start();
```

## How it works

### Endpoints:

- `/services/`: lists all the service paths, including those of the webmiddle parents (if any).
- `/services/foo/bar`: executes the service at path `foo.bar`.

Endpoints can be called by using both GET and POST requests.

### GET requests:
- The query parameters are used as service props.
- There is no way to pass context options.

### POST requests:
- In this case you explicitly need to pass a JSON object in the request body, composed of the following properties:
  - `props`: the properties to pass to the service.
  - `options`: an optional object containing the context options to use.
