import { PropTypes } from "webmiddle";

function entries(target) {
  if (!target) return [];
  return Object.keys(target).map(key => [key, target[key]]);
}

async function Parallel({ name, limit, tasks }, context) {
  const resources = {};

  // Note: fullfilled promises are removed from this array
  // (no need to remove rejected promises as one reject makes the
  // whole component fail)
  // The purpose is to keep track of executing promises for
  // implementing the "limit" behaviour.
  const promises = [];

  for (const [taskKey, task] of entries(tasks)) {
    if (limit && promises.length >= limit) {
      //console.log('wait', promises.length);
      await Promise.race(promises);
    }

    const promise = context
      .extend({
        expectResource: true
      })
      .evaluate(task)
      .then(result => {
        promises.splice(promises.indexOf(promise), 1);
        //console.log('fullfilled', promises.length);
        resources[taskKey] = result;
      });
    promises.push(promise);
    //console.log('new one', promises.length);
  }

  await Promise.all(promises);
  return context.createResource(name, "x-webmiddle-type", resources);
}

Parallel.propTypes = {
  name: PropTypes.string.isRequired,
  limit: PropTypes.number,
  tasks: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired
};

export default Parallel;
