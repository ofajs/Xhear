((glo) => {
    "use strict";
    //<!--../stanz/dist/xdata-->
    //<!--public-->
    //<!--main-->
    //<!--event-->
    //<!--reBuildArray-->
    //<!--register-->

    const createXhearEle = ele => (ele.__xhear__ || new XhearEle(ele));

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

        return ele ? createXhearEle(ele)[PROXYTHIS] : null;
    }

    Object.assign($, {
        register,
        nextTick,
        xdata: obj => createXData(obj),
        versinCode: 5000000,
        fn: XhearEleFn
    });

    glo.$ = $;

})(window);