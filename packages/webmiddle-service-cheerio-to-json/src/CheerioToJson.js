import webmiddle, { PropTypes } from "webmiddle";
import Pipe from "webmiddle-service-pipe";
import CheerioToVirtual from "webmiddle-service-cheerio-to-virtual";
import VirtualToJson from "webmiddle-service-virtual-to-json";

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
