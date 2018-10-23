import superagent from "superagent";
import WebSocket from "ws";
import uuid from "uuid";
import { rootContext } from "webmiddle";

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

    this.apiKey = options.apiKey || "";

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
        .set("Authorization", this.apiKey)
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
              reject(new Error(message.body));
            }
          });

          ws.send(
            JSON.stringify({
              type: "request",
              requestId,
              authorization: this.apiKey,
              path,
              body
            })
          );
        } catch (err) {
          console.error(err instanceof Error ? err.stack : err);
          reject(err);
        }
      });
    });
  }

  async requestServicePaths() {
    if (!this.requestServicePathsPromise) {
      this.requestServicePathsPromise = Promise.resolve().then(async () => {
        const responseBody = await this.requestServer("/services/");
        const resource = rootContext.parseResource(responseBody);
        return resource.content;
      });
    }
    return this.requestServicePathsPromise;
  }

  service(path) {
    if (!this.services[path]) {
      const httpPath = path;
      const Service = async (props, context) => {
        const responseBody = await this.requestServer(`/services/${httpPath}`, {
          props,
          options: context.options
        });
        return context.parseResource(responseBody);
      };
      this.services[path] = Service;
    }
    return this.services[path];
  }
}
