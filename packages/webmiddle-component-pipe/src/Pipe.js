import { PropTypes } from "webmiddle";

async function Pipe({ children }, context) {
  const resources = {};
  let lastResource;

  for (const child of children) {
    const resource = await context
      .extend({
        expectResource: true,
        functionParameters: [resources]
      })
      .evaluate(child);
    resources[resource.name] = resource;
    lastResource = resource;
  }

  return lastResource;
}

Pipe.propTypes = {
  children: PropTypes.array.isRequired
};

export default Pipe;
