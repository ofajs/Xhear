// 不影响数据原结构的方法，重新做钩子
['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'lastIndexOf', 'includes', 'join'].forEach(methodName => {
    let arrayFnFunc = Array.prototype[methodName];
    if (arrayFnFunc) {
        Object.defineProperty(XhearElement.prototype, methodName, {
            value(...args) {
                return arrayFnFunc.apply(Array.from(getContentEle(this.ele).children).map(e => createXhearElement(e)[PROXYTHIS]), args);
            }
        });
    }
});