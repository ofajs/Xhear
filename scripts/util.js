const fs = require("fs");
const path = require("path");

function deleteDirectory(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`Directory ${directory} does not exist.`);
    return;
  }

  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);

    if (fs.statSync(filePath).isDirectory()) {
      deleteDirectory(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }

  fs.rmdirSync(directory);
}

function copyDirectory(source, destination, callback) {
  if (!fs.existsSync(source)) {
    console.log(`Source directory ${source} does not exist.`);
    return;
  }

  fs.mkdirSync(destination, { recursive: true });

  const files = fs.readdirSync(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destinationPath = path.join(destination, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destinationPath, callback);
    } else {
      const sourceContent = fs.readFileSync(sourcePath, "utf8");

      const modifiedContent = callback
        ? callback({ content: sourceContent, path: sourcePath })
        : sourceContent;

      fs.writeFileSync(destinationPath, modifiedContent);
    }
  }
}
function getRelativePath(from, to) {
  const relativePath = path.relative(from, to);
  return path.normalize(relativePath);
}

exports.deleteDirectory = deleteDirectory;
exports.copyDirectory = copyDirectory;
exports.getRelativePath = getRelativePath;
