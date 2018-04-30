xhear.register({
    tag: "webcode",
    attrs: ['lang'],
    data: {
        lang: "javascript",
        code: ""
    },
    val: {
        get() {},
        set(text) {

            let $ele = this;
            let html = '';

            // 按行分组
            let lineArr = text.split(/\n/g);

            // javascript格式化
            if (this.lang === "javascript") {
                lineArr.forEach(e => {

                    // 字符串颜色
                    e = e.replace(/('.*?')|(".*?")|(\/.+\/)/g, text => `{c2/}${text}{/c2}`);

                    // 特定符号后面的定义变量
                    e = e.replace(/(var|let|function|return)( +[\w_\$]+)/g, function(content, b1, b2) {
                        content = content.replace(b1, `{c1/}${b1}{/c1}`);
                        content = content.replace(b2, `{c4/}${b2}{/c4}`);
                        return content;
                    });

                    // 等于号
                    e = e.replace(/\=/g, text => `{c3/}={/c3}`);

                    // 注释
                    e = e.replace(/\/\/.+/g, text => `{c6/}${text}{/c6}`);

                    // 等于号前后的东西
                    e = e.replace(/=(.+);/g, function(content, tar) {
                        // 判断是否有大于号
                        if (content.search('{') == -1) {
                            content = content.replace(tar, `{c4/}${tar}{/c4}`);
                        }
                        return content;
                    });

                    // 点 的前后
                    e = e.replace(/([\w_\$]+)\.([\w+_]+)/g, function(content, b1, b2) {
                        // 判断 b1 是不是关键字内的
                        if (/(document|window)/.test(b1)) {
                            content = content.replace(b1 + ".", `{c5/}${b1}{/c5}.`);
                        } else {
                            content = content.replace(b1 + ".", `{c4/}${b1}{/c4}.`);
                        }
                        content = content.replace("." + b2, `.{c1/}${b2}{/c1}`);
                        return content;
                    });

                    // 转换空格符
                    e = e.replace(/ /g, '&nbsp;');

                    // 根据标识转换class span
                    e = e.replace(/\{(.+?)\/\}(.+?)\{\/.+?\}/g, function(e, className, content) {
                        // 替换class
                        return `<span class="${className}">${content}</span>`;
                    });

                    // 添加到总字符串里
                    html += '<br>' + e;
                });
                // 转换换行符
                html = html.replace(/\n/g, "<br>");
            }

            // 设置html
            $ele.html(html);
        }
    },
    inited($ele) {
        // 设置代码
        let code = $ele.text();

        // 判断是否有pre
        if (0 in $ele.find('pre')) {
            code = $ele.find('pre').text();
        }
        $ele.code = code;

        // 设置code
        $ele.val(code);
    }
})