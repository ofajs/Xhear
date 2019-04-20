((glo) => {
    "use strict";

    //<!--public-->

    //<!--xdata-->

    //<!--main-->

    //<!--change-->

    //<!--array-->

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

    // 当前元素是否符合规范
    // @param removeShadow 是否去除相对shadow元素
    const isFilterEle = (parentEle, ele, removeShadow = true) => {
        // 是否通过
        let agree = 1;

        // 获取父层的 xv-shadow
        let xvShadow = parentEle.getAttribute("xv-shadow");

        // 父层是否slot元素
        // let isParentSlot = parentEle.attributes.hasOwnProperty("xv-content") || parentEle.attributes.hasOwnProperty("xv-slot");

        // if (removeShadow && !isParentSlot) {
        if (removeShadow) {
            let eleShadow = ele.getAttribute("xv-shadow");
            if (!(eleShadow == xvShadow)) {
                agree = 0;
            }
        }

        return agree;
    }

    // 暴露到全局
    glo.$ = $;
    assign($, {
        fn: XhearElementFn,
        type: getType,
        init: createXHearElement,
        que: (expr, root = document, options) => {
            let tar = root.querySelector(expr);
            return tar && isFilterEle(root, tar) && createXHearElement(tar);
        },
        queAll: (expr, root = document, options) => {
            let eles = Array.from(root.querySelectorAll(expr)).filter(ele => {
                return isFilterEle(root, ele);
            })
            return eles.map(ele => createXHearElement(ele));
        },
        nextTick,
        xdata: createXData,
        register
    });

    // 添加默认样式
    let mStyle = document.createElement('style');
    mStyle.innerHTML = "[xv-ele]{display:none;}";
    document.head.appendChild(mStyle);

    // 初始化控件
    nextTick(() => {
        Array.from(document.querySelectorAll('[xv-ele]')).forEach(e => {
            renderEle(e);
        });
    });

})(window);