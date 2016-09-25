import WebMiddle, { PropTypes } from 'webmiddle';
import path from 'path';
import Pipe from 'webmiddle-service-pipe';
import { fileExists, readFile, writeFile } from './utils/filesystem';

const Resume = ({ savePath, children, webmiddle }) => {
  return Promise.resolve().then(async () => {
    const outputBasePath = webmiddle.setting('outputBasePath');
    let filename = path.resolve(outputBasePath, savePath);
    if (!filename.endsWith('.json')) filename += '.json';

    if (await fileExists(filename)) {
      const data = await readFile(filename);
      return JSON.parse(data);
    }
    // not exists
    const resource = await webmiddle.evaluate(
      <Pipe>
        {children}
      </Pipe>
    );
    await writeFile(filename, JSON.stringify(resource));

    return resource;
  });
};

Resume.propTypes = {
  savePath: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
  webmiddle: PropTypes.object.isRequired,
};

export default Resume;
