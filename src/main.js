// handle
let XhearElementHandler = {
    get(target, key, receiver) {
        // 判断是否纯数字
        if (/\D/.test(String(key))) {
            return Reflect.get(target, key, receiver);
        } else {
            let ele = getContentEle(receiver.ele).children[key];
            return ele && createXHearElement(ele);
        }
    },
    set(target, key, value, receiver) {
        let oldVal;
        let xvShadowVal;
        if (/\D/.test(key)) {
            // 判断是否有_exkey上的字段
            if (target[EXKEYS] && target[EXKEYS].includes(key)) {
                oldVal = target[key];

                // 一样的值就别折腾
                if (oldVal == value) {
                    return;
                }

                // 设置在原型对象上
                target.ele[XHEARDATA][key] = value;
            } else {
                // 不是纯数字，设置在proxy对象上
                return Reflect.set(target, key, value, receiver);
            }
        } else {
            // 直接替换元素
            value = parseToXHearElement(value);
            let {
                ele
            } = receiver;

            xvShadowVal = ele.getAttribute('xv-shadow');
            if (xvShadowVal) {
                // 存在shadow的情况，添加的新元素也要shadow属性
                value.ele.setAttribute('xv-shadow', xvShadowVal);
            }

            // 获取旧值
            let tarEle = receiver[key];
            if (tarEle) {
                // 替换相应元素
                let {
                    parentElement
                } = tarEle.ele;
                parentElement.insertBefore(value.ele, tarEle.ele);
                parentElement.removeChild(tarEle.ele);
            } else {
                // 在后面添加新元素
                let contentEle = getContentEle(ele);
                contentEle.appendChild(value.ele);
            }

            oldVal = tarEle;
        }

        let mid = getModifyId(receiver);

        // update事件冒泡
        // 事件实例生成
        let eveObj = new XDataEvent('update', receiver);

        // 设置 shadowId 在 event Object 上
        xvShadowVal && (eveObj.shadow = xvShadowVal);

        // 添加修正数据
        eveObj.modify = {
            // change 改动
            // set 新增值
            genre: "change",
            key,
            value,
            oldVal,
            modifyId: mid
        };

        // 触发事件
        receiver.emit(eveObj);

        return true;
    }
};

// class
let XhearElement = function (ele) {
    defineProperties(this, {
        // ele: {
        //     value: ele
        // },
        // 事件寄宿对象
        // [EVES]: {
        //     value: {}
        // },
        // 实体事件函数寄存
        [XHEAREVENT]: {
            value: {}
        },
        tag: {
            // writeable: false,
            enumerable: true,
            value: ele.tagName.toLowerCase()
        }
    });

    // 继承 xdata 的数据
    let opt = {
        // 事件寄宿对象
        [EVES]: {},
        // watch寄宿对象
        [WATCHHOST]: {},
        // sync 寄宿对象
        [SYNCHOST]: [],
        [MODIFYHOST]: [],
        [MODIFYTIMER]: ""
    };
    setNotEnumer(this, opt);
};

// 判断是否要清除注册的事件函数
const intelClearEvent = (_this, eventName) => {
    // 查看是否没有注册的事件函数了，没有就清空call
    let tarEves = _this[EVES][eventName];

    if (tarEves && !tarEves.length) {
        let tarCall = _this[XHEAREVENT][eventName];

        // 清除注册事件函数
        _this.ele.removeEventListener(eventName, tarCall);
        delete _this[XHEAREVENT][eventName];
    }
}

// 重构seekData函数
seekData = (data, exprObj) => {
    let arr = [];

    // 关键数据
    let exprKey = exprObj.k,
        exprValue = exprObj.v,
        exprType = exprObj.type,
        exprEqType = exprObj.eqType;

    let searchFunc = k => {
        let tarData = data[k];

        if (isXData(tarData)) {
            // 判断是否可添加
            let canAdd = conditData(exprKey, exprValue, exprType, exprEqType, tarData);

            // 允许就添加
            canAdd && arr.push(tarData);

            // 查找子项
            let newArr = seekData(tarData, exprObj);
            arr.push(...newArr);
        }
    }

    if (data instanceof XhearElement) {
        // 准备好key
        let exkeys = data[EXKEYS] || [];
        let childKeys = Object.keys(getContentEle(data.ele).children);
        [...exkeys, ...childKeys].forEach(searchFunc);
    } else {
        Object.keys(data).forEach(searchFunc);
    }
    searchFunc = null;
    return arr;
}

// 重写isXDataEqual
isXDataEqual = (xd1, xd2) => {
    if (xd1 instanceof XhearElement && xd2 instanceof XhearElement) {
        return xd1.ele === xd2.ele;
    }

    return xd1 === xd2;
}

// XhearElement prototype
let XhearElementFn = XhearElement.prototype = Object.create(XDataFn);
setNotEnumer(XhearElementFn, {
    on(...args) {
        let eventName = args[0];

        // 判断原生是否有存在注册的函数
        let tarCall = this[XHEAREVENT][eventName];
        if (!tarCall) {
            let eventCall;
            // 不存在就注册
            this.ele.addEventListener(eventName, eventCall = (e) => {
                // 阻止掉其他所有的函数监听
                e.stopImmediatePropagation();

                // 事件实例生成
                let target = createXHearElement(e.target);
                let eveObj = new XDataEvent(eventName, target);

                let tempTarget = target;
                while (tempTarget.ele !== this.ele) {
                    eveObj.keys.unshift(tempTarget.hostkey);
                    tempTarget = tempTarget.parent;
                }

                // 添加 originalEvent
                eveObj.originalEvent = e;

                // 添加默认方法
                eveObj.preventDefault = e.preventDefault.bind(e);

                this.emit(eveObj);
            });
            this[XHEAREVENT][eventName] = eventCall;
        }

        return XDataFn.on.apply(this, args);
    },
    one(...args) {
        let eventName = args[0];
        let reData = XDataFn.one.apply(this, args);

        // 智能清除事件函数
        intelClearEvent(this, eventName);

        return reData;
    },
    off(...args) {
        let eventName = args[0];

        let reData = XDataFn.off.apply(this, args);

        // 智能清除事件函数
        intelClearEvent(this, eventName);

        return reData;
    },
    emit(...args) {
        let tar = this;

        let eveObj = args[0];

        // 判断是否 shadow元素，shadow元素到根节点就不要冒泡
        if (eveObj instanceof XDataEvent && eveObj.shadow && eveObj.shadow == this.xvRender) {
            return;
        }

        let reData = XDataFn.emit.apply(tar, args);

        return reData;
    },
    que(expr) {
        return $.que(expr, this.ele);
    }
});

// 关键keys
let importantKeys;
defineProperties(XhearElementFn, importantKeys = {
    hostkey: {
        get() {
            return Array.from(this.ele.parentElement.children).indexOf(this.ele);
        }
    },
    parent: {
        get() {
            let parentElement = getParentEle(this.ele);
            if (!parentElement) {
                return;
            }
            return createXHearElement(parentElement);
        }
    },
    prev: {
        get() {
            let {
                previousElementSibling
            } = this.ele;
            return previousElementSibling && createXHearElement(previousElementSibling);
        }
    },
    next: {
        get() {
            let {
                nextElementSibling
            } = this.ele;
            return nextElementSibling && createXHearElement(nextElementSibling);
        }
    },
    // 是否注册的Xele
    xvele: {
        get() {
            let {
                attributes
            } = this.ele;

            return attributes.hasOwnProperty('xv-ele') || attributes.hasOwnProperty('xv-render');
        }
    },
    class: {
        get() {
            return this.ele.classList;
        }
    },
    string: {
        get() {
            return JSON.stringify(this.object);
        }
    },
    object: {
        get() {
            let obj = {
                tag: this.tag
            };

            // 非xvele就保留class属性
            if (!this.xvRender) {
                let classValue = this.ele.classList.value;
                classValue && (obj.class = classValue);
            } else {
                // 获取自定义数据
                let exkeys = this[EXKEYS];
                exkeys && exkeys.forEach(k => {
                    obj[k] = this[k];
                });
            }

            this.forEach((e, i) => {
                if (e instanceof XhearElement) {
                    obj[i] = e.object;
                } else {
                    obj[i] = e;
                }
            });

            // obj.length = this.length;
            return obj;
        }
    },
    length: {
        get() {
            let contentEle = getContentEle(this.ele);
            return contentEle.children.length;
        }
    }
});
importantKeys = Object.keys(importantKeys);