import { PropTypes } from "webmiddle";
import path from "path";
import Pipe from "webmiddle-component-pipe";
import { fileExists, readFile, writeFile } from "./utils/filesystem";

async function Resume({ savePath, children }, context) {
  const outputBasePath = context.options.outputBasePath;
  let filename = path.resolve(outputBasePath, savePath);
  if (!filename.endsWith(".json")) filename += ".json";

  if (await fileExists(filename)) {
    const fileContent = await readFile(filename);
    return context.parseResource(fileContent);
  }
  // not exists
  const resource = await context
    .extend({
      expectResource: true
    })
    .evaluate(<Pipe>{children}</Pipe>);
  await writeFile(filename, context.stringifyResource(resource));

  return resource;
}

Resume.propTypes = {
  savePath: PropTypes.string.isRequired,
  children: PropTypes.array.isRequired
};

export default Resume;