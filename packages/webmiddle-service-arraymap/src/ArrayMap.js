import WebMiddle, { PropTypes } from 'webmiddle';

const ArrayMap = ({ name, array, children, webmiddle }) => {
  return Promise.resolve().then(async () => {
    const resources = await Promise.all(array.map((value, key) => {
      return webmiddle.evaluate(children[0], {
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
  children: PropTypes.array.isRequired,
  webmiddle: PropTypes.object.isRequired,
};

export default ArrayMap;
