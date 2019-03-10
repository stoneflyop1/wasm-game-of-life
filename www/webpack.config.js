const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  entry: {
    index: "./bootstrap.js",
    webgl: "./webgl.js"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  mode: "development",
  plugins: [
    new CopyWebpackPlugin(['index.html']),
    new CopyWebpackPlugin(['webgl.html'])
  ],
};
