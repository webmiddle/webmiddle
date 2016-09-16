var path = require('path');
var fs = require('fs');
var webpack = require('webpack');

var externals = {};

// node_modules
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    externals[mod] = 'commonjs ' + mod;
  });

// core NodeJS modules
/*['fs'].forEach(function(mod) {
  externals[mod] = 'commonjs ' + mod;
});*/

module.exports = function webpackConfig(entryFilename, outputPath, env) {
  var debug = (env !== 'production');

  var plugins = [
    new webpack.BannerPlugin('require("source-map-support").install();',
                             { raw: true, entryOnly: false })
  ];
  if (!debug) {
    plugins = plugins.concat([
      new webpack.optimize.UglifyJsPlugin({ minimize: true }),
    ]);
  }

  return {
    entry: [
      //'babel-polyfill',
      entryFilename
    ],
    target: 'node',
    output: {
      publicPath: '/',
      path: path.resolve(__dirname, outputPath), // make absolute
      filename: path.basename(entryFilename),
      libraryTarget: 'commonjs2',
    },
    devtool: debug ? 'inline-source-map' : undefined,
    context: path.resolve(__dirname, "src"),
    node: {
      __filename: true,
      fs: "empty",
      process: false,
    },

    resolve: {
      root: path.resolve(__dirname, "src")
    },

    module: {
      loaders: [
        {
          loader: "babel-loader",

          // Skip any files outside of your project's `src` directory
          include: [
            path.resolve(__dirname, "src"),
          ],

          // Only run `.js` and `.jsx` files through Babel
          test: /\.jsx?$/,
        },
        {
          test: /\.json$/,
          loader: 'json-loader',
        },
      ]
    },
    externals: externals,
    plugins: plugins,
    debug: debug
  };
}