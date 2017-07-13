const fs = require("fs");
const path = require("path");
const spawn = require("child_process").spawn;

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}

const currentDirectory = path.basename(__dirname);
const targetDirectories = getDirectories(
  path.resolve(__dirname, "../packages")
);

var command = process.argv[2] || "npm";
// http://stackoverflow.com/a/17537559
const cmdCommands = ["gulp", "npm"];
if (process.platform === "win32" && cmdCommands.indexOf(command) >= 0) {
  command += ".cmd";
}

const commandArguments =
  process.argv.length >= 3 ? process.argv.slice(3) : ["run", "build:watch"];
console.log(command, commandArguments);

targetDirectories.forEach(dir => {
  const childProcess = spawn(command, commandArguments, {
    cwd: path.resolve(__dirname, `../packages/${dir}`)
  });
  childProcess.stdout.on("data", function(data) {
    console.log(dir, "stdout: " + data.toString());
  });
  childProcess.stderr.on("data", function(data) {
    console.log(dir, "stderr: " + data.toString());
  });
  childProcess.on("exit", function(code) {
    //console.log(dir, 'child process exited with code ' + code.toString());
  });
});
