// the exported dist must be able to run directly in the browser, 
// so the dependency file modules should be packaged in as well;
// Tried '@rollup/plugin-node-resolve' but didn't get the result 
// I wanted (seems to be because stanz is also an esmodule);
// Since it only depends on stanz, I copied the src file directly 
// and packaged stanz as node_modules to get a version that runs directly in the browser.

const { copyDirectory, deleteDirectory, getRelativePath } = require("./util");
const shell = require("shelljs");
const path = require("path");

copyDirectory("./src", "./temp-src", ({ content, path: filePath }) => {
  let reContent = content;
  const arr = content.match(/"stanz\/src\/.+?"/g);

  if (arr) {
    const relateStr = getRelativePath(
      path.dirname(filePath),
      "node_modules/stanz"
    );

    arr.forEach((importStr) => {
      const reStr = importStr.replace("stanz/", `${relateStr}/`);
      console.log(filePath, importStr, reStr);
      reContent = reContent.replace(importStr, reStr);
    });
  }

  return reContent;
});

(async () => {
  await new Promise((res) => {
    shell.exec("rollup --c", () => {
      res();
    });
  });

  await new Promise((res) => {
    shell.exec("npm run terser", () => {
      res();
    });
  });

  deleteDirectory("./temp-src");
})();
