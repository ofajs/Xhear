/**
 * 当前这个是依赖marked插件的
 * 正常情况下，开发xhear html控件 是把整个逻辑都写进一个js的
 * 如果线上用，可以将marked.js和这个js文件打包成一个js，方便直接调用
 * 当前是测试demo，所以把两个文件分开，方便debug和查看
 */

xhear.register({
    tag: "markdown",
    temp: `
        <div sv-content></div>
    `,
    data: {
        // 原始文本
        mtext: ""
    },
    val: {
        get() {
            return this.mtext;
        },
        set(text) {
            // 保存内容
            this.mtext = text;

            let $ele = this;

            // 根据第一段文字，确定后面的数据删减空格数
            let line_one = text.match(/ *\S/);

            // 按行分组
            let lines = text.match(/.*\n/g);

            if (lines) {
                // 重新修正文本
                text = "";

                // 把前置空格干掉
                lines.map(e => {
                    text += e.replace(new RegExp('^ +'), "");
                });
            }

            // 临时元素
            let temp = $('<div />');

            // 这个 markdown 自定义元素依赖 marked 这个库
            temp.html(marked(text));

            // table添加样式
            temp.find('table').addClass('uk-table uk-table-hover uk-table-striped');

            // 列表
            temp.find('ul').addClass('uk-list uk-list-striped');

            // 描述
            temp.find('dl').addClass('uk-description-list-horizontal uk-description-list-line');

            $ele.html(temp.html());
        }
    },
    rendered($ele) {
        // 获取文本数据
        let text = $ele.text();

        // 直接设置value
        $ele.val(text);
    }
});