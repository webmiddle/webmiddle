import { rootContext, isResource } from "webmiddle";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import WebSocket from "ws";
import uuid from "uuid";
import mapValues from "lodash/mapValues";
import EventEmitter from "events";

import { serializeCallNode, loadMore } from "./utils/serialize";

function httpToServicePath(path) {
  if (path.startsWith("/")) path = path.slice(1);
  return path;
}

export default class Server {
  constructor(serviceRoutes, options = {}) {
    this.serviceRoutes = serviceRoutes;
    this.contextOptions = options.contextOptions || {};

    this.PORT = options.port || 3000;
    this.API_KEY = options.apiKey || "";

    this.expressServer = express();
    this.websocketServer = null;
    this.notificationEmitter = new EventEmitter();

    this.evaluations = {}; // <evaluation id, evaluation>

    this.handlersByType = {
      services: this._handleService.bind(this),
      more: this._handleMore.bind(this),
      evaluations: this._handleEvaluations.bind(this)
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
              const authorization = req.get("Authorization");
              if (authorization !== this.API_KEY) {
                throw new Error("Invalid server API KEY");
              }

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
          const authorization = message.authorization || "";
          if (authorization !== this.API_KEY) {
            throw new Error("Invalid server API KEY");
          }

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
                    node: serializeCallNode(message.data && message.data.node)
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

      ws.on("close", () => {
        delete clients[ws.id];
      });

      //ws.send("something from server");
    });

    this.notificationEmitter.on("message", message => {
      Object.keys(clients).forEach(clientId => {
        const client = clients[clientId];
        client.send(
          JSON.stringify({
            type: "notification",
            body: message
          })
        );
      });
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

  async _handleService(path, props, options, handleProgress) {
    if (!path) {
      return rootContext.createResource(
        "services",
        "application/json",
        this._getAllServicePaths()
      );
    }

    const Service = this.serviceRoutes[path];
    if (!Service) throw new Error("Service not found at path: " + path);

    const evaluation = this._createEvaluation(path, props, options);

    const context = rootContext.extend({
      ...this.contextOptions,
      ...options
    });

    // progress
    const handleContextMessage = message => {
      evaluation.progressQueue.push(message);
      evaluation.progressEmitter.emit("message", message);
    };
    context.emitter.on("message", handleContextMessage);
    if (handleProgress)
      evaluation.progressEmitter.on("message", handleProgress);

    const onFinally = () => {
      evaluation.progressEmitter.removeAllListeners();
      context.emitter.removeListener("message", handleContextMessage);
      this._notifyEvaluationChange(evaluation, "update");
    };

    evaluation.promise = context
      .evaluate(<Service {...props} />)
      .then(output => {
        // success
        const result = isResource(output)
          ? output
          : this._wrapInResource(output);
        evaluation.status = "success";
        onFinally();
        return result;
      })
      .catch(err => {
        // failure
        evaluation.status = "error";
        onFinally();
        throw err;
      });
    return evaluation.promise;
  }

  _getAllServicePaths() {
    return mapValues(this.serviceRoutes, Service => ({
      name: Service.name || null,
      description: Service.description || null
    }));
  }

  async _handleMore(path, props) {
    return loadMore(props.path, props.serializedPath, rootContext);
  }

  _createEvaluation(path, props, options) {
    const evaluation = {
      id: uuid.v4(),
      created_timestamp: Date.now(), // used for sorting
      path,
      props,
      options,
      status: "progress",
      progressQueue: [],
      progressEmitter: new EventEmitter()
    };
    this.evaluations[evaluation.id] = evaluation;
    this._notifyEvaluationChange(evaluation, "add");
    return evaluation;
  }

  async _handleEvaluations(path, props, options, handleProgress) {
    if (!path) {
      return rootContext.createResource(
        "evaluations",
        "application/json",
        this._getAllEvaluations()
      );
    }

    const evaluationId = path;
    const evaluation = this.evaluations[evaluationId];
    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    const { command } = props;
    if (command === "reattach") {
      if (handleProgress) {
        evaluation.progressQueue.forEach(message => handleProgress(message));
        if (evaluation.status === "progress") {
          evaluation.progressEmitter.on("message", handleProgress);
        }
      }
      return evaluation.promise;
    }
    if (command === "remove") {
      if (evaluation.status === "progress") {
        throw new Error("Can't remove an evaluation that is still running.");
      }
      delete this.evaluations[evaluationId];
      this._notifyEvaluationChange(evaluation, "remove");
      return true;
    }
    throw new Error("Invalid command");
  }

  _getAllEvaluations() {
    return mapValues(this.evaluations, evaluation =>
      this._serializeEvaluation(evaluation)
    );
  }

  _notifyEvaluationChange(evaluation, changeType) {
    this.notificationEmitter.emit("message", {
      topic: `evaluation:${changeType}`,
      data: {
        evaluation: this._serializeEvaluation(evaluation)
      }
    });
  }

  _serializeEvaluation(evaluation) {
    return {
      id: evaluation.id,
      created_timestamp: evaluation.created_timestamp,
      path: evaluation.path,
      props: evaluation.props,
      options: evaluation.options,
      status: evaluation.status
    };
  }
}
