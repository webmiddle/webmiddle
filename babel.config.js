module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "6.14.0"
        },
        useBuiltIns: "usage"
      }
    ]
  ],
  plugins: [
    ["@babel/plugin-proposal-class-properties", { loose: false }], // old stage 3
    [
      "@babel/plugin-transform-react-jsx",
      { pragma: "(global.webmiddle || require('webmiddle').default).h" }
    ],
    ["@babel/plugin-transform-runtime", { regenerator: true }]
  ],
  env: {
    test: {
      plugins: ["istanbul"]
    }
  }
};
