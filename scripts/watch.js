const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

let count = 1;

let beforeCode = "";

let mainFun = async () => {
    // 打开主体base文件
    let basefile = await readFile('src/base.js', 'utf8');

    // 扩展控制器逻辑
    // let operationFile = await readFile('src/operation.js', 'utf8');

    // // 整合 扩展控制器逻辑 
    // basefile = basefile.replace('//<!--operation-->', operationFile);

    // let rCode = await readFile('src/renderEle.js', 'utf8');
    // basefile = basefile.replace('//<!--renderEle-->', e => rCode);

    // rCode = await readFile('src/bridge.js', 'utf8');
    // basefile = basefile.replace('//<!--bridge-->', e => rCode);

    if (beforeCode == basefile) {
        return;
    }
    beforeCode = basefile;

    // 写入最终文件
    fs.writeFile('dist/xhear-no$.js', basefile, 'utf8', (err) => {
        if (err) throw err;
        console.log('shear.js write succeed!' + count++);
    });
}

let readFileTimer;

fs.watch('src/', async (err, file) => {
    clearTimeout(readFileTimer);
    readFileTimer = setTimeout(mainFun, 1000);
});