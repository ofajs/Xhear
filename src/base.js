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
        if (expr instanceof XhearEle) {
            return expr;
        }

        let ele;
        switch (getType(expr)) {
            case "string":
                if (expr.includes("<")) {
                    ele = parseStringToDom(expr);
                } else {
                    ele = document.querySelector(expr);
                }
                break;
            case "object":
                ele = parseDataToDom(expr);
                break;
            default:
                if (expr instanceof Element) {
                    ele = expr;
                }
        }

        return ele ? createXhearEle(ele)[PROXYTHIS] : null;
    }

    Object.assign($, {
        register
    });

    glo.$ = $;

})(window);