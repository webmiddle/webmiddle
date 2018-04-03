import { PropTypes, evaluate, createContext } from "webmiddle";
import path from "path";
import Pipe from "webmiddle-service-pipe";
import { fileExists, readFile, writeFile } from "./utils/filesystem";

async function Resume({ savePath, children }, context) {
  const outputBasePath = context.options.outputBasePath;
  let filename = path.resolve(outputBasePath, savePath);
  if (!filename.endsWith(".json")) filename += ".json";

  if (await fileExists(filename)) {
    const data = await readFile(filename);
    return JSON.parse(data);
  }
  // not exists
  const resource = await evaluate(
    createContext(context, { expectResource: true }),
    <Pipe>{children}</Pipe>
  );
  await writeFile(filename, JSON.stringify(resource));

  return resource;
}

Resume.propTypes = {
  savePath: PropTypes.string.isRequired,
  children: PropTypes.array.isRequired
};

export default Resume;
