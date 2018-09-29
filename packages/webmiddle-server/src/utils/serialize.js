import mapValues from "lodash/mapValues";
import { isResource, isVirtual } from "webmiddle";

import get from "lodash/get";

const DEFAULT_RECURSION = 1;

function joinPath(path = [], ...pathParts) {
  return path.concat(pathParts.map(part => String(part)));
}

function shouldLazyLoad(value, recursion) {
  return (
    recursion < 0 &&
    typeof value !== "number" &&
    (typeof value !== "string" || value.length > 100) &&
    (!Array.isArray(value) || value.length !== 0) &&
    !isResource(value) &&
    typeof value !== "boolean" &&
    typeof value !== "function" &&
    typeof value !== "undefined" &&
    value !== null
  );
}

function lazyLoad(value, path = [], serializedPath) {
  return {
    type: "more",
    path,
    serializedPath
  };
}

function serializeVirtual(
  virtual,
  recursion = DEFAULT_RECURSION,
  path = [],
  serializedPath = []
) {
  const serializedValue = {
    type: serializeValue(
      virtual.type,
      recursion - 1,
      joinPath(path, "type"),
      joinPath(serializedPath, "value", "type")
    ),
    attributes: mapValues(virtual.attributes, (
      attrValue,
      attrName // always include
    ) =>
      serializeValue(
        attrValue,
        recursion - 1,
        joinPath(path, "attributes", attrName),
        joinPath(serializedPath, "value", "attributes", attrName)
      )
    ),
    children: serializeValue(
      virtual.children,
      recursion - 1,
      joinPath(path, "children"),
      joinPath(serializedPath, "value", "children")
    )
  };

  return {
    type: "virtual",
    value: serializedValue
  };
}

function serializeResource(
  resource,
  recursion = DEFAULT_RECURSION,
  path = [],
  serializedPath = []
) {
  const stringifiedContent = resource.stringifyContent();

  const serializedValue = {
    id: resource.id,
    name: resource.name,
    contentType: resource.contentType,
    content: serializeValue(
      stringifiedContent,
      recursion - 1,
      joinPath(path, "stringifiedContent"), // make sure to lazy load the stringified version (it exists since we called stringifyContent())
      joinPath(serializedPath, "value", "content")
    )
  };

  return {
    type: "resource",
    value: serializedValue
  };
}

function serializeFunction(
  fn,
  recursion = DEFAULT_RECURSION,
  path = [],
  serializedPath = []
) {
  return {
    type: "function",
    value: undefined, // always omitted
    name: fn.name
  };
}

function serializeArray(
  array,
  recursion = DEFAULT_RECURSION,
  path = [],
  serializedPath = []
) {
  const serializedValue = shouldLazyLoad(array, recursion)
    ? lazyLoad(array, path)
    : array.map((v, i) =>
        serializeValue(
          v,
          recursion - 1,
          joinPath(path, i),
          joinPath(serializedPath, "value", i)
        )
      );

  return {
    type: "array",
    value: serializedValue,
    length: array.length
  };
}

function serializePlainObject(
  obj,
  recursion = DEFAULT_RECURSION,
  path = [],
  serializedPath = []
) {
  const serializedValue = shouldLazyLoad(obj, recursion)
    ? lazyLoad(obj, path)
    : mapValues(obj, (v, k) =>
        serializeValue(
          v,
          recursion - 1,
          joinPath(path, k),
          joinPath(serializedPath, "value", k)
        )
      );

  return {
    type: "object",
    value: serializedValue
  };
}

export function serializeValue(
  value,
  recursion = DEFAULT_RECURSION,
  path = [],
  serializedPath = []
) {
  if (shouldLazyLoad(value, recursion)) {
    return lazyLoad(value, path, serializedPath);
  }

  if (isVirtual(value))
    return serializeVirtual(value, recursion, path, serializedPath);
  if (isResource(value))
    return serializeResource(value, recursion, path, serializedPath);
  if (typeof value === "function")
    return serializeFunction(value, recursion, path, serializedPath);
  if (Array.isArray(value))
    return serializeArray(value, recursion, path, serializedPath);
  if (typeof value === "object" && value !== null)
    return serializePlainObject(value, recursion, path, serializedPath);

  // Note: value === null will still have type === 'object'

  return {
    type: typeof value,
    value
  };
}

export function serializeCallStateInfo(info) {
  if (!info) return undefined;

  const path = [].concat(info.callRootContextPath, info.path);
  const serializedPath = [].concat(info.callRootContextPath, info.path);

  // type, value, options, children
  return {
    type: info.type,
    callRootContextPath: info.callRootContextPath,
    path: info.path,
    value: serializeValue(
      info.value,
      undefined,
      joinPath(path, "value"),
      joinPath(serializedPath, "value")
    ),
    options: mapValues(info.options, optionValue =>
      serializeValue(
        optionValue,
        undefined,
        joinPath(path, "options", optionValue),
        joinPath(serializedPath, "options", optionValue)
      )
    ),
    result: serializeValue(
      info.result,
      0,
      joinPath(path, "result"),
      joinPath(serializedPath, "result")
    ),
    children: info.children.map((child, i) =>
      serializeValue(
        child,
        0,
        joinPath(path, ["children", i]),
        joinPath(serializedPath, ["children", i])
      )
    )
  };
}

export function loadMore(path, serializedPath, rootContext) {
  const [callRootContextPath, infoPath, ...valuePath] = path;

  const context =
    callRootContextPath === ""
      ? rootContext
      : get(
          rootContext.children,
          callRootContextPath.split(".").join(".children.")
        );

  const info = get(context._callState, infoPath.split(".").join(".children."));

  const value = valuePath.reduce((obj, part) => obj[part], info);

  return serializeValue(value, undefined, path, serializedPath);
}
