import { PropTypes } from "webmiddle";

async function Pipe({ children }, context) {
  let lastResult;

  for (const child of children) {
    const result = await context
      .extend({
        expectResource: false,
        functionParameters: [lastResult]
      })
      .evaluate(child);
    lastResult = result;
  }

  return lastResult;
}

Pipe.propTypes = {
  children: PropTypes.array.isRequired
};

export default Pipe;
