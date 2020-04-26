((glo) => {
    "use strict";
    //<!--../stanz/dist/xdata-->
    //<!--public-->
    //<!--main-->
    //<!--event-->
    //<!--reBuildArray-->
    //<!--register-->

    const createXhearEle = ele => (ele.__xhear__ || new XhearEle(ele));
    const createXhearProxy = ele => createXhearEle(ele)[PROXYTHIS];

    // 全局用$
    let $ = (expr) => {
        if (expr instanceof XhearEle) {
            return expr;
        }

        let ele;

        if (getType(expr) === "string" && !/\<.+\>/.test(expr)) {
            ele = document.querySelector(expr);
        } else {
            ele = parseToDom(expr);
        }

        return ele ? createXhearProxy(ele) : null;
    }

    // 扩展函数（只是辅助将内部函数暴露出去而已）
    const ext = (callback) => {
        callback({
            // 渲染shadow的内部方法
            renderEle
        });
    }

    Object.assign($, {
        register,
        nextTick,
        xdata: obj => createXData(obj)[PROXYTHIS],
        v: "{{versionCode}}",
        version: "{{version}}",
        fn: XhearEleFn,
        isXhear,
        ext,
        queAll(expr) {
            return queAllToArray(document, expr).map(tar => createXhearProxy(tar));
        }
    });

    glo.$ = $;

})(window);