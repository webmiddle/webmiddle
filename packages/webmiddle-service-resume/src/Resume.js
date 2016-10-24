import WebMiddle, { PropTypes } from 'webmiddle';
import path from 'path';
import Pipe from 'webmiddle-service-pipe';
import { fileExists, readFile, writeFile } from './utils/filesystem';

async function Resume({ savePath, children, webmiddle, options }) {
  const outputBasePath = webmiddle.setting('outputBasePath');
  let filename = path.resolve(outputBasePath, savePath);
  if (!filename.endsWith('.json')) filename += '.json';

  if (await fileExists(filename)) {
    const data = await readFile(filename);
    return JSON.parse(data);
  }
  // not exists
  const resource = await webmiddle.evaluate((
    <Pipe>
      {children}
    </Pipe>
  ), options);
  await writeFile(filename, JSON.stringify(resource));

  return resource;
}

Resume.propTypes = {
  savePath: PropTypes.string.isRequired,
  children: PropTypes.array.isRequired,
  webmiddle: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
};

export default Resume;
