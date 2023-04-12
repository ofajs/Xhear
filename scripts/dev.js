const path = require("path");
const syncDirectory = require("sync-directory");

const stanzSrcDir = path.resolve(__dirname, "../../stanz/src");
const srcDir = path.resolve(__dirname, "../src/stanz");

syncDirectory(stanzSrcDir, srcDir, {
  watch: true,
});

console.log(`Listening to stanz source files : ${stanzSrcDir}`);
