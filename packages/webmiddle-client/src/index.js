import WebMiddle, { evaluate, createContext, isResource } from 'webmiddle';
import superagent from 'superagent';

async function requestServer(url, data = {}) {
  return new Promise((resolve, reject) => {
    superagent
      .post(url)
      .send(data)
      .end((err, res) => {
        if (err) reject(err);
        resolve(res.body);
      });
  });
}

async function requestServicePaths(serverUrl) {
  const servicePathsUrl = serverUrl + (serverUrl.endsWith('/') ? '' : '/') + 'services/';
  const jsonResource = await requestServer(servicePathsUrl);
  return jsonResource.content;
}

async function requestSettingPaths(serverUrl) {
  const settingPathsUrl = serverUrl + (serverUrl.endsWith('/') ? '' : '/') + 'settings/';
  const jsonResource = await requestServer(settingPathsUrl);
  return jsonResource.content;
}

async function createServices(serverUrl) {
  const servicePaths = await requestServicePaths(serverUrl);
  const services = {};
  servicePaths.forEach(path => {
    const serviceUrl = serverUrl +
      (serverUrl.endsWith('/') ? '' : '/') + 'services/' +
      path.replace(/\\./g, '/');

    const service = (props, context) => requestServer(serviceUrl, {
      props,
      options: context.options,
    });
    services[path] = service;
  });
  return services;
}

async function createSettings(serverUrl) {
  // TODO
}

export default async function webmiddleClient(serverUrl) {
  return new WebMiddle({
    services: await createServices(serverUrl),
    settings: await createSettings(serverUrl),
  });
}
