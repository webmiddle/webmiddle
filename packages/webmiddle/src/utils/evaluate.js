import isVirtual from './isVirtual';
import isResource from './isResource';

// check if target is the actual NaN value:
// NaN is the only value that is not equal to itself.
function isRealNaN(target) {
  return target !== target; // eslint-disable-line no-self-compare
}

export default async function evaluate(value, options = {}) {
  this.log('evaluate', value);
  let result = value;

  if (typeof result === 'function') {
    this.log('evaluate function', result);
    result = result(...(options.functionParameters || []));
    return this.evaluate(result, options);
  }

  const promiseResult = await Promise.resolve(result);
  if (promiseResult !== result && (!isRealNaN(promiseResult) || !isRealNaN(result))) {
    this.log('evaluate promise result', promiseResult, result);
    return this.evaluate(promiseResult, options);
  }

  if (isVirtual(result)) {
    this.log('evaluate virtual', result);
    const topVirtual = result;

    const {
      result: virtualResult,
      webmiddle,
      linkedWebmiddle,
      options: virtualOptions,
    } = await this.callVirtual(result, options);
    try {
      if (virtualResult !== result) {
        result = await webmiddle.evaluate(virtualResult, virtualOptions);
        if (isResource(result)) {
          // resource overrides by top virtual
          ['name', 'contentType'].forEach(p => {
            if (typeof topVirtual.attributes[p] !== 'undefined') {
              result[p] = topVirtual.attributes[p];
            }
          });
        }
        return result;
      }
    } finally {
      if (linkedWebmiddle) {
        // unlink (unset temp parent)
        linkedWebmiddle.parent = undefined;
      }
    }
  }

  if (!isResource(result) && options.expectResource) {
    throw new Error(`Expected a resource from ${JSON.stringify(value)}, got ${JSON.stringify(result)}`);
  }

  return result;
};
