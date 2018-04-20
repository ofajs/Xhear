const fs = require('fs');

let count = 1;

fs.watch('src/', async(err, file) => {

    // 打开主体base文件
    let basefile = fs.readFileSync('src/base.js', 'utf8');

    let operationFile = fs.readFileSync('src/operation.js', 'utf8');

    basefile = basefile.replace('//<!--operation-->', operationFile);

    // 写入最终文件
    fs.writeFile('dist/shear.js', basefile, 'utf8', (err) => {
        if (err) throw err;
        console.log('shear.js write succeed!' + count++);
    });
});