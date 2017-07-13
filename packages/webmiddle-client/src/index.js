import WebMiddle, { evaluate, createContext, isResource } from "webmiddle";
import superagent from "superagent";
import _ from "lodash";
import WebSocket from "ws";
import uuid from "uuid";

function appendPathToUrl(url, path) {
  return (
    (url.endsWith("/") ? url.slice(0, -1) : url) +
    (path.startsWith("/") ? path : "/" + path)
  );
}

export default async function webmiddleClient(options = {}) {
  const protocol = options.protocol || "ws";
  const hostname = options.hostname || "locahost";
  const port = options.port || 3000;

  const serverUrl = `${protocol}://${hostname}:${port}`;
  const requestServer = protocol.startsWith("ws")
    ? requestWebsocket
    : requestExpress;

  async function requestExpress(path, body = {}) {
    return new Promise((resolve, reject) => {
      superagent
        .post(appendPathToUrl(serverUrl, path))
        .send(body)
        .end((err, res) => {
          if (err) reject(err);
          else resolve(res.body);
        });
    });
  }

  let wsPromise;
  function getWebsocketConnection() {
    if (!wsPromise) {
      wsPromise = new Promise((resolve, reject) => {
        try {
          const ws = new WebSocket(serverUrl);
          ws.on("open", () => resolve(ws));
          ws.on("error", reject);
        } catch (err) {
          reject(err);
        }
      });
    }
    return wsPromise;
  }

  function requestWebsocket(path, body = {}) {
    return getWebsocketConnection().then(ws => {
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

  async function requestServicePaths() {
    const jsonResource = await requestServer("/services/");
    return jsonResource.content;
  }

  async function requestSettingPaths() {
    const jsonResource = await requestServer("/settings/");
    return jsonResource.content;
  }

  async function createServices() {
    const servicePaths = await requestServicePaths();
    const services = {};
    servicePaths.forEach(path => {
      const httpPath = path.replace(/\\./g, "/");

      const service = (props, context) =>
        requestServer(`/services/${httpPath}`, {
          props,
          options: context.options
        });
      _.set(services, path, service);
    });
    return services;
  }

  async function createSettings() {
    // TODO
  }

  return new WebMiddle({
    services: await createServices(),
    settings: await createSettings()
  });
}
