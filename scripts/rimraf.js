var rimraf = require('rimraf');
var path = require('path');

var file = process.argv[2];
if (!file) {
  throw 'No file specified';
}

var absoluteFile = path.resolve(process.cwd(), file);
rimraf(absoluteFile, (err) => {
  if (err) throw err;
});
