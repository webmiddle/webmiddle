import path from "path";
import fs from "fs";
import mkdirp from "mkdirp";

export function fileExists(filename) {
  return new Promise((resolve, reject) => {
    fs.stat(filename, err => {
      if (!err) resolve(true);
      else if (err.code === "ENOENT") resolve(false);
      else reject(err);
    });
  });
}

export function readFile(filename, encoding = "utf8") {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, encoding, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

// Note: resolves right away if directory already exists.
export function createDirectory(directory) {
  return new Promise((resolve, reject) => {
    mkdirp(directory, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function writeFile(filename, data) {
  await createDirectory(path.dirname(filename));

  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}
