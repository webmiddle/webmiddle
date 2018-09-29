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

function lazyLoad(value, path = [], transformedPath) {
  return {
    type: "more",
    path,
    transformedPath
  };
}

function transformVirtual(
  virtual,
  recursion = DEFAULT_RECURSION,
  path = [],
  transformedPath = []
) {
  const transformedValue = {
    type: transformValue(
      virtual.type,
      recursion - 1,
      joinPath(path, "type"),
      joinPath(transformedPath, "value", "type")
    ),
    attributes: mapValues(virtual.attributes, (
      attrValue,
      attrName // always include
    ) =>
      transformValue(
        attrValue,
        recursion - 1,
        joinPath(path, "attributes", attrName),
        joinPath(transformedPath, "value", "attributes", attrName)
      )
    ),
    children: transformValue(
      virtual.children,
      recursion - 1,
      joinPath(path, "children"),
      joinPath(transformedPath, "value", "children")
    )
  };

  return {
    type: "virtual",
    value: transformedValue
  };
}

function transformResource(
  resource,
  recursion = DEFAULT_RECURSION,
  path = [],
  transformedPath = []
) {
  const stringifiedContent = resource.stringifyContent();

  const transformedValue = {
    id: resource.id,
    name: resource.name,
    contentType: resource.contentType,
    content: transformValue(
      stringifiedContent,
      recursion - 1,
      joinPath(path, "stringifiedContent"), // make sure to lazy load the stringified version (it exists since we called stringifyContent())
      joinPath(transformedPath, "value", "content")
    )
  };

  return {
    type: "resource",
    value: transformedValue
  };
}

function transformFunction(
  fn,
  recursion = DEFAULT_RECURSION,
  path = [],
  transformedPath = []
) {
  return {
    type: "function",
    value: undefined, // always omitted
    name: fn.name
  };
}

function transformArray(
  array,
  recursion = DEFAULT_RECURSION,
  path = [],
  transformedPath = []
) {
  const transformedValue = shouldLazyLoad(array, recursion)
    ? lazyLoad(array, path)
    : array.map((v, i) =>
        transformValue(
          v,
          recursion - 1,
          joinPath(path, i),
          joinPath(transformedPath, "value", i)
        )
      );

  return {
    type: "array",
    value: transformedValue,
    length: array.length
  };
}

function transformPlainObject(
  obj,
  recursion = DEFAULT_RECURSION,
  path = [],
  transformedPath = []
) {
  const transformedValue = shouldLazyLoad(obj, recursion)
    ? lazyLoad(obj, path)
    : mapValues(obj, (v, k) =>
        transformValue(
          v,
          recursion - 1,
          joinPath(path, k),
          joinPath(transformedPath, "value", k)
        )
      );

  return {
    type: "object",
    value: transformedValue
  };
}

export function transformValue(
  value,
  recursion = DEFAULT_RECURSION,
  path = [],
  transformedPath = []
) {
  if (shouldLazyLoad(value, recursion)) {
    return lazyLoad(value, path, transformedPath);
  }

  if (isVirtual(value))
    return transformVirtual(value, recursion, path, transformedPath);
  if (isResource(value))
    return transformResource(value, recursion, path, transformedPath);
  if (typeof value === "function")
    return transformFunction(value, recursion, path, transformedPath);
  if (Array.isArray(value))
    return transformArray(value, recursion, path, transformedPath);
  if (typeof value === "object" && value !== null)
    return transformPlainObject(value, recursion, path, transformedPath);

  // Note: value === null will still have type === 'object'

  return {
    type: typeof value,
    value
  };
}

export function transformCallStateInfo(info) {
  if (!info) return undefined;

  const path = [].concat(info.callRootContextPath, info.path);
  const transformedPath = [].concat(info.callRootContextPath, info.path);

  // type, value, options, children
  return {
    type: info.type,
    callRootContextPath: info.callRootContextPath,
    path: info.path,
    value: transformValue(
      info.value,
      undefined,
      joinPath(path, "value"),
      joinPath(transformedPath, "value")
    ),
    options: mapValues(info.options, optionValue =>
      transformValue(
        optionValue,
        undefined,
        joinPath(path, "options", optionValue),
        joinPath(transformedPath, "options", optionValue)
      )
    ),
    result: transformValue(
      info.result,
      0,
      joinPath(path, "result"),
      joinPath(transformedPath, "result")
    ),
    children: info.children.map((child, i) =>
      transformValue(
        child,
        0,
        joinPath(path, ["children", i]),
        joinPath(transformedPath, ["children", i])
      )
    )
  };
}

export function loadMore(path, transformedPath, rootContext) {
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

  return transformValue(value, undefined, path, transformedPath);
}
