const { spawn } = require("child_process");
const path = require("path");

let command = process.argv[2];
if (!command) {
  throw new Error("No command specified");
}
// http://stackoverflow.com/a/17537559
const cmdCommands = ["babel", "ava"];
if (process.platform === "win32" && cmdCommands.indexOf(command) >= 0) {
  command += ".cmd";
}
command = path.resolve(__dirname, "../node_modules/.bin/" + command);

const commandArguments = process.argv.slice(3);

console.log("Executing", command, commandArguments);
const childProcess = spawn(command, commandArguments);
childProcess.stdout.on("data", data => {
  console.log("\x1b[37m", data.toString()); // white
});
childProcess.stderr.on("data", data => {
  console.log("\x1b[31m", data.toString()); // red
});
childProcess.on("exit", code => {
  //console.log(dir, 'child process exited with code ' + code.toString());
  process.exit(code);
});
