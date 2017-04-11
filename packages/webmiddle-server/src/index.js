import WebMiddle, { evaluate, createContext, isResource } from 'webmiddle'; // needed for JSX
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import _ from 'lodash';

function paths(obj, parentKey) {
  if (typeof obj !== 'object' || obj === null) return [parentKey];
  return _.flatten(Object.keys(obj).map(key =>
    paths(obj[key], key).map(subPath =>
      (parentKey ? `${parentKey}.` : '') + subPath
    )
  ));
}

export default class Server {
  constructor(webmiddle, options = {}) {
    this.webmiddle = webmiddle;

    this.PORT = options.port || 3000;
    this.expressServer = express();

    this.handlersByType = {
      services: this.handleService,
      settings: this.handleSetting,
    };
  }

  start() {
    this.expressServer.use(cors());
    this.expressServer.use(bodyParser.json({ limit: '50mb' }));
    this.expressServer.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

    this.expressServer.listen(this.PORT, () => {
      console.log(`WebMiddle server listening on port ${this.PORT}!`);
    });

    ['services', 'settings'].forEach(type => this._bind(type));
  }

  // param type can be either "services" or "settings"
  _bind(type) {
    ['GET', 'POST'].forEach(httpMethod => {
      const expressMethod = this.expressServer[httpMethod.toLowerCase()];
      expressMethod.call(this.expressServer, `/${type}/*`, async (req, res) => {
        try {
          let path = req.url.split('?')[0].slice(('/' + type).length);
          if (path.startsWith('/')) path = path.slice(1);
          path = path.replace(/\//g, '.');

          let props;
          let options;
          if (httpMethod === 'GET') {
            props = req.query || {};
            options = {};
          } else {
            props = req.body.props || {};
            options = req.body.options || {};
          }

          const output = await this.handlersByType[type].call(this, path, props, options);
          if (isResource(output)) res.json(output);
          else res.send(output);
        } catch (err) {
          console.error(err instanceof Error ? err.stack : err);
          res.sendStatus(500).send(err instanceof Error ? err.stack : err);
        }
      });
    });
  }

  async handleService(path, props, options) {
    if (!path) {
      return {
        name: 'services',
        contentType: 'application/json',
        content: this._getAllServicePaths(),
      };
    }

    const Service = this.webmiddle.service(path);
    if (!Service) throw new Error('Service not found');
    return evaluate(createContext(this.webmiddle, options), <Service {...props} />);
  }

  async handleSetting(path) {
    if (!path) {
      return {
        name: 'settings',
        contentType: 'application/json',
        content: this._getAllSettingPaths(),
      };
    }

    return this.webmiddle.setting(path);
  }

  // return all the service paths (including those of the parents)
  _getAllServicePaths() {
    let services = {};
    let current = this.webmiddle;
    while (current) {
      services = _.merge({}, current.services, services);
      current = current.parent;
    }
    return paths(services);
  }

  // return all the setting paths (including those of the parents)
  _getAllSettingPaths() {
    let settings = {};
    let current = this.webmiddle;
    while (current) {
      settings = _.merge({}, current.settings, settings);
      current = current.parent;
    }
    return paths(settings);
  }
}
