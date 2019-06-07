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
            // tar = document.querySelector(expr);
            return $.que(expr);
        }

        return parseToXHearElement(tar);
    }

    // 当前元素是否符合规范
    const isRelativeShadow = (parentEle, ele) => {
        // 是否通过
        let agree = 1;

        // 获取父层的 xv-shadow
        let xvShadow = parentEle.getAttribute("xv-shadow");

        let eleShadow = ele.getAttribute("xv-shadow");

        if (eleShadow && xvShadow !== eleShadow) {
            agree = null;
        }

        return agree;
    }

    // 暴露到全局
    let rootDom = document.querySelector("html");
    glo.$ = $;
    assign($, {
        fn: XhearElementFn,
        type: getType,
        init: createXHearElement,
        que: (expr, root = rootDom) => {
            let tar = root.querySelector(expr);
            return tar && isRelativeShadow(root, tar) && createXHearElement(tar);
        },
        queAll: (expr, root = rootDom) => {
            let eles = Array.from(root.querySelectorAll(expr)).filter(ele => {
                return isRelativeShadow(root, ele);
            })
            return eles.map(ele => createXHearElement(ele));
        },
        nextTick,
        xdata: createXData,
        register,
        version: 40000
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