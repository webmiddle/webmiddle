import { PropTypes, evaluate, createContext } from "webmiddle";

async function Parallel({ name, limit, children }, context) {
  const resources = {};

  // Note: fullfilled promises are removed from this array
  // (no need to remove rejected promises as one reject makes the
  // whole service fail)
  // The purpose is to keep track of executing promises for
  // implementing the "limit" behaviour.
  const promises = [];

  for (const child of children) {
    if (limit && promises.length >= limit) {
      //console.log('wait', promises.length);
      await Promise.race(promises);
    }

    const promise = evaluate(
      createContext(context, {
        expectResource: true
      }),
      child
    ).then(result => {
      promises.splice(promises.indexOf(promise), 1);
      //console.log('fullfilled', promises.length);
      resources[result.name] = result;
    });
    promises.push(promise);
    //console.log('new one', promises.length);
  }

  await Promise.all(promises);
  return { name, contentType: "application/json", content: resources };
}

Parallel.propTypes = {
  name: PropTypes.string.isRequired,
  limit: PropTypes.number,
  children: PropTypes.array.isRequired
};

export default Parallel;
