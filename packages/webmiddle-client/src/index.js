import webmiddle, { evaluate, createContext, isResource } from "webmiddle";
import superagent from "superagent";
import WebSocket from "ws";
import uuid from "uuid";

function appendPathToUrl(url, path) {
  return (
    (url.endsWith("/") ? url.slice(0, -1) : url) +
    (path.startsWith("/") ? path : "/" + path)
  );
}

export default class Client {
  constructor(options = {}) {
    const protocol = options.protocol || "ws";
    const hostname = options.hostname || "locahost";
    const port = options.port || 3000;

    this.serverUrl = `${protocol}://${hostname}:${port}`;
    this.requestServer = protocol.startsWith("ws")
      ? this.requestWebsocket
      : this.requestExpress;

    this.services = {};
  }

  async requestExpress(path, body = {}) {
    return new Promise((resolve, reject) => {
      superagent
        .post(appendPathToUrl(this.serverUrl, path))
        .send(body)
        .end((err, res) => {
          if (err) reject(err);
          else resolve(res.body);
        });
    });
  }

  getWebsocketConnection() {
    if (!this.wsPromise) {
      this.wsPromise = new Promise((resolve, reject) => {
        try {
          const ws = new WebSocket(this.serverUrl);
          ws.on("open", () => resolve(ws));
          ws.on("error", reject);
        } catch (err) {
          reject(err);
        }
      });
    }
    return this.wsPromise;
  }

  requestWebsocket(path, body = {}) {
    return this.getWebsocketConnection().then(ws => {
      return new Promise((resolve, reject) => {
        try {
          const requestId = uuid.v4();

          ws.on("message", rawMessage => {
            //console.log('received from server: %s', rawMessage);
            const message = JSON.parse(rawMessage);
            if (message.type !== "response" || message.requestId !== requestId)
              return;

            if (message.status === "success") {
              resolve(message.body);
            } else if (message.status === "error") {
              reject(message.body);
            }
          });

          ws.send(JSON.stringify({ type: "request", requestId, path, body }));
        } catch (err) {
          console.error(err instanceof Error ? err.stack : err);
          reject(err instanceof Error ? err.stack : err);
        }
      });
    });
  }

  async requestServicePaths() {
    if (!this.requestServicePathsPromise) {
      this.requestServicePathsPromise = Promise.resolve().then(async () => {
        const jsonResource = await this.requestServer("/services/");
        return jsonResource.content;
      });
    }
    return this.requestServicePathsPromise;
  }

  service(path) {
    if (!this.services[path]) {
      const httpPath = path;
      const Service = (props, context) =>
        this.requestServer(`/services/${httpPath}`, {
          props,
          options: context.options
        });
      this.services[path] = Service;
    }
    return this.services[path];
  }
}
