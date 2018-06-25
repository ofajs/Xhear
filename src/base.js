((glo) => {
    "use strict";
    //<!--public-->

    // start
    // 获取旧的主体
    let _$ = glo.$;

    // 原来的原型链
    let $fn = _$.fn;

    // 还原给外部的$
    // let $ = function () {};

    // 新原型链
    let shearInitPrototype = create($fn);

    //<!--xdata-->

    //<!--register-->
})(window);