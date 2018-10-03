import { PropTypes } from "webmiddle";
import Pipe from "webmiddle-component-pipe";
import CheerioToVirtual from "webmiddle-component-cheerio-to-virtual";
import VirtualToJson from "webmiddle-component-virtual-to-json";

function CheerioToJson(props) {
  return (
    <Pipe>
      <CheerioToVirtual {...props} name="virtual">
        {props.children}
      </CheerioToVirtual>

      {({ virtual }) => <VirtualToJson name={props.name} from={virtual} />}
    </Pipe>
  );
}

CheerioToJson.propTypes = {
  name: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired, // resource
  fullConversion: PropTypes.bool,
  children: PropTypes.array
};

export default CheerioToJson;
