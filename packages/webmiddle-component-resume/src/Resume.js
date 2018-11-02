import { PropTypes } from "webmiddle";
import path from "path";
import { fileExists, readFile, writeFile } from "./utils/filesystem";

async function Resume({ savePath, task }, context) {
  const outputBasePath = context.options.outputBasePath;
  let filename = path.resolve(outputBasePath, savePath);
  if (!filename.endsWith(".json")) filename += ".json";

  if (await fileExists(filename)) {
    const fileContent = await readFile(filename);
    const resource = context.parseResource(fileContent);
    return resource.content;
  }
  // not exists
  const result = await context
    .extend({
      expectResource: false
    })
    .evaluate(task);
  const resource = context.createResource("result", "x-webmiddle-type", result);
  await writeFile(filename, context.stringifyResource(resource));
  return result;
}

Resume.propTypes = {
  savePath: PropTypes.string.isRequired,
  task: PropTypes.any.isRequired
};

export default Resume;
