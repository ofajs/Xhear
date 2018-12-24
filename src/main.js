const XhearElementHandler = {
    get(target, key, receiver) {
        // 判断是否纯数字
        if (/\D/.test(key)) {
            return Reflect.get(target, key, receiver);
        } else {
            // 纯数字就从children上获取
            let ele = getContentEle(receiver.ele).children[key];
            return ele && createXHearElement(ele);
        }
    },
    set(target, key, value, receiver) {
        if (/^_.+/.test(key) || defaultKeys.has(key)) {
            return Reflect.set(target, key, value, receiver);
        }

        // 获取到_entrendModifyId就立刻删除
        let modifyId = target._entrendModifyId;
        if (modifyId) {
            delete target._entrendModifyId;
        }

        // 数字和关键key才能修改
        if (!/\D/.test(key) || target[EXKEYS].has(key)) {
            return xhearEntrend({
                genre: "handleSet",
                modifyId,
                target,
                key,
                value,
                receiver
            });
        }

        return false;

    },
    deleteProperty(target, key) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (/^_.+/.test(key)) {
            return Reflect.deleteProperty(target, key);
        }
        console.error(`you can't use delete with xhearElement`);
        return false;
    }
};

function XhearElement(ele) {
    defineProperties(this, {
        tag: {
            enumerable: true,
            value: ele.tagName.toLowerCase()
        },
        ele: {
            value: ele
        }
    });
    let opt = {
        // status: "root",
        // 设置数组长度
        // length,
        // 事件寄宿对象
        [EVES]: new Map(),
        // modifyId存放寄宿对象
        [MODIFYIDHOST]: new Set(),
        // modifyId清理器的断定变量
        [MODIFYTIMER]: 0,
        // watch寄宿对象
        [WATCHHOST]: new Map(),
        // 同步数据寄宿对象
        [SYNCHOST]: new Map(),
        // ------下面是XhearElement新增的------
        // 实体事件函数寄存
        [XHEAREVENT]: new Map(),
        // 在exkeys内的才能进行set操作
        [EXKEYS]: new Set()
    };

    // 设置不可枚举数据
    setNotEnumer(this, opt);

    // 返回代理后的数据对象
    return new Proxy(this, XhearElementHandler);
}
let XhearElementFn = XhearElement.prototype = Object.create(XDataFn);

defineProperties(XhearElementFn, {
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

            // 自身的children加入
            this.forEach((e, i) => {
                if (e instanceof XhearElement) {
                    obj[i] = e.object;
                } else {
                    obj[i] = e;
                }
            });

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

// 修正事件方法
setNotEnumer(XhearElementFn, {
    on(...args) {
        let eventName = args[0],
            selector,
            callback,
            data;

        // 判断是否对象传入
        if (getType(eventName) == "object") {
            let eveOnObj = eventName;
            eventName = eveOnObj.event;
            callback = eveOnObj.callback;
            data = eveOnObj.data;
            selector = eveOnObj.selector;
        } else {
            // 判断第二个参数是否字符串，字符串当做selector处理
            switch (getType(args[1])) {
                case "string":
                    selector = args[1];
                    callback = args[2];
                    data = args[3];
                    break;
                default:
                    callback = args[1];
                    data = args[2];
            }

            // 修正参数项
            args = [{
                event: eventName,
                callback,
                data
            }];
        }

        // 判断原生是否有存在注册的函数
        let tarCall = this[XHEAREVENT].get(eventName);
        if (!tarCall) {
            let eventCall;
            // 不存在就注册
            this.ele.addEventListener(eventName, eventCall = (e) => {
                // 阻止掉其他所有的函数监听
                e.stopImmediatePropagation();

                // 事件实例生成
                let target = createXHearElement(e.target);
                let eveObj = new XDataEvent(eventName, target);

                // 补充keys
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
            this[XHEAREVENT].set(eventName, eventCall);
        }

        let reData = XDataFn.on.apply(this, args);

        // 判断有selector，把selector数据放进去
        if (selector) {
            // 获取事件寄宿对象
            let eves = getEvesArr(this, eventName);

            // 遍历函数
            Array.from(eves).some(e => {
                if (e.callback == callback) {
                    // 添加selector数据
                    e.selector = selector;
                    return true;
                }
            });
        }

        return reData;
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
        let eveObj = args[0];
        let eventName = eveObj;

        // 判断是否 shadow元素，shadow元素到根节点就不要冒泡
        if (eveObj instanceof XDataEvent) {
            if (eveObj.shadow && eveObj.shadow == this.xvRender) {
                return;
            }
            eventName = eveObj.type;
        }

        // 临时寄存数组
        let temps = [];

        // 获取事件寄宿对象
        let eves = getEvesArr(this, eventName);
        eves.forEach(e => {
            if (e.selector) {
                let {
                    target
                } = eveObj;
                // 判断是否在selector
                if (!target.parents(e.selector).length && !target.is(e.selector)) {
                    // 临时移除count，后面还原
                    temps.push([e, e.count]);
                    // 禁止运行
                    e.count = undefined;
                }
            }
        });

        let reData = XDataFn.emit.apply(this, args);

        // 还原数据
        temps.forEach(e => {
            e[0].count = e[1];
        });

        return reData;
    },
    que(expr) {
        return $.que(expr, this.ele);
    }
});

// 判断是否要清除注册的事件函数
const intelClearEvent = (_this, eventName) => {
    // 查看是否没有注册的事件函数了，没有就清空call
    let tarEves = _this[EVES][eventName];

    if (tarEves && !tarEves.length) {
        let tarCall = _this[XHEAREVENT].get(eventName);

        // 清除注册事件函数
        _this.ele.removeEventListener(eventName, tarCall);
        _this[XHEAREVENT].delete(eventName);
    }
}