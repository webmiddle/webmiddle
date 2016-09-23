import isVirtual from './isVirtual';
import isResource from './isResource';

// check if target is the actual NaN value:
// NaN is the only value that is not equal to itself.
function isRealNaN(target) {
  return target !== target; // eslint-disable-line no-self-compare
}

export default async function evaluate(value, options = {}) {
  //console.log('evaluate', value);
  let result = value;

  if (typeof result === 'function') {
    //console.log('evaluate function');
    result = result(...(options.functionParameters || []));
    return this.evaluate(result, options);
  }

  const promiseResult = await Promise.resolve(result);
  if (promiseResult !== result && (!isRealNaN(promiseResult) || !isRealNaN(result))) {
    //console.log('evaluate promise result', promiseResult, result);
    return this.evaluate(promiseResult, options);
  }

  if (isVirtual(result)) {
    //console.log('evaluate virtual');
    const topVirtual = result;

    const { result: virtualResult, webmiddle } = await this.callVirtual(result);
    if (virtualResult !== result) {
      result = await webmiddle.evaluate(virtualResult, options);
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
  }

  if (!isResource(result) && options.expectResource) {
    throw new Error(`Expected a resource from ${JSON.stringify(value)}, got ${JSON.stringify(result)}`);
  }

  return result;
};
