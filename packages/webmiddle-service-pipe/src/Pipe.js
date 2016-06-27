import WebMiddle, { PropTypes } from 'webmiddle';

const Pipe = ({ children, webmiddle }) => {
  return new Promise(async (resolve, reject) => {
    try {
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

      resolve(lastResource);
    } catch (e) {
      console.log('Pipe', e);
      reject(e);
    }
  });
};

Pipe.propTypes = {

};

export default Pipe;
