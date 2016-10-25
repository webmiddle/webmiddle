import WebMiddle, { PropTypes } from 'webmiddle';
import Pipe from 'webmiddle-service-pipe';
import JSONSelectToVirtual from 'webmiddle-service-jsonselect-to-virtual';
import VirtualToJson from 'webmiddle-service-virtual-to-json';

function JSONSelectToJson(props) {
  return (
    <Pipe>
      <JSONSelectToVirtual
        {...props}
        name="virtual"
      >
        {props.children}
      </JSONSelectToVirtual>

      {({ virtual }) =>
        <VirtualToJson
          name={props.name}
          from={virtual}
        />
      }
    </Pipe>
  );
}

JSONSelectToJson.propTypes = {
  name: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired, // resource
  children: PropTypes.array,
};

export default JSONSelectToJson;
