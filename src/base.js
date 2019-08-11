((glo) => {
    "use strict";
    //<!--../stanz/dist/xdata-->
    //<!--public-->
    //<!--main-->
    //<!--reBuildArray-->
    //<!--register-->

    const createXhearEle = ele => (ele.__xhear__ || new XhearEle(ele));

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

        return createXhearEle(ele)[PROXYTHIS];
    }

    Object.assign($, {
        register
    });

    glo.$ = $;

})(window);