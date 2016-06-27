var webpack = require('webpack');
var webpackConfig = require('./webpack.config.js');
var gulp = require('gulp-help')(require('gulp'));
var gutil = require('gulp-util');
var path = require('path');
var rimraf = require('rimraf');
var through2 = require('through2');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var env = require('./env');

gulp.task('default', ['dev']);
gulp.task('dev', ['build', 'watch']);
gulp.task('build', 'Rebuild the src files', ['webpack']);

gulp.task('watch', 'Watching the src files...', function() {
  watch('./src/**', batch(function (events, done) {
    gulp.start('build', done);
  }));
});

function webpackFile(outputPath, file, enc, next) {
  // run webpack
  webpack(webpackConfig(file.path, outputPath, env), function(err, stats) {
    if (err) {
      gutil.beep();
      throw new gutil.PluginError("webpack", err);
    }
    gutil.log("[webpack]", stats.toString({
      chunks: false,
        // output options
    }));
    next(null, file);
  });
}

gulp.task('webpack', 'Bundle the src files with webpack', ['prepare'], function(callback) {
  return gulp.src([
    './src/index.js',
  ])
  .pipe(through2.obj(webpackFile.bind(null, './dist')));
});

gulp.task('prepare', 'Prepare the build', ['clean'], function() {
});

gulp.task('clean', 'Clean the extension dist directory', function(cb) {
  rimraf(path.resolve(__dirname, 'dist'), cb);
});