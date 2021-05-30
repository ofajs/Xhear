((glo) => {
    "use strict";
    //<!--../stanz/dist/xdata-->
    //<!--public-->
    //<!--main-->
    //<!--event-->
    //<!--register-->

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
        }

        return null;
    }

    $.all = (expr) => {
        return Array.from(document.querySelectorAll(expr)).map(e => createXEle(e));
    }

    glo.$ = $
})(window);