import WebMiddle, { PropTypes } from 'webmiddle';

async function Pipe({ children, webmiddle, options }) {
  const resources = {};
  let lastResource;

  for (const child of children) {
    const resource = await webmiddle.evaluate(child, {
      ...options,
      expectResource: true,
      functionParameters: [resources],
    });
    resources[resource.name] = resource;
    lastResource = resource;
  }

  return lastResource;
}

Pipe.propTypes = {
  children: PropTypes.array.isRequired,
  webmiddle: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
};

export default Pipe;
