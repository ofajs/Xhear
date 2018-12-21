((glo) => {
    //<!--public-->

    //<!--xdata-->

    //<!--main-->

    //<!--arrayMethod-->

    //<!--likejQuery-->

    //<!--register-->

    // 全局用$
    let $ = (expr) => {
        if (expr instanceof XhearElement) {
            return expr;
        }

        let tar = expr;

        if (getType(expr) === "string" && expr.search("<") === -1) {
            tar = document.querySelector(expr);
        }

        return parseToXHearElement(tar);
    }

    // init 
    glo.$ = $;
    assign($, {
        fn: XhearElementFn,
        type: getType,
        init: createXHearElement,
        que: (expr, root = document) => createXHearElement(root.querySelector(expr)),
        queAll: (expr, root = document) => Array.from(root.querySelectorAll(expr)).map(e => createXHearElement(e)),
        xdata: createXData,
        register
    });

    // 初始化控件
    nextTick(() => {
        Array.from(document.querySelectorAll('[xv-ele]')).forEach(e => {
            renderEle(e);
        });
    });

    // 添加默认样式
    let mStyle = document.createElement('style');
    mStyle.innerHTML = "[xv-ele]{display:none;}";
    document.head.appendChild(mStyle);

})(window);