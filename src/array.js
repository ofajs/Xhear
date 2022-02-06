// 重造数组方法
[
    "concat",
    "every",
    "filter",
    "find",
    "findIndex",
    "forEach",
    "map",
    "slice",
    "some",
    "indexOf",
    "lastIndexOf",
    "includes",
    "join",
].forEach((methodName) => {
    const arrayFnFunc = Array.prototype[methodName];
    if (arrayFnFunc) {
        Object.defineProperty(XEle.prototype, methodName, {
            value(...args) {
                return arrayFnFunc.apply(
                    Array.from(this.ele.children).map(createXEle),
                    args
                );
            },
        });
    }
});

extend(XEle.prototype, {
    // 最基础的
    splice(index, howmany, ...items) {
        const { ele } = this;
        const children = Array.from(ele.children);

        // 删除相应元素
        const removes = [];
        let b_index = index;
        let b_howmany =
            getType(howmany) == "number" ? howmany : this.length - index;
        let target = children[b_index];
        while (target && b_howmany > 0) {
            removes.push(target);
            ele.removeChild(target);
            b_index++;
            b_howmany--;
            target = children[b_index];
        }

        // 新增元素
        if (items.length) {
            let fragEle = document.createDocumentFragment();
            items.forEach((e) => {
                if (e instanceof Element) {
                    fragEle.appendChild(e);
                    return;
                }

                if (e instanceof XEle) {
                    fragEle.appendChild(e.ele);
                    return;
                }

                let type = getType(e);

                if (type == "string") {
                    parseStringToDom(e).forEach((e2) => {
                        fragEle.appendChild(e2);
                    });
                } else if (type == "object") {
                    fragEle.appendChild(parseDataToDom(e));
                }
            });

            if (index >= this.length) {
                // 在末尾添加元素
                ele.appendChild(fragEle);
            } else {
                // 指定index插入
                ele.insertBefore(fragEle, ele.children[index]);
            }
        }

        // 改动冒泡
        emitUpdate(this, {
            xid: this.xid,
            name: "splice",
            args: [index, howmany, ...items],
        });

        return removes;
    },
    sort(sortCall) {
        const selfEle = this.ele;
        const childs = Array.from(selfEle.children)
            .map(createXEle)
            .sort(sortCall);

        rebuildXEleArray(selfEle, childs);

        emitUpdate(this, {
            xid: this.xid,
            name: "sort",
        });
        return this;
    },
    reverse() {
        const selfEle = this.ele;
        const childs = Array.from(selfEle.children).reverse();
        rebuildXEleArray(selfEle, childs);
        emitUpdate(this, {
            xid: this.xid,
            name: "reverse",
        });

        return this;
    },
});

// 根据先后顺序数组进行元素排序
const rebuildXEleArray = (container, rearray) => {
    const { children } = container;

    rearray.forEach((e, index) => {
        let ele = e.ele || e;

        const targetChild = children[index];

        if (!targetChild) {
            // 属于后面新增
            container.appendChild(ele);
        } else if (ele !== targetChild) {
            container.insertBefore(ele, targetChild);
        }
    });
};
