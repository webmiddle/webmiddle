import WebMiddle, { PropTypes } from 'webmiddle';

const Parallel = ({ name, children, webmiddle }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const resources = {};
      const promises = [];

      for (const child of children) {
        const promise = webmiddle.evaluate(child, {
          expectResource: true,
        }).then(result => {
          resources[result.name] = result;
        });
        promises.push(promise);
      }

      await Promise.all(promises);
      resolve({ name, contentType: 'application/json', content: resources });
    } catch (e) {
      console.log('Parallel', e);
      reject(e);
    }
  });
};

Parallel.propTypes = {
  name: PropTypes.string.isRequired,
};

export default Parallel;
