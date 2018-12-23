// 可运行的方法
['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'includes'].forEach(methodName => {
    let oldFunc = Array.prototype[methodName];
    if (oldFunc) {
        setNotEnumer(XhearElementFn, {
            [methodName](...args) {
                return oldFunc.apply(Array.from(getContentEle(this.ele).children).map(e => createXHearElement(e)), args);
            }
        });
    }
});

['pop', 'push', 'reverse', 'splice', 'shift', 'unshift'].forEach(methodName => {
    defineProperty(XhearElementFn, methodName, {
        writable: true,
        value(...args) {
            // 获取到_entrendModifyId就立刻删除
            let modifyId = this._entrendModifyId;
            if (modifyId) {
                delete this._entrendModifyId;
            }

            // 其他方式就要通过主体entrend调整
            return xhearEntrend({
                genre: "arrayMethod",
                args,
                methodName,
                modifyId,
                receiver: this
            });
        }
    });
});

// xhearElement用的splice方法
const xhearSplice = (_this, index, howmany, ...items) => {
    let reArr = [];

    let {
        ele
    } = _this;

    // 确认是否渲染的元素，抽出content元素
    let contentEle = getContentEle(ele);
    let {
        children
    } = contentEle;

    // 先删除后面数量的元素
    while (howmany > 0) {
        let childEle = children[index];

        reArr.push(parseToXHearElement(childEle));

        // 删除目标元素
        contentEle.removeChild(childEle);

        // 数量减少
        howmany--;
    }

    // 定位目标子元素
    let tar = children[index];

    let shadowId = ele.getAttribute('xv-shadow');

    // 添加元素
    if (index >= 0 && tar) {
        items.forEach(e => {
            let nEle = parseToXHearElement(e).ele;
            shadowId && (nEle.setAttribute('xv-shadow', shadowId));
            contentEle.insertBefore(nEle, tar);
        });
    } else {
        items.forEach(e => {
            let nEle = parseToXHearElement(e).ele;
            shadowId && (nEle.setAttribute('xv-shadow', shadowId));
            contentEle.appendChild(nEle);
        });
    }

    return reArr;
}