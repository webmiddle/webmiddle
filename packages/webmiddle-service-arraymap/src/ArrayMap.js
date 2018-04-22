import { PropTypes } from "webmiddle";

async function ArrayMap({ name, array, callback, limit }, context) {
  const resources = [];
  const promises = []; // executing promises like in Parallel

  for (let i = 0; i < array.length; i++) {
    if (limit && promises.length >= limit) {
      //console.log('wait', promises.length);
      await Promise.race(promises);
    }

    const promise = context
      .extend({
        expectResource: true,
        functionParameters: [array[i], i]
      })
      .evaluate(callback)
      .then(result => {
        promises.splice(promises.indexOf(promise), 1);
        //console.log('fullfilled', promises.length);
        resources[i] = result;
      });
    promises.push(promise);
    //console.log('new one', promises.length);
  }

  await Promise.all(promises);
  return context.createResource(name, "application/json", resources);
}

ArrayMap.propTypes = {
  name: PropTypes.string.isRequired,
  array: PropTypes.array.isRequired,
  callback: PropTypes.func.isRequired,
  limit: PropTypes.number
};

export default ArrayMap;
