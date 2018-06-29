((glo) => {
    "use strict";

    // start
    // 获取旧的主体
    let _$ = glo.$;

    // 原来的原型链
    let $fn = _$.fn;

    //<!--public-->

    // 新jq实例原型对象
    let shearInitPrototype = create($fn);

    //<!--renderEle-->

    // 还原给外部的$
    let $ = function (...args) {
        let reObj = _$(...args);
        let [arg1, arg2] = args;

        // 优化操作，不用每次都查找节点
        // 判断传进来的参数是不是字符串
        if ((getType(arg1) == "string" && arg1.search('<') > -1) || arg1 instanceof Element) {
            renderAllSvEle(reObj);
        }

        // 生成实例
        reObj = createShear$(reObj);

        return reObj;
    };
    $.prototype = $fn;
    assign($, {
        init() {

        }
    }, _$);

    //<!--xdata-->

    //<!--register-->

    //<!--operation-->

    // init
    const xhear = {
        register
    };

    glo.xhear = xhear;

    glo.$ = $;

    //<!--ready-->

})(window);