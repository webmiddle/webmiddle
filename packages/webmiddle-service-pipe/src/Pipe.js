import WebMiddle, { PropTypes } from 'webmiddle';

const Pipe = ({ children, webmiddle }) => {
  return Promise.resolve().then(async () => {
    const resources = {};
    let lastResource;

    for (const child of children) {
      const resource = await webmiddle.evaluate(child, {
        expectResource: true,
        functionParameters: [resources],
      });
      resources[resource.name] = resource;
      lastResource = resource;
    }

    return lastResource;
  });
};

Pipe.propTypes = {
  children: PropTypes.array.isRequired,
  webmiddle: PropTypes.object.isRequired,
};

export default Pipe;
