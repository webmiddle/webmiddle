import { rootContext, isResource } from "webmiddle";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import _ from "lodash";
import WebSocket from "ws";
import uuid from "uuid";
import mapValues from "lodash/mapValues";

import { serializeCallStateInfo, loadMore } from "./utils/serialize";

function httpToServicePath(path) {
  if (path.startsWith("/")) path = path.slice(1);
  return path;
}

export default class Server {
  constructor(serviceRoutes, options = {}) {
    this.serviceRoutes = serviceRoutes;
    this.contextOptions = options.contextOptions || {};

    this.PORT = options.port || 3000;
    this.expressServer = express();
    this.websocketServer = null;

    this.handlersByType = {
      services: this._handleService.bind(this),
      more: this._handleMore.bind(this)
    };
  }

  start() {
    this.expressServer.use(cors());
    this.expressServer.use(bodyParser.json({ limit: "50mb" }));
    this.expressServer.use(
      bodyParser.urlencoded({ extended: true, limit: "50mb" })
    );

    const httpServer = this.expressServer.listen(this.PORT, () => {
      console.log(`webmiddle server listening on port ${this.PORT}!`);
    });

    this.websocketServer = new WebSocket.Server({ server: httpServer });

    this._bindExpress();
    this._bindWebsocket();
  }

  stringifyOutput(output) {
    if (isResource(output)) {
      return rootContext.stringifyResource(output);
    }
    return JSON.stringify(output);
  }

  _bindExpress() {
    Object.keys(this.handlersByType).forEach(type => {
      ["GET", "POST"].forEach(httpMethod => {
        const expressMethod = this.expressServer[httpMethod.toLowerCase()];
        expressMethod.call(
          this.expressServer,
          `/${type}/*`,
          async (req, res) => {
            try {
              const httpPath = req.url.split("?")[0].slice(("/" + type).length);
              const path = httpToServicePath(httpPath);

              let props;
              let options;
              if (httpMethod === "GET") {
                props = req.query || {};
                options = {};
              } else {
                props = req.body.props || {};
                options = req.body.options || {};
              }

              const output = await this.handlersByType[type].call(
                this,
                path,
                props,
                options
              );
              const jsonOutput = this.stringifyOutput(output);
              res.json(jsonOutput);
            } catch (err) {
              console.error(err instanceof Error ? err.stack : err);
              res.status(500).send(err instanceof Error ? err.stack : err);
            }
          }
        );
      });
    });
  }

  _bindWebsocket() {
    const clients = {};

    this.websocketServer.on("connection", ws => {
      ws.id = uuid.v4();
      clients[ws.id] = ws;

      ws.on("message", async rawMessage => {
        //console.log('received from client: %s', rawMessage);
        const message = JSON.parse(rawMessage);
        if (typeof message !== "object" || message === null) return;
        if (
          message.type !== "request" ||
          !message.requestId ||
          !message.path ||
          !message.body
        )
          return;
        const requestId = message.requestId;

        try {
          // message.path. e.g. "/service/math/foo" or just "/service"
          const messagePathParts = message.path.split("/");
          const type = messagePathParts[1];
          const httpPath = messagePathParts.slice(2).join("/"); // e.g. "math/foo" or just ""
          const path = httpToServicePath(httpPath);

          const props = message.body.props || {};
          const options = message.body.options || {};

          const output = await this.handlersByType[type].call(
            this,
            path,
            props,
            options,
            message => {
              ws.send(
                JSON.stringify({
                  type: "progress",
                  status: message.topic,
                  requestId,
                  body: {
                    ...message.data,
                    info: serializeCallStateInfo(
                      message.data && message.data.info
                    )
                  }
                })
              );
            }
          );

          const jsonOutput = this.stringifyOutput(output);
          ws.send(
            JSON.stringify({
              type: "response",
              status: "success",
              requestId,
              body: jsonOutput
            })
          );
        } catch (err) {
          console.error(err instanceof Error ? err.stack : err);
          ws.send(
            JSON.stringify({
              type: "response",
              status: "error",
              requestId,
              body: err instanceof Error ? err.stack : err
            })
          );
        }
      });

      ws.send("something from server");
    });
  }

  // wrap the output into a resource anyway, since we always want to send json
  // (to handle things like numeric content and to simplify the client job)
  _wrapInResource(output) {
    return rootContext.createResource(
      "wrappedContent",
      "x-webmiddle-any",
      output
    );
  }

  async _handleService(path, props, options, onMessage) {
    if (!path) {
      return rootContext.createResource(
        "services",
        "application/json",
        this._getAllServicePaths()
      );
    }

    const Service = this.serviceRoutes[path];
    if (!Service) throw new Error("Service not found at path: " + path);

    const context = rootContext.extend({
      ...this.contextOptions,
      ...options
    });
    if (onMessage) context.emitter.on("message", onMessage);

    const output = await context.evaluate(<Service {...props} />);
    return isResource(output) ? output : this._wrapInResource(output);
  }

  async _handleMore(path, props) {
    return loadMore(props.path, props.serializedPath, rootContext);
  }

  // return all the service paths
  _getAllServicePaths() {
    return mapValues(this.serviceRoutes, Service => ({
      name: Service.name || null,
      description: Service.description || null
    }));
  }
}
