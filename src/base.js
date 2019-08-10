((glo) => {
    "use strict";
    //<!--../stanz/dist/xdata-->

    //<!--public-->

    //<!--main-->

    //<!--reBuildArray-->

    //<!--register-->

    const createXhearElement = ele => (ele.__xhear__ || new XhearElement(ele));

    // 全局用$
    let $ = (expr) => {
        let ele;
        switch (getType(expr)) {
            case "string":
                ele = document.querySelector(expr);
                break;
            default:
                if (expr instanceof Element) {
                    ele = expr;
                }
        }

        return createXhearElement(ele)[PROXYTHIS];
    }

    Object.assign($, {
        register
    });

    // 添加默认样式
    let mStyle = document.createElement('style');
    mStyle.innerHTML = "[xv-ele]{display:none;}";
    document.head.appendChild(mStyle);

    // 初始化控件
    nextTick(() => {
        Array.from(document.querySelectorAll('[xv-ele]')).forEach(e => {
            renderEle(e);
        });
    });

    glo.$ = $;

})(window);