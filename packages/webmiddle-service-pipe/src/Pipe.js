import WebMiddle, { PropTypes } from 'webmiddle';

const Pipe = async ({ children, webmiddle }) => {
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
};

Pipe.propTypes = {
  children: PropTypes.array.isRequired,
  webmiddle: PropTypes.object.isRequired,
};

export default Pipe;
