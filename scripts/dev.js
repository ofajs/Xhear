const path = require("path");
const syncDirectory = require("sync-directory");

const watchDirs = [
  {
    name: "stanz",
    source: path.resolve(__dirname, "../../stanz/src"),
    test: path.resolve(__dirname, "../../stanz/test"),
  },
];

watchDirs.forEach((e) => {
  const { name, source, test } = e;

  syncDirectory(source, path.resolve(__dirname, `../packages/${name}/src`), {
    watch: true,
  });

  syncDirectory(test, path.resolve(__dirname, `../packages/${name}/test`), {
    watch: true,
  });

  console.log(`Listening to stanz source files : ${source} and ${test}`);
});
