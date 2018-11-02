import { PropTypes } from "webmiddle";
import path from "path";
import { fileExists, readFile, writeFile } from "./utils/filesystem";

async function Resume({ savePath, task }, context) {
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
    .evaluate(task);
  await writeFile(filename, context.stringifyResource(resource));

  return resource;
}

Resume.propTypes = {
  savePath: PropTypes.string.isRequired,
  task: PropTypes.any.isRequired
};

export default Resume;
