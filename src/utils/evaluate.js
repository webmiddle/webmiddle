import isVirtual from './isVirtual';
import isResource from './isResource';
import callVirtual from './callVirtual';

export default async function evaluate(value, options = {}) {
  try {
    let result = value;

    if (typeof result === 'function') {
      result = result(...(options.functionParameters || []));
      return this.evaluate(result, options);
    }

    const promiseResult = await Promise.resolve(result);
    if (promiseResult !== result) {
      return this.evaluate(promiseResult, options);
    }

    if (isVirtual(result)) {
      const { result: virtualResult, webmiddle } = await this.callVirtual(result);
      if (virtualResult !== result) {
        return webmiddle.evaluate(virtualResult, options);
      }
    }

    if (!isResource(result) && options.expectResource) {
      throw new Error(`Expected a resource from ${JSON.stringify(value)}, got ${JSON.stringify(result)}`);
    }

    return result;
  } catch (e) {
    console.log('evaluate', e);
    throw e;
  }
};
