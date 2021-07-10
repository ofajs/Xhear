((glo) => {
    "use strict";
    //<o:start--toofa.js-->
    //<!--../stanz/dist/xdata-->
    //<!--public-->
    //<!--main-->
    //<!--form-->
    //<!--array-->
    //<!--event-->
    //<!--register-->
    //<!--render-->

    function $(expr) {
        if (expr instanceof Element) {
            return createXEle(expr);
        }

        const exprType = getType(expr);

        // 目标元素
        let ele;

        if (exprType == "string") {
            if (!/\<.+\>/.test(expr)) {
                ele = document.querySelector(expr);
            } else {
                ele = parseStringToDom(expr)[0]
            }
        } else if (exprType == "object") {
            ele = parseDataToDom(expr);
        } else if (expr === document || expr instanceof DocumentFragment) {
            ele = expr;
        }

        if (ele) {
            return createXEle(ele);
        }

        return null;
    }

    Object.assign($, {
        all(expr) {
            return Array.from(document.querySelectorAll(expr)).map(e => createXEle(e));
        },
        register,
        xdata: (obj) => createXData(obj)
    });
    //<o:end--toofa.js-->

    glo.$ = $
})(window);