import { isVirtual } from "./virtual";

class Resource {
  constructor(data) {
    Object.assign(this, data);
  }

  stringifyContent() {
    return this.content;
  }

  static parseContent(stringifiedContent) {
    return stringifiedContent;
  }
}

class JsonResource extends Resource {
  stringifyContent() {
    return JSON.stringify(this.content);
  }

  static parseContent(stringifiedContent) {
    return JSON.parse(stringifiedContent);
  }
}

class WebmiddleTypeResource extends JsonResource {
  stringifyContent() {
    const handle = data => {
      if (Array.isArray(data)) {
        return data.map(handle);
      }
      if (typeof data === "object" && data !== null) {
        // convert data to { type, value } format

        const value = data;
        const newValue = {};
        Object.keys(value).forEach(key => {
          newValue[key] = handle(value[key]);
        });

        if (isResource(data)) {
          return {
            type: "resource",
            value: newValue
          };
        }
        if (isVirtual(data)) {
          return {
            type: "virtual",
            value: newValue
          };
        }
        return {
          type: "object",
          value: newValue
        };
      }
      return data;
    };
    const serializableContent = handle(this.content);
    return JSON.stringify(serializableContent);
  }

  static parseContent(stringifiedContent, context) {
    const handle = data => {
      if (Array.isArray(data)) {
        return data.map(handle);
      }
      if (typeof data === "object" && data !== null) {
        // data has { type, value } format

        const { value } = data;
        const originalValue = {};
        Object.keys(value).forEach(key => {
          originalValue[key] = handle(value[key]);
        });

        if (data.type === "resource") {
          return context.createResource(
            originalValue.name,
            originalValue.contentType,
            originalValue.content
          );
        }
        if (data.type === "virtual") {
          return context.createVirtual(
            originalValue.type,
            originalValue.attributes,
            originalValue.children
          );
        }
        return originalValue;
      }
      return data;
    };
    const serializableContent = JSON.parse(stringifiedContent);
    const content = handle(serializableContent);
    return content;
  }
}

const resourceHandlers = {
  "application/json": JsonResource,
  "x-webmiddle-type": WebmiddleTypeResource
};

export function createResource(context, name, contentType, content) {
  const id = String(context.rootContext.resources.length);
  const ResourceClass = resourceHandlers[contentType] || Resource;
  const resource = new ResourceClass({
    id,
    name,
    contentType,
    content
  });
  context.rootContext.resources.push(resource);
  return resource;
}

export function stringifyResource(context, resource) {
  return JSON.stringify({
    id: resource.id,
    name: resource.name,
    contentType: resource.contentType,
    content: resource.stringifyContent()
  });
}

export function parseResource(context, dataStr) {
  const data = JSON.parse(dataStr);
  const ResourceClass = resourceHandlers[data.contentType] || Resource;
  data.content = ResourceClass.parseContent(data.content, context);
  return context.createResource(data.name, data.contentType, data.content);
}

export function isResource(target) {
  return target instanceof Resource;
}
