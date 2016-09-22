import WebMiddle, { PropTypes } from 'webmiddle';

const Parallel = async ({ name, children, webmiddle }) => {
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
  return { name, contentType: 'application/json', content: resources };
};

Parallel.propTypes = {
  name: PropTypes.string.isRequired,
  children: PropTypes.array.isRequired,
  webmiddle: PropTypes.object.isRequired,
};

export default Parallel;
