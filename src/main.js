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

        // debugger

        return true;

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
    data: {
        get() {
            return this.ele.dataset;
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
                obj.xvele = 1;
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
    },
    // 获取标识元素
    marks: {
        get() {
            // 判断自身是否有shadowId
            let shadowId = this.attr('xv-shadow');

            let obj = {};
            this.queAll('[xv-mark]').forEach(e => {
                if (shadowId !== e.attr('[xv-shadow]')) {
                    return;
                }
                obj[e.attr("xv-mark")] = e;
            });
            return obj;
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

                // 添加 originalEvent
                eveObj.originalEvent = e;

                // 添加默认方法
                eveObj.preventDefault = e.preventDefault.bind(e);

                // 判断添加影子ID
                let shadowId = e.target.getAttribute('xv-shadow');
                shadowId && (eveObj.shadow = shadowId);

                target.emit(eveObj);

                return false;
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
                    // 确认函数，添加before和after方法
                    e.before = (options) => {
                        let eveObj = options.event;
                        let target = eveObj.target;

                        // 目标元素
                        let delegateTarget = target.parents(selector)[0];
                        if (!delegateTarget && target.is(selector)) {
                            delegateTarget = target;
                        }

                        // 判断是否在selector内
                        if (!delegateTarget) {
                            return 0;
                        }

                        // 通过selector验证
                        // 设置两个关键数据
                        assign(eveObj, {
                            selector,
                            delegateTarget
                        });

                        // 返回可运行
                        return 1;
                    }
                    e.after = (options) => {
                        let eveObj = options.event;

                        // 删除无关数据
                        delete eveObj.selector;
                        delete eveObj.delegateTarget;
                    }
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

        // 判断是否 shadow元素，shadow元素到根节点就不要冒泡
        if (eveObj instanceof XDataEvent && eveObj.shadow && eveObj.shadow == this.xvRender) {
            // 判断是否update冒泡
            if (eveObj.type == "update") {
                // update就阻止冒泡
                return;
            }

            // 其他事件修正数据后继续冒泡
            // 修正事件对象
            let newEveObj = new XDataEvent(eveObj.type, this);

            // 判断添加影子ID
            let shadowId = this.ele.getAttribute('xv-shadow');
            shadowId && (eveObj.shadow = shadowId);

            let {
                originalEvent,
                preventDefault
            } = eveObj;
            if (originalEvent) {
                assign(newEveObj, {
                    originalEvent,
                    preventDefault,
                    fromShadowEvent: eveObj
                });
            }

            // 替换原来的事件对象
            args = [newEveObj];
        }

        return XDataFn.emit.apply(this, args);
    },
    que(expr) {
        return $.que(expr, this.ele);
    },
    extend(...args) {
        let obj = {};
        assign(obj, ...args);

        // 合并数据
        Object.keys(obj).forEach(k => {
            let val = obj[k];
            let selfVal = this[k];
            if (val !== selfVal) {
                this[k] = val;
            }
        });
    },
    // 根据界面元素上的toData生成xdata实例
    viewData() {
        // 判断自身是否有shadowId
        let shadowId = this.attr('xv-shadow');

        // 生成xdata数据对象
        let xdata = $.xdata({});

        // 获取所有toData元素
        let eles = this.queAll('[xv-vd]');
        eles.forEach(e => {
            if (shadowId !== e.attr('[xv-shadow]')) {
                return;
            }

            // 获取vd内容
            let vd = e.attr('xv-vd');

            if (e.xvele) {
                let syncObj = {};

                // 判断是否有to结构
                if (/ to /.test(vd)) {
                    // 获取分组
                    let vGroup = vd.split(",");
                    vGroup.forEach(g => {
                        // 拆分 to 两边的值
                        let toGroup = g.split("to");
                        if (toGroup.length == 2) {
                            let key = toGroup[0].trim();
                            let toKey = toGroup[1].trim();
                            xdata[toKey] = e[key];
                            syncObj[toKey] = key;
                        }
                    });
                } else {
                    vd = vd.trim();
                    // 设置同步数据
                    xdata[vd] = e.value;
                    syncObj[vd] = "value";
                }

                // 数据同步
                xdata.sync(e, syncObj);
            } else {
                // 普通元素
                let {
                    ele
                } = e;

                if ('checked' in ele) {
                    // 设定值
                    xdata[vd] = ele.checked;

                    // 修正Input
                    xdata.watch(vd, e => {
                        ele.checked = xdata[vd];
                    });
                    ele.addEventListener("change", e => {
                        xdata[vd] = ele.checked;
                    });
                } else {
                    // 设定值
                    xdata[vd] = ele.value;

                    // 修正Input
                    xdata.watch(vd, e => {
                        ele.value = xdata[vd];
                    });
                    ele.addEventListener("change", e => {
                        xdata[vd] = ele.value;
                    });
                    ele.addEventListener("input", e => {
                        xdata[vd] = ele.value;
                    });
                }
            }
        });

        return xdata;
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