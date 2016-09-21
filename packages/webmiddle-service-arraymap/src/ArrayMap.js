import WebMiddle, { PropTypes } from 'webmiddle';

const ArrayMap = ({ name, array, callback, webmiddle }) => {
  return Promise.resolve().then(async () => {
    const resources = await Promise.all(array.map((value, key) => {
      return webmiddle.evaluate(callback, {
        expectResource: true,
        functionParameters: [value, key],
      });
    }));

    return ({ name, contentType: 'application/json', content: resources });
  });
};

ArrayMap.propTypes = {
  name: PropTypes.string.isRequired,
  array: PropTypes.array.isRequired,
  callback: PropTypes.func.isRequired,
  webmiddle: PropTypes.object.isRequired,
};

export default ArrayMap;
