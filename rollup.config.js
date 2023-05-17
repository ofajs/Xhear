const path = require("path");
const CWD = process.cwd();
const PACKAGE = require(path.join(CWD, "package.json"));

const banner = `//! ${PACKAGE.name} - v${PACKAGE.version} ${
  PACKAGE.homepage
}  (c) ${PACKAGE.startyear}-${new Date().getFullYear()} ${PACKAGE.author.name}`;

module.exports = {
  input: "packages/xhear/base.mjs",
  output: [
    {
      file: "dist/xhear.mjs",
      format: "es",
      banner,
    },
    {
      file: "dist/xhear.js",
      format: "umd",
      name: "$",
      banner,
    },
  ],
  plugins: [],
};
