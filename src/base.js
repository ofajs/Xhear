((glo) => {
    "use strict";
    //<o:start--toofa.js-->
    //<!--../stanz/dist/xdata-->
    //<!--public-->
    //<!--main-->
    //<!--array-->
    //<!--event-->
    //<!--register-->
    //<!--render-->

    function $(expr) {
        if (expr instanceof Element) {
            return createXEle(expr);
        }

        const exprType = getType(expr);

        if (exprType == "string") {
            if (!/\<.+\>/.test(expr)) {
                return createXEle(document.querySelector(expr));
            } else {
                return createXEle(parseStringToDom(expr)[0]);
            }
        } else if (exprType == "object") {
            return createXEle(parseDataToDom(expr));
        } else if (expr === document || expr instanceof DocumentFragment) {
            return createXEle(expr);
        }

        return null;
    }

    Object.assign($, {
        all(expr) {
            return Array.from(document.querySelectorAll(expr)).map(e => createXEle(e));
        },
        register
    });
    //<o:end--toofa.js-->

    glo.$ = $
})(window);