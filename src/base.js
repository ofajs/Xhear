((glo) => {
    "use strict";
    //<!--../stanz/dist/xdata-->
    //<!--public-->
    //<!--main-->
    //<!--event-->
    //<!--array-->
    //<!--register-->

    function $(expr) {
        if (expr instanceof Element) {
            return createXEle(expr);
        }

        const exprType = getType(expr);

        if (exprType == "string") {
            return createXEle(document.querySelector(expr));
        }
    }

    glo.$ = $
})(window);