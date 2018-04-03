import { PropTypes, evaluate, createContext } from "webmiddle";

async function Pipe({ children }, context) {
  const resources = {};
  let lastResource;

  for (const child of children) {
    const resource = await evaluate(
      createContext(context, {
        expectResource: true,
        functionParameters: [resources]
      }),
      child
    );
    resources[resource.name] = resource;
    lastResource = resource;
  }

  return lastResource;
}

Pipe.propTypes = {
  children: PropTypes.array.isRequired
};

export default Pipe;
