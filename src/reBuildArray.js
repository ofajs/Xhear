// 不影响数据原结构的方法，重新做钩子
['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'lastIndexOf', 'includes', 'join'].forEach(methodName => {
    let arrayFnFunc = Array.prototype[methodName];
    if (arrayFnFunc) {
        Object.defineProperty(XhearEle.prototype, methodName, {
            value(...args) {
                return arrayFnFunc.apply(Array.from(this.ele.children).map(e => createXhearEle(e)[PROXYTHIS]), args);
            }
        });
    }
});

let XhearEleProtoSplice = (t, index, howmany, items = []) => {
    let _this = t[XDATASELF];

    // 返回的数组
    let reArr = [];

    let contentEle = _this.ele;
    let { children } = contentEle;

    while (howmany > 0) {
        let childEle = children[index];

        reArr.push(createXhearEle(childEle));

        // 删除目标元素
        contentEle.removeChild(childEle);

        // 数量减少
        howmany--;
    }

    // 定位目标子元素
    let tar = children[index];

    // 添加元素
    if (items.length) {
        let fragment = document.createDocumentFragment();
        items.forEach(e => fragment.appendChild(parseToDom(e)));
        if (index >= 0 && tar) {
            contentEle.insertBefore(fragment, tar)
        } else {
            contentEle.appendChild(fragment);
        }
    }
    emitUpdate(_this, "splice", [index, howmany, ...items]);
}

// 重置所有数组方法
Object.defineProperties(XhearEle.prototype, {
    push: {
        value(...items) {
            let fragment = document.createDocumentFragment();
            items.forEach(item => {
                let ele = parseToDom(item);
                fragment.appendChild(ele);
            });
            this.ele.appendChild(fragment);
            emitUpdate(this[XDATASELF], "push", items);
            return this.length;
        }
    },
    splice: {
        value(index, howmany, ...items) {
            return XhearEleProtoSplice(this, index, howmany, items);
        }
    },
    unshift: {
        value(...items) {
            XhearEleProtoSplice(this, 0, 0, items);
            return this.length;
        }
    },
    shift: {
        value() {
            return XhearEleProtoSplice(this, 0, 1);
        }
    },
    pop: {
        value() {
            return XhearEleProtoSplice(this, this.length - 1, 1);
        }
    },
    reverse() { },
    sort() { }
});