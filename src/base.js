// ----jQueryCode----
((glo) => {
    "use strict";

    //<!--public-->

    //<!--xdata-->

    //<!--main-->

    //<!--array-->

    //<!--likejQuery-->

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

    // 暴露到全局
    glo.$ = $;

})(window);