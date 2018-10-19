import evaluateVirtual from "./evaluateVirtual";
import addCallNode from "./addCallNode";
import { isResource } from "./resource";
import { isVirtual } from "./virtual";

// check if target is the actual NaN value:
// NaN is the only value that is not equal to itself.
function isRealNaN(target) {
  return target !== target; // eslint-disable-line no-self-compare
}

export default async function evaluate(context, value) {
  context.log("evaluate", value);
  let result = value;

  if (typeof result === "function") {
    context.log("evaluate function", result);
    result = result(...(context.options.functionParameters || []));
    return evaluate(context, result);
  }

  const promiseResult = await Promise.resolve(result);
  if (
    promiseResult !== result &&
    (!isRealNaN(promiseResult) || !isRealNaN(result))
  ) {
    context.log("evaluate promise result", promiseResult, result);
    return evaluate(context, promiseResult);
  }

  if (isVirtual(result)) {
    context.log("evaluate virtual", result);
    let resultEvaluated = false;
    ({ result } = await addCallNode(
      async newContext => {
        const topVirtual = result;

        const {
          result: virtualResult,
          context: virtualContext
        } = await evaluateVirtual(newContext, result);

        context = virtualContext; // change context in top scope

        if (virtualResult !== result) {
          result = await evaluate(context, virtualResult);
          if (isResource(result)) {
            // resource overrides by top virtual
            ["name", "contentType"].forEach(p => {
              if (typeof topVirtual.attributes[p] !== "undefined") {
                result[p] = topVirtual.attributes[p];
              }
            });
          }
          resultEvaluated = true;
          return result;
        }
        return virtualResult;
      },
      context,
      {
        type: "virtual",
        value: result
      }
    ));
    // if we have already recursively evaluated result, then we are done
    if (resultEvaluated) return result;
  }

  if (!isResource(result) && context.options.expectResource) {
    throw new Error(
      `Expected a resource from ${JSON.stringify(value)}, got ${JSON.stringify(
        result
      )}`
    );
  }

  return result;
}
