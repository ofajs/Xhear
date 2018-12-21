((glo) => {
    // 获取随机id
const getRandomId = () => Math.random().toString(32).substr(2);
let objectToString = Object.prototype.toString;
const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
const isUndefined = val => val === undefined;
// 克隆object
const cloneObject = obj => JSON.parse(JSON.stringify(obj));

// 设置不可枚举的方法
const setNotEnumer = (tar, obj) => {
    for (let k in obj) {
        defineProperty(tar, k, {
            // enumerable: false,
            writable: true,
            value: obj[k]
        });
    }
}

//改良异步方法
const nextTick = (() => {
    let isTick = false;
    let nextTickArr = [];
    return (fun) => {
        if (!isTick) {
            isTick = true;
            setTimeout(() => {
                for (let i = 0; i < nextTickArr.length; i++) {
                    nextTickArr[i]();
                }
                nextTickArr = [];
                isTick = false;
            }, 0);
        }
        nextTickArr.push(fun);
    };
})();

// common
const PROTO = '_proto_' + getRandomId();
const XHEAREVENT = "_xevent_" + getRandomId();
const EXKEYS = "_exkeys_" + getRandomId();
const ATTACHED = "_attached_" + getRandomId();
const DETACHED = "_detached_" + getRandomId();
const XHEARDATA = "_xheardata_" + getRandomId();

// database
// 注册数据
const regDatabase = new Map();

let {
    defineProperty,
    defineProperties,
    assign
} = Object;

// 获取 content 容器
const getContentEle = (tarEle) => {
    let contentEle = tarEle;

    // 判断是否xvRender
    while (contentEle.xvRender) {
        let xhearData = contentEle[XHEARDATA];

        if (xhearData) {
            let {
                $content
            } = xhearData;

            if ($content) {
                contentEle = $content.ele;
            } else {
                break;
            }
        }
    }

    return contentEle;
}

// 获取父容器
const getParentEle = (tarEle) => {
    let {
        parentElement
    } = tarEle;

    if (!parentElement) {
        return;
    }

    while (parentElement.xvContent) {
        parentElement = parentElement[XHEARDATA].$host.ele;
    }

    return parentElement;
}

// 判断元素是否符合条件
const meetsEle = (ele, expr) => {
    if (ele === expr) {
        return !0;
    }
    let fadeParent = document.createElement('div');
    if (ele === document) {
        return false;
    }
    fadeParent.appendChild(ele.cloneNode(false));
    return fadeParent.querySelector(expr) ? true : false;
}

// 转换元素
const parseStringToDom = (str) => {
    let par = document.createElement('div');
    par.innerHTML = str;
    let childs = Array.from(par.childNodes);
    return childs.filter(function (e) {
        if (!(e instanceof Text) || (e.textContent && e.textContent.trim())) {
            return e;
        }
    });
};

// 渲染所有xv-ele
const renderAllXvEle = (ele) => {
    // 判断内部元素是否有xv-ele
    let eles = ele.querySelectorAll('[xv-ele]');
    Array.from(eles).forEach(e => {
        renderEle(e);
    });

    let isXvEle = ele.getAttribute('xv-ele');
    if (!isUndefined(isXvEle) && isXvEle !== null) {
        renderEle(ele);
    }
}

// 转换 xhearData 到 element
const parseDataToDom = (data) => {
    if (data.tag && !(data instanceof XhearElement)) {
        let ele = document.createElement(data.tag);

        data.class && ele.setAttribute('class', data.class);
        data.text && (ele.textContent = data.text);

        // 判断是否xv-ele
        let {
            xvele
        } = data;

        let xhearEle;

        if (xvele) {
            ele.setAttribute('xv-ele', "");
            renderEle(ele);
            xhearEle = createXHearElement(ele);

            // 数据合并
            xhearEle[EXKEYS].forEach(k => {
                let val = data[k];
                !isUndefined(val) && (xhearEle[k] = val);
            });
        }

        // 填充内容
        let akey = 0;
        while (akey in data) {
            let childEle = parseDataToDom(data[akey]);

            if (xvele && xhearEle) {
                let {
                    $content
                } = xhearEle;

                if ($content) {
                    $content.ele.appendChild(childEle);
                }
            } else {
                ele.appendChild(childEle);
            }
            akey++;
        }

        return ele;
    }
}

// main
const createXHearElement = ele => {
    if (!ele) {
        return;
    }
    let xhearData = ele[XHEARDATA];
    if (!xhearData) {
        xhearData = new XhearElement(ele);
        ele[XHEARDATA] = xhearData;
    }

    // 防止内存泄露，隔离 xhearData 和 ele
    let xhearEle = Object.create(xhearData);
    defineProperties(xhearEle, {
        ele: {
            enumerable: false,
            value: ele
        }
    });
    xhearEle = new Proxy(xhearEle, XhearElementHandler);
    return xhearEle;
};
const parseToXHearElement = expr => {
    if (expr instanceof XhearElement) {
        return expr;
    }

    let reobj;

    // expr type
    let exprType = getType(expr);

    if (expr instanceof Element) {
        renderAllXvEle(expr);
        reobj = createXHearElement(expr);
    } else if (exprType == "string") {
        reobj = parseStringToDom(expr)[0];
        renderAllXvEle(reobj);
        reobj = createXHearElement(reobj);
    } else if (exprType == "object") {
        reobj = parseDataToDom(expr);
        reobj = createXHearElement(reobj);
    }

    return reobj;
}

    // common
const EVES = "_eves_" + getRandomId();
const RUNARRMETHOD = "_runarrmethod_" + getRandomId();
const WATCHHOST = "_watch_" + getRandomId();
const SYNCHOST = "_synchost_" + getRandomId();
const MODIFYHOST = "_modify_" + getRandomId();
const MODIFYTIMER = "_modify_timer_" + getRandomId();

// business function
// 是否XData
let isXData = obj => obj instanceof XData;

// 生成xdata对象
const createXData = (obj, options) => {
    let redata = obj;
    switch (getType(obj)) {
        case "object":
        case "array":
            redata = new XData(obj, options);
            break;
    }

    return redata;
};

// 销毁数据绑定的事件函数
const clearXdata = (xdata) => {
    if (isXData(xdata)) {
        // 更新状态
        xdata.parent = null;
        xdata.hostkey = null;
        xdata.status = "readyDestory";

        nextTick(() => {
            if (xdata.parent && xdata.hostkey && xdata.status != "root") {
                // 挂载其他对象上成功，修正状态
                xdata.status = "binding";
                return;
            }

            // 开始清扫所有绑定
            // 先清扫 sync
            xdata[SYNCHOST].forEach(e => {
                xdata.unsync(e.opp);
            });

            // 清扫 watch
            xdata[WATCHHOST] = {};

            // 清扫 on
            xdata[EVES] = {};

            xdata[MODIFYHOST] = [];
            clearTimeout(xdata[MODIFYTIMER]);
        });
    }
}

// 判断两个xdata数据是否相等
let isXDataEqual = (xd1, xd2) => {
    if (xd1 === xd2) {
        return true;
    }
}

// virData用的数据映射方法
const mapData = (data, options) => {
    options.forEach(e => {
        switch (e.type) {
            case "map":
                if (!isUndefined(data[e.key])) {
                    data[e.toKey] = data[e.key];
                    delete data[e.key];
                }
                break;
        }
    });

    for (let k in data) {
        let d = data[k];

        if (d instanceof Object) {
            mapData(d, options);
        }
    }
}

// 按条件判断数据是否符合条件
const conditData = (exprKey, exprValue, exprType, exprEqType, tarData) => {
    let reData = 0;

    // 搜索数据
    switch (exprType) {
        case "keyValue":
            let tarValue = tarData[exprKey];
            switch (exprEqType) {
                case "=":
                    if (tarValue == exprValue) {
                        reData = 1;
                    }
                    break;
                case ":=":
                    if (isXData(tarValue) && tarValue.findIndex(e => e == exprValue) > -1) {
                        reData = 1;
                    }
                    break;
                case "*=":
                    if (getType(tarValue) == "string" && tarValue.search(exprValue) > -1) {
                        reData = 1;
                    }
                    break;
                case "~=":
                    if (getType(tarValue) == "string" && tarValue.split(' ').findIndex(e => e == exprValue) > -1) {
                        reData = 1;
                    }
                    break;
            }
            break;
        case "hasValue":
            switch (exprEqType) {
                case "=":
                    if (Object.values(tarData).findIndex(e => e == exprValue) > -1) {
                        reData = 1;
                    }
                    break;
                case ":=":
                    Object.values(tarData).some(tarValue => {
                        if (isXData(tarValue) && tarValue.findIndex(e => e == exprValue) > -1) {
                            reData = 1;
                            return true;
                        }
                    });
                    break;
                case "*=":
                    Object.values(tarData).some(tarValue => {
                        if (getType(tarValue) == "string" && tarValue.search(exprValue) > -1) {
                            reData = 1;
                            return true;
                        }
                    });
                    break;
                case "~=":
                    Object.values(tarData).some(tarValue => {
                        if (getType(tarValue) == "string" && tarValue.split(' ').findIndex(e => e == exprValue) > -1) {
                            reData = 1;
                            return true;
                        }
                    });
                    break;
            }
            break;
        case "hasKey":
            if (tarData.hasOwnProperty(exprKey)) {
                reData = 1;
            }
            break;
    }

    return reData;
}

// 查找数据
let seekData = (data, exprObj) => {
    let arr = [];

    // 关键数据
    let exprKey = exprObj.k,
        exprValue = exprObj.v,
        exprType = exprObj.type,
        exprEqType = exprObj.eqType;

    Object.keys(data).forEach(k => {
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
    });
    return arr;
}

// modifyId清理设置
let readyClearModifyId = (xdata, modifyId) => {
    let modifyHost = xdata[MODIFYHOST];
    modifyHost.push(modifyId);

    // 适时回收
    clearTimeout(xdata[MODIFYTIMER]);
    xdata[MODIFYTIMER] = setTimeout(() => {
        modifyHost.length = 0;
        modifyHost = null;
    }, 5000);
}

// 获取或制作modifyId
let getModifyId = (_this) => {
    let {
        _entrendModifyId
    } = _this;

    if (_entrendModifyId) {
        // 拿到数据立刻删除
        delete _this._entrendModifyId;
    } else {
        _entrendModifyId = getRandomId();

        readyClearModifyId(_this, _entrendModifyId);
    }

    return _entrendModifyId;
}

// main class
function XDataEvent(type, target) {
    let enumerable = true;
    defineProperties(this, {
        type: {
            enumerable,
            value: type
        },
        keys: {
            enumerable,
            value: []
        },
        target: {
            enumerable,
            value: target
        },
        bubble: {
            enumerable,
            writable: true,
            value: true
        },
        cancel: {
            enumerable,
            writable: true,
            value: false
        },
        currentTarget: {
            enumerable,
            writable: true,
            value: target
        }
    });
}

defineProperties(XDataEvent.prototype, {
    // trend数据，用于给其他数据同步用的
    trend: {
        get() {
            let {
                modify
            } = this;

            if (!modify) {
                return;
            }

            let reobj = {
                genre: modify.genre,
                keys: this.keys.slice()
            };

            defineProperty(reobj, "oldVal", {
                value: modify.oldVal
            });

            switch (modify.genre) {
                case "arrayMethod":
                    var {
                        methodName,
                        args,
                        modifyId
                    } = modify;

                    assign(reobj, {
                        methodName,
                        args,
                        modifyId
                    });
                    break;
                default:
                    var {
                        value,
                        modifyId
                    } = modify;

                    if (isXData(value)) {
                        value = value.object;
                    }
                    assign(reobj, {
                        key: modify.key,
                        value,
                        modifyId
                    });
                    break;
            }

            return reobj;
        }
    }
});

function WatchData(data) {
    this.type = "watch";
    assign(this, data);
}

function XData(obj, options = {}) {
    // 生成代理对象
    let proxyThis = new Proxy(this, XDataHandler);

    // 数组的长度
    let length = 0;

    // 非数组数据合并
    Object.keys(obj).forEach(k => {
        // 值
        let value = obj[k];

        if (!/\D/.test(k)) {
            // 数字key
            k = parseInt(k);

            if (k >= length) {
                length = k + 1;
            }
        }

        // 设置值
        this[k] = createXData(value, {
            parent: proxyThis,
            hostkey: k
        });
    });

    let opt = {
        // status: "root",
        // 设置数组长度
        length,
        // 事件寄宿对象
        [EVES]: {},
        // watch寄宿对象
        [WATCHHOST]: {},
        // sync 寄宿对象
        [SYNCHOST]: [],
        [MODIFYHOST]: [],
        [MODIFYTIMER]: ""
    };

    // 设置不可枚举数据
    setNotEnumer(this, opt);

    // if (options.parent) {
    defineProperties(this, {
        status: {
            writable: true,
            value: options.parent ? "binding" : "root"
        },
        parent: {
            writable: true,
            value: options.parent
        },
        hostkey: {
            writable: true,
            value: options.hostkey
        }
    });
    // }

    // 返回Proxy对象
    return proxyThis;
}
let XDataFn = XData.prototype = {};

// 数组通用方法
// 可运行的方法
['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'includes'].forEach(methodName => {
    let arrayFnFunc = Array.prototype[methodName];
    if (arrayFnFunc) {
        defineProperty(XDataFn, methodName, {
            writable: true,
            value(...args) {
                return arrayFnFunc.apply(this, args);
            }
        });
    }
});

// 会影响数组结构的方法
// sort参数会出现函数，会导致不能sync数据的情况
['pop', 'push', 'reverse', 'splice', 'shift', 'unshift'].forEach(methodName => {
    let arrayFnFunc = Array.prototype[methodName];
    if (arrayFnFunc) {
        defineProperty(XDataFn, methodName, {
            writable: true,
            value(...args) {
                // 设置不可执行setHandler
                this[RUNARRMETHOD] = 1;

                let mid = getModifyId(this);

                let redata = arrayFnFunc.apply(this, args);

                // 根据方法添加删除装填
                switch (methodName) {
                    case "shift":
                    case "pop":
                    case "splice":
                        redata.forEach(oldVal => {
                            clearXdata(oldVal);
                        });
                        break;
                }

                // 事件实例生成
                let eveObj = new XDataEvent('update', this);

                // 判断添加方法上是否有xdata，存在就干掉它
                switch (methodName) {
                    case "splice":
                    case "unshift":
                    case "push":
                        args = args.map(e => {
                            if (isXData(e)) {
                                return e.object;
                            }
                            return e;
                        });
                }

                eveObj.modify = {
                    genre: "arrayMethod",
                    methodName,
                    args,
                    modifyId: mid
                };

                this.emit(eveObj);

                // 还原可执行setHandler
                delete this[RUNARRMETHOD];

                return redata;
            }
        });
    }
});

// 获取事件数组
const getEvesArr = (tar, eventName) => {
    let eves = tar[EVES];
    let redata = eves[eventName] || (eves[eventName] = []);
    return redata;
};

const sortMethod = Array.prototype.sort;

// 设置数组上的方法
setNotEnumer(XDataFn, {
    // sort单独处理
    sort(sFunc) {
        // 设置不可执行setHandler
        this[RUNARRMETHOD] = 1;

        let mid = getModifyId(this);

        // 传送的后期参数
        let args;

        if (sFunc instanceof Array) {
            args = [sFunc];

            // 先做备份
            let backThis = Array.from(this);

            sFunc.forEach((eid, i) => {
                this[i] = backThis[eid];
            });
        } else {
            // 记录顺序的数组
            let orders = [];
            args = [orders];

            // 先做备份
            let backThis = Array.from(this);

            // 执行默认方法
            sortMethod.call(this, sFunc);

            // 记录顺序
            this.forEach(e => orders.push(backThis.indexOf(e)));
        }

        // 事件实例生成
        let eveObj = new XDataEvent('update', this);

        eveObj.modify = {
            genre: "arrayMethod",
            methodName: "sort",
            args,
            modifyId: mid
        };

        this.emit(eveObj);

        // 还原可执行setHandler
        delete this[RUNARRMETHOD];

        return this;
    },
    // 事件注册
    on(eventName, callback, options = {}) {
        let eves = getEvesArr(this, eventName);

        // 判断是否相应id的事件绑定
        let oid = options.id;
        if (!isUndefined(oid)) {
            let tarId = eves.findIndex(e => e.eventId == oid);
            (tarId > -1) && eves.splice(tarId, 1);
        }

        // 事件数据记录
        callback && eves.push({
            callback,
            eventId: options.id,
            onData: options.data,
            one: options.one
        });

        return this;
    },
    one(eventName, callback, options = {}) {
        options.one = 1;
        return this.on(eventName, callback, options);
    },
    off(eventName, callback, options = {}) {
        let eves = getEvesArr(this, eventName);
        eves.some((opt, index) => {
            // 想等值得删除
            if (opt.callback === callback && opt.eventId === options.id && opt.onData === options.data) {
                eves.splice(index, 1);
                return true;
            }
        });
        return this;
    },
    emit(eventName, emitData, options = {}) {
        let eves, eventObj;

        if (eventName instanceof XDataEvent) {
            // 直接获取对象
            eventObj = eventName;

            // 修正事件名变量
            eventName = eventName.type;
        } else {
            // 生成emitEvent对象
            eventObj = new XDataEvent(eventName, this);
        }

        // 设置emit上的bubble
        if (options.bubble == false) {
            eventObj.bubble = false;
        }

        // 修正currentTarget
        eventObj.currentTarget = this;

        // 获取事件队列数组
        eves = getEvesArr(this, eventName);

        // 删除的个数
        let deleteCount = 0;

        // 事件数组触发
        Array.from(eves).some((opt, index) => {
            // 触发callback
            // 如果cancel就不执行了
            if (eventObj.cancel) {
                return true;
            }

            // 添加数据
            let args = [eventObj];
            !isUndefined(opt.onData) && (eventObj.data = opt.onData);
            !isUndefined(opt.eventId) && (eventObj.eventId = opt.eventId);
            !isUndefined(opt.one) && (eventObj.one = opt.one);
            !isUndefined(emitData) && (args.push(emitData));

            opt.callback.apply(this, args);

            // 删除多余数据
            delete eventObj.data;
            delete eventObj.eventId;
            delete eventObj.one;

            // 判断one
            if (opt.one) {
                eves.splice(index - deleteCount, 1);
                deleteCount++;
            }
        });

        // 冒泡触发
        if (eventObj.bubble && !eventObj.cancel) {
            let {
                parent
            } = this;
            if (parent) {
                eventObj.keys.unshift(this.hostkey);
                parent.emit(eventObj, emitData);
            }
        }

        return this;
    },
    seek(expr) {
        // 代表式的组织化数据
        let exprObjArr = [];

        let hostKey;
        let hostKeyArr = expr.match(/(^[^\[\]])\[.+\]/);
        if (hostKeyArr && hostKeyArr.length >= 2) {
            hostKey = hostKeyArr[1];
        }

        // 分析expr字符串数据
        let garr = expr.match(/\[.+?\]/g);

        garr.forEach(str => {
            str = str.replace(/\[|\]/g, "");
            let strarr = str.split(/(=|\*=|:=|~=)/);

            let param_first = strarr[0];

            switch (strarr.length) {
                case 3:
                    if (param_first) {
                        exprObjArr.push({
                            type: "keyValue",
                            k: param_first,
                            eqType: strarr[1],
                            v: strarr[2]
                        });
                    } else {
                        exprObjArr.push({
                            type: "hasValue",
                            eqType: strarr[1],
                            v: strarr[2]
                        });
                    }
                    break;
                case 1:
                    exprObjArr.push({
                        type: "hasKey",
                        k: param_first
                    });
                    break;
            }
        });

        // 要返回的数据
        let redata;

        exprObjArr.forEach((exprObj, i) => {
            let exprKey = exprObj.k,
                exprValue = exprObj.v,
                exprType = exprObj.type,
                exprEqType = exprObj.eqType;

            switch (i) {
                case 0:
                    // 初次查找数据
                    redata = seekData(this, exprObj);
                    break;
                default:
                    // 筛选数据
                    redata = redata.filter(tarData => conditData(exprKey, exprValue, exprType, exprEqType, tarData) ? tarData : undefined);
            }
        });

        // hostKey过滤
        if (hostKey) {
            redata = redata.filter(e => (e.hostkey == hostKey) ? e : undefined);
        }

        return redata;
    },
    // 插入trend数据
    entrend(options) {
        // 目标数据
        let target = this;

        let {
            modifyId
        } = options;

        // 获取target
        options.keys.forEach(k => {
            target = target[k];
        });

        // 判断是否运行过
        if (modifyId) {
            if (this[MODIFYHOST].includes(modifyId)) {
                return this;
            } else {
                readyClearModifyId(this, modifyId);
                // 临时记录数据
                target._entrendModifyId = modifyId;
            }
        }

        switch (options.genre) {
            case "arrayMethod":
                target[options.methodName](...options.args);
                break;
            case "delete":
                delete target[options.key];
                break;
            default:
                target[options.key] = options.value;
                break;
        }

        if (modifyId) {
            // 删除临时记录数据
            delete target._entrendModifyId;
        }

        return this;
    },
    watch(expr, callback) {
        let arg1Type = getType(expr);
        if (/function/.test(arg1Type)) {
            callback = expr;
            expr = "_";
        }

        let watchType;

        if (expr == "_") {
            watchType = "watchOri";
        } else if (/\[.+\]/.test(expr)) {
            watchType = "seekOri";
        } else {
            watchType = "watchKey";
        }

        // 获取相应队列数据
        let tarExprObj = this[WATCHHOST][expr] || (this[WATCHHOST][expr] = {
            // 是否已经有nextTick
            isNextTick: 0,
            // 事件函数存放数组
            arr: [],
            // 空expr使用的数据
            modifys: [],
            // 注册的update事件函数
            // updateFunc
        });

        // 判断是否注册了update事件函数
        if (!tarExprObj.updateFunc) {
            this.on('update', tarExprObj.updateFunc = e => {
                // 如果是 _ 添加modify
                switch (watchType) {
                    case "watchOri":
                        tarExprObj.modifys.push(e.trend);
                        break;
                    case "watchKey":
                        let keyOne = e.keys[0];
                        isUndefined(keyOne) && (keyOne = e.modify.key);

                        if (keyOne != expr) {
                            return
                        }

                        if (!isUndefined(keyOne) && keyOne == expr) {
                            tarExprObj.modifys.push(e.trend);
                        }
                        break;
                }

                // 判断是否进入nextTick
                if (tarExprObj.isNextTick) {
                    return;
                }

                // 锁上
                tarExprObj.isNextTick = 1;

                nextTick(() => {
                    switch (watchType) {
                        case "watchOri":
                            // 监听整个数据
                            tarExprObj.arr.forEach(callback => {
                                callback.call(this, new WatchData({
                                    modifys: Array.from(tarExprObj.modifys)
                                }));
                            });
                            // 事后清空
                            tarExprObj.modifys.length = 0;
                            break;
                        case "watchKey":
                            tarExprObj.arr.forEach(callback => {
                                callback.call(this, new WatchData({
                                    expr,
                                    val: this[expr],
                                    modifys: Array.from(tarExprObj.modifys)
                                }));
                            });
                            // 事后清空
                            tarExprObj.modifys.length = 0;
                            break;
                        case "seekOri":
                            // 监听动态数据
                            // 带有expr的
                            let sData = this.seek(expr);
                            let {
                                oldVals
                            } = tarExprObj;

                            // 判断是否相等
                            let isEq = 1;
                            if (sData.length != oldVals.length) {
                                isEq = 0;
                            }
                            isEq && sData.some((e, i) => {
                                if (!isXDataEqual(oldVals[i], e)) {
                                    isEq = 0;
                                    return true;
                                }
                            });

                            // 不相等就触发callback
                            if (!isEq) {
                                tarExprObj.arr.forEach(callback => {
                                    callback.call(this, new WatchData({
                                        expr,
                                        old: oldVals,
                                        val: sData
                                    }));
                                });
                                tarExprObj.oldVals = sData;
                            }
                            break;
                    }

                    // 开放nextTick
                    tarExprObj.isNextTick = 0;
                });
            });
        }

        // 添加callback
        tarExprObj.arr.push(callback);

        // 判断是否expr
        if (watchType == "seekOri") {
            let sData = this.seek(expr);
            callback(new WatchData({
                expr,
                val: sData
            }));
            tarExprObj.oldVals = sData;
        }

        return this;
    },
    // 注销watch
    unwatch(expr, callback) {
        let arg1Type = getType(expr);
        if (/function/.test(arg1Type)) {
            callback = expr;
            expr = "_";
        }

        let tarExprObj = this[WATCHHOST][expr];

        if (tarExprObj) {
            let tarId = tarExprObj.arr.indexOf(callback);
            if (tarId > -1) {
                tarExprObj.arr.splice(tarId, 1);
            }

            // 判断arr是否清空，是的话回收update事件绑定
            if (!tarExprObj.arr.length) {
                this.off('update', tarExprObj.updateFunc);
                delete tarExprObj.updateFunc;
                delete this[WATCHHOST][expr];
            }
        }

        return this;
    },
    // 同步数据
    sync(xdataObj, options) {
        let optionsType = getType(options);

        let watchFunc, oppWatchFunc;

        switch (optionsType) {
            case "string":
                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        let keysOne = isUndefined(trend.keys[0]) ? trend.key : trend.keys[0];
                        if (keysOne == options) {
                            xdataObj.entrend(trend);
                        }
                    });
                });
                xdataObj.watch(oppWatchFunc = e => {
                    e.modifys.forEach(trend => {
                        let keysOne = isUndefined(trend.keys[0]) ? trend.key : trend.keys[0];
                        if (keysOne == options) {
                            this.entrend(trend);
                        }
                    });
                });
                break;
            case "array":
                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        let keysOne = isUndefined(trend.keys[0]) ? trend.key : trend.keys[0];
                        if (options.includes(keysOne)) {
                            xdataObj.entrend(trend);
                        }
                    });
                });
                xdataObj.watch(oppWatchFunc = e => {
                    e.modifys.forEach(trend => {
                        let keysOne = isUndefined(trend.keys[0]) ? trend.key : trend.keys[0];
                        if (options.includes(keysOne)) {
                            this.entrend(trend);
                        }
                    });
                });
                break;
            case "object":
                let resOptions = {};
                Object.keys(options).forEach(k => {
                    resOptions[options[k]] = k;
                });

                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        trend = cloneObject(trend);
                        let keysOne = trend.keys[0];

                        keysOne = isUndefined(keysOne) ? trend.key : keysOne;

                        if (options.hasOwnProperty(keysOne)) {
                            if (isUndefined(trend.keys[0])) {
                                trend.key = options[keysOne];
                            } else {
                                trend.keys[0] = options[keysOne];
                            }
                            xdataObj.entrend(trend);
                        }
                    });
                });

                xdataObj.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {

                        trend = cloneObject(trend);

                        let keysOne = trend.keys[0];

                        keysOne = isUndefined(keysOne) ? trend.key : keysOne;

                        if (resOptions.hasOwnProperty(keysOne)) {
                            if (isUndefined(trend.keys[0])) {
                                trend.key = resOptions[keysOne];
                            } else {
                                trend.keys[0] = resOptions[keysOne];
                            }
                            this.entrend(trend);
                        }
                    });
                });

                break;
            default:
                // undefined
                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        xdataObj.entrend(trend);
                    });
                });
                xdataObj.watch(oppWatchFunc = e => {
                    e.modifys.forEach(trend => {
                        this.entrend(trend);
                    });
                });
                break;
        }

        this[SYNCHOST].push({
            opp: xdataObj,
            oppWatchFunc,
            watchFunc
        });

        return this;
    },
    // 注销sync绑定
    unsync(xdataObj) {
        let tarIndex = this[SYNCHOST].findIndex(e => e.opp == xdataObj);
        if (tarIndex > -1) {
            let tarObj = this[SYNCHOST][tarIndex];

            // 注销watch事件
            this.unwatch(tarObj.watchFunc);
            tarObj.opp.unwatch(tarObj.oppWatchFunc);

            // 去除记录数据
            this[SYNCHOST].splice(tarIndex, 1);
        } else {
            console.warn("not found => ", xdataObj);
        }

        return this;
    },
    virData(options) {
        let cloneData = this.object;

        // 重置数据
        mapData(cloneData, options);

        // 提取关键数据
        let keyMapObj = {};
        let reserveKeyMapObj = {};
        options.forEach(c => {
            switch (c.type) {
                case "map":
                    keyMapObj[c.key] = c.toKey;
                    reserveKeyMapObj[c.toKey] = c.key;
                    break;
            }
        });

        // 转换为xdata
        cloneData = createXData(cloneData);

        let _thisUpdateFunc;
        this.on('update', _thisUpdateFunc = e => {
            let {
                trend
            } = e;

            let tarKey = keyMapObj[trend.key];
            if (!isUndefined(tarKey)) {
                // 修正trend数据
                trend.key = tarKey;
                cloneData.entrend(trend);
            }
        });

        cloneData.on('update', e => {
            let {
                trend
            } = e;

            let tarKey = reserveKeyMapObj[trend.key];

            if (!isUndefined(tarKey)) {
                trend.key = tarKey;
                this.entrend(trend);
            }
        });

        // 修正remove方法
        defineProperty(cloneData, "remove", {
            value(...args) {
                if (!args.length) {
                    // 确认删除自身，清除this的函数
                    this.off('update', _thisUpdateFunc);
                }
                XDataFn.remove.call(cloneData, ...args);
            }
        });

        return cloneData;
    },
    // 删除相应Key的值
    removeByKey(key) {
        // 删除子数据
        if (/\D/.test(key)) {
            // 非数字
            delete this[key];
        } else {
            // 纯数字，术语数组内元素，通过splice删除
            this.splice(parseInt(key), 1);
        }
    },
    // 删除值
    remove(value) {
        if (isUndefined(value)) {
            // 删除自身
            let {
                parent
            } = this;

            if (parent) {
                // 删除
                parent.removeByKey(this.hostkey);
            } else {
                clearXdata(this);
            }
        } else {
            if (isXData(value)) {
                (value.parent == this) && this.removeByKey(value.hostkey);
            } else {
                let tarId = this.indexOf(value);
                if (tarId > -1) {
                    this.removeByKey(tarId);
                }
            }
        }
    },
    clone() {
        return createXData(this.object);
    },
    // push的去重版本
    add(data) {
        !this.includes(data) && this.push(data);
    },
    reset(value) {
        let valueKeys = Object.keys(value);

        // 删除本身不存在的key
        Object.keys(this).forEach(k => {
            if (!valueKeys.includes(k) && k !== "length") {
                delete this[k];
            }
        });

        assign(this, value);
        return this;
    }
});


defineProperties(XDataFn, {
    // 直接返回object
    "object": {
        get() {
            let obj = {};

            Object.keys(this).forEach(k => {
                let val = this[k];

                if (isXData(val)) {
                    obj[k] = val.object;
                } else {
                    obj[k] = val;
                }
            });

            return obj;
        }
    },
    "string": {
        get() {
            return JSON.stringify(this.object);
        }
    },
    "root": {
        get() {
            let root = this;
            while (root.parent) {
                root = root.parent;
            }
            return root;
        }
    }
});

// 私有属性正则
const PRIREG = /^_.+|^parent$|^hostkey$|^status$|^length$/;

// handler
let XDataHandler = {
    set(xdata, key, value, receiver) {
        // 私有的变量直接通过
        if (PRIREG.test(key)) {
            return Reflect.set(xdata, key, value, receiver);
        }

        let newValue = value;

        // 判断是否属于xdata数据
        if (isXData(value)) {
            if (value.parent == receiver) {
                value.hostkey = key;
            } else {
                if (value.status !== "binding") {
                    value.status = 'binding';
                } else {
                    // 从原来的地方拿走，先从原处删除在安上
                    value.remove();
                }
                value.parent = receiver;
                value.hostkey = key;

                // 替换value为普通对象
                value = value.object;
            }
        } else {
            // 数据转换
            newValue = createXData(value, {
                parent: receiver,
                hostkey: key
            });
        }

        let oldVal = xdata[key];

        let reData;

        if (!xdata[RUNARRMETHOD]) {
            // 相同值就别瞎折腾了
            if (oldVal === newValue) {
                return true;
            }

            if (isXData(oldVal)) {
                if (isXData(newValue) && oldVal.string === newValue.string) {
                    // 同是object
                    return true;
                }
            }

            let mid = getModifyId(receiver);

            // 事件实例生成
            let eveObj = new XDataEvent('update', receiver);

            let isFirst;
            // 判断是否初次设置
            if (!xdata.hasOwnProperty(key)) {
                isFirst = 1;
            }

            // 添加修正数据
            eveObj.modify = {
                // change 改动
                // set 新增值
                genre: isFirst ? "set" : "change",
                key,
                value,
                oldVal,
                modifyId: mid
            };

            reData = Reflect.set(xdata, key, newValue, receiver)

            // 触发事件
            receiver.emit(eveObj);
        } else {
            reData = Reflect.set(xdata, key, newValue, receiver)
        }

        return reData;
    },
    deleteProperty(xdata, key) {
        // 私有的变量直接通过
        if (PRIREG.test(key)) {
            return Reflect.deleteProperty(xdata, key);
        }

        // 都不存在瞎折腾什么
        if (!xdata.hasOwnProperty(key)) {
            return true;
        }

        let receiver;

        if (xdata.parent) {
            receiver = xdata.parent[xdata.hostkey];
        } else {
            Object.values(xdata).some(e => {
                if (isXData(e)) {
                    receiver = e.parent;
                    return true;
                }
            });

            if (!receiver) {
                receiver = new Proxy(xdata, XDataHandler);
            }
        }

        let oldVal = xdata[key];

        let reData = Reflect.deleteProperty(xdata, key);

        if (isXData(oldVal)) {
            clearXdata(oldVal);
        }

        // 事件实例生成
        let eveObj = new XDataEvent('update', receiver);

        // 添加修正数据
        eveObj.modify = {
            // change 改动
            // set 新增值
            genre: "delete",
            key,
            oldVal
        };

        // 触发事件
        receiver.emit(eveObj);

        return reData;
    }
};

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

    // 可运行的方法
['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some'].forEach(methodName => {
    let oldFunc = Array.prototype[methodName];
    if (oldFunc) {
        setNotEnumer(XhearElementFn, {
            [methodName](...args) {
                return oldFunc.apply(Array.from(getContentEle(this.ele).children).map(e => createXHearElement(e)), args);
            }
        });
    }
});

// 通用splice方法
const xeSplice = (_this, index, howmany, ...items) => {
    let {
        _entrendModifyId
    } = _this;

    if (_entrendModifyId) {
        // 拿到数据立刻删除
        delete _this._entrendModifyId;
    } else {
        _entrendModifyId = getRandomId();

        readyClearModifyId(_this, _entrendModifyId);
    }

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

    // 事件实例生成
    let eveObj = new XDataEvent('update', _this);

    shadowId && (eveObj.shadow = shadowId);

    eveObj.modify = {
        genre: "arrayMethod",
        methodName: "splice",
        args: [index, howmany, ...items],
        modifyId: _entrendModifyId
    };

    _this.emit(eveObj);

    return reArr;
}

setNotEnumer(XhearElementFn, {
    splice(...args) {
        let rarr = xeSplice(this, ...args);
        return rarr;
    },
    unshift(...items) {
        xeSplice(this, 0, 0, ...items);
        return this.length;
    },
    push(...items) {
        xeSplice(this, this.length, 0, ...items);
        return this.length;
    },
    shift() {
        let rarr = xeSplice(this, 0, 1, ...args);
        return rarr;
    },
    pop() {
        let rarr = xeSplice(this, this.length - 1, 1, ...args);
        return rarr;
    },
    sort(sFunc) {
        // 获取改动id
        let {
            _entrendModifyId
        } = this;

        if (_entrendModifyId) {
            // 拿到数据立刻删除
            delete this._entrendModifyId;
        } else {
            _entrendModifyId = getRandomId();
            readyClearModifyId(this, _entrendModifyId);
        }

        let contentEle = getContentEle(this.ele);

        let args;
        if (sFunc instanceof Array) {
            args = [sFunc];

            // 先做备份
            let backupChilds = Array.from(contentEle.children);

            // 修正顺序
            sFunc.forEach(eid => {
                contentEle.appendChild(backupChilds[eid]);
            });
        } else {
            // 新生成数组
            let arr = Array.from(contentEle.children).map(e => createXHearElement(e));
            let backupArr = Array.from(arr);

            // 执行排序函数
            arr.sort(sFunc);

            // 记录顺序
            let ids = [];

            arr.forEach(e => {
                ids.push(backupArr.indexOf(e));
            });

            // 修正新顺序
            arr.forEach(e => {
                contentEle.appendChild(e.ele);
            });

            args = [ids];
        }

        // 事件实例生成
        let eveObj = new XDataEvent('update', this);

        eveObj.modify = {
            genre: "arrayMethod",
            methodName: "sort",
            args,
            modifyId: _entrendModifyId
        };

        this.emit(eveObj);
        return this;
    },
    reverse() {
        let contentEle = getContentEle(this.ele);
        let childs = Array.from(contentEle.children).reverse();
        childs.forEach(e => {
            contentEle.appendChild(e);
        });
        return this;
    },
    indexOf(d) {
        if (d instanceof XhearElement) {
            d = d.ele;
        }
        return Array.from(getContentEle(this.ele).children).indexOf(d);
    },
    includes(d) {
        return this.indexOf(d) > -1;
    }
});

    // 模拟类jQuery的方法
setNotEnumer(XhearElementFn, {
    before(data) {
        if (/\D/.test(this.hostkey)) {
            console.error(`can't use before in this data =>`, this, data);
            throw "";
        }
        xeSplice(this.parent, this.hostkey, 0, data);
        return this;
    },
    after(data) {
        if (/\D/.test(this.hostkey)) {
            console.error(`can't use after in this data =>`, this, data);
            throw "";
        }
        xeSplice(this.parent, this.hostkey + 1, 0, data);
        return this;
    },
    siblings(expr) {
        // 获取父层的所有子元素
        let parChilds = Array.from(this.ele.parentElement.children);

        // 删除自身
        let tarId = parChilds.indexOf(this.ele);
        parChilds.splice(tarId, 1);

        // 删除不符合规定的
        if (expr) {
            parChilds = parChilds.filter(e => {
                if (meetsEle(e, expr)) {
                    return true;
                }
            });
        }

        return parChilds.map(e => createXHearElement(e));
    },
    remove() {
        if (/\D/.test(this.hostkey)) {
            console.error(`can't delete this key => ${this.hostkey}`, this, data);
            throw "";
        }
        xeSplice(this.parent, this.hostkey, 1);
    },
    empty() {
        // this.html = "";
        this.splice(0, this.length);
        return this;
    },
    parents(expr) {
        let pars = [];
        let tempTar = this.parent;

        if (!expr) {
            while (tempTar && tempTar.tag != "html") {
                pars.push(tempTar);
                tempTar = tempTar.parent;
            }
        } else {
            if (getType(expr) == "string") {
                while (tempTar && tempTar.tag != "html") {
                    if (meetsEle(tempTar.ele, expr)) {
                        pars.push(tempTar);
                    }
                    tempTar = tempTar.parent;
                }
            } else {
                if (expr instanceof XhearElement) {
                    expr = expr.ele;
                }

                // 从属 element
                if (expr instanceof Element) {
                    while (tempTar && tempTar.tag != "html") {
                        if (tempTar.ele == expr) {
                            return true;
                        }
                        tempTar = tempTar.parent;
                    }
                }

                return false;
            }
        }

        return pars;
    },
    parentsUntil(expr) {
        if (expr) {
            let tempTar = this.parent;
            while (tempTar && tempTar.tag != "html") {
                if (meetsEle(tempTar.ele, expr)) {
                    return tempTar;
                }
                tempTar = tempTar.parent;
            }
        }
    },
    attr(key, value) {
        if (!isUndefined(value)) {
            if (this.xvRender) {
                let regTagData = regDatabase.get(this.tag);
                if (regTagData.attrs.includes(key)) {
                    this[key] = value;
                }
            }
            this.ele.setAttribute(key, value);
        } else if (key instanceof Object) {
            Object.keys(key).forEach(k => {
                this.attr(k, key[k]);
            });
        } else {
            return this.ele.getAttribute(key);
        }
    },
    removeAttr(key) {
        this.ele.removeAttribute(key);
        return this;
    },
    is(expr) {
        return meetsEle(this.ele, expr)
    },
    // like jQuery function find
    que(expr) {
        return $.que(expr, this.ele);
    },
    queAll(expr) {
        return $.queAll(expr, this.ele);
    }
});

defineProperties(XhearElementFn, {
    display: {
        get() {
            return getComputedStyle(this.ele)['display'];
        },
        set(val) {
            this.ele.style['display'] = val;
        }
    },
    text: {
        get() {
            return getContentEle(this.ele).textContent;
        },
        set(d) {
            getContentEle(this.ele).textContent = d;
        }
    },
    html: {
        get() {
            return getContentEle(this.ele).innerHTML;
        },
        set(d) {
            getContentEle(this.ele).innerHTML = d;
        }
    },
    style: {
        get() {
            return this.ele.style;
        },
        set(d) {
            let {
                style
            } = this;

            // 覆盖旧的样式
            let hasKeys = Array.from(style);
            let nextKeys = Object.keys(d);

            // 清空不用设置的key
            hasKeys.forEach(k => {
                if (!nextKeys.includes(k)) {
                    style[k] = "";
                }
            });

            assign(style, d);
        }
    },
    position: {
        get() {
            return {
                top: this.ele.offsetTop,
                left: this.ele.offsetLeft
            };
        }
    },
    offset: {
        get() {
            let reobj = {
                top: 0,
                left: 0
            };

            let tar = this.ele;
            while (tar && tar !== document) {
                reobj.top += tar.offsetTop;
                reobj.left += tar.offsetLeft;
                tar = tar.offsetParent
            }
            return reobj;
        }
    },
    width: {
        get() {
            return parseInt(getComputedStyle(this.ele).width);
        }
    },
    height: {
        get() {
            return parseInt(getComputedStyle(this.ele).height);
        }
    },
    innerWidth: {
        get() {
            return this.ele.clientWidth;
        }
    },
    innerHeight: {
        get() {
            return this.ele.clientHeight;
        }
    },
    offsetWidth: {
        get() {
            return this.ele.offsetWidth;
        }
    },
    offsetHeight: {
        get() {
            return this.ele.offsetHeight;
        }
    },
    outerWidth: {
        get() {
            let tarSty = getComputedStyle(this.ele);
            return this.ele.offsetWidth + parseInt(tarSty['margin-left']) + parseInt(tarSty['margin-right']);
        }
    },
    outerHeight: {
        get() {
            let tarSty = getComputedStyle(this.ele);
            return this.ele.offsetHeight + parseInt(tarSty['margin-top']) + parseInt(tarSty['margin-bottom']);
        }
    }
});

    // 元素自定义组件id计数器
let renderEleId = 100;

const renderEle = (ele) => {
    // 获取目标数据
    let tdb = regDatabase.get(ele.tagName.toLowerCase());

    if (!tdb) {
        console.warn('not register tag ' + ele.tagName.toLowerCase());
        return;
    }

    // 判断没有渲染
    if (ele.xvRender) {
        return;
    }

    // 将内容元素拿出来先
    let childs = Array.from(ele.childNodes);

    // 填充代码
    ele.innerHTML = tdb.temp;

    // 生成renderId
    let renderId = renderEleId++;

    // 初始化元素
    let xhearEle = createXHearElement(ele);
    let xhearData = ele[XHEARDATA];

    // 合并 proto 的函数
    let {
        proto
    } = tdb;
    if (proto) {
        Object.keys(proto).forEach(k => {
            defineProperty(xhearData, k, {
                value: proto[k]
            });
        });
    }

    // 全部设置 shadow id
    Array.from(ele.querySelectorAll("*")).forEach(ele => ele.setAttribute('xv-shadow', renderId));

    // 渲染依赖sx-ele，
    // 让ele使用渲染完成的内元素
    Array.from(ele.querySelectorAll(`[xv-ele][xv-shadow="${renderId}"]`)).forEach(ele => renderEle(ele));

    // 渲染完成，设置renderID
    ele.removeAttribute('xv-ele');
    ele.setAttribute('xv-render', renderId);
    defineProperty(xhearData, 'xvRender', {
        value: ele.xvRender = renderId
    });

    // 获取 xv-content
    let contentEle = ele.querySelector(`[xv-content][xv-shadow="${renderId}"]`);

    // 判断是否有$content
    if (contentEle) {
        // 设置renderId
        contentEle.xvContent = renderId;

        // 初始化一次
        createXHearElement(contentEle);

        defineProperty(xhearData, '$content', {
            get() {
                return createXHearElement(contentEle);
            }
        });

        defineProperty(contentEle[XHEARDATA], "$host", {
            get() {
                return createXHearElement(ele);
            }
        });

        // 重新修正contentEle
        // contentEle = getContentEle(ele);
        while (contentEle.xvRender) {
            let content = contentEle[XHEARDATA].$content;
            content && (contentEle = content.ele);
        }

        // 将原来的东西塞回去
        childs.forEach(ele => {
            contentEle.appendChild(ele);
        });
    } else {
        // 将原来的东西塞回去
        childs.forEach(e => {
            ele.appendChild(e);
        });
    }

    // 设置其他 xv-tar
    Array.from(ele.querySelectorAll(`[xv-tar][xv-shadow="${renderId}"]`)).forEach(ele => {
        let tarKey = ele.getAttribute('xv-tar');
        defineProperty(xhearData, "$" + tarKey, {
            get() {
                return createXHearElement(ele);
            }
        });
    });

    // 转换 xv-span 元素
    Array.from(ele.querySelectorAll(`xv-span[xv-shadow="${renderId}"]`)).forEach(e => {
        // 替换xv-span
        var textnode = document.createTextNode("");
        e.parentNode.insertBefore(textnode, e);
        e.parentNode.removeChild(e);

        // 文本数据绑定
        var xvkey = e.getAttribute('xvkey');

        // 先设置值，后监听
        // let val = xhearData[xvkey];
        // !isUndefined(val) && (textnode.textContent = val);
        xhearEle.watch(xvkey, e => {
            let val = xhearData[xvkey];
            textnode.textContent = val;
        });
    });

    // 绑定xv-module
    Array.from(ele.querySelectorAll(`[xv-module][xv-shadow="${renderId}"]`)).forEach(mEle => {
        // 获取module名并设置监听
        let mKey = mEle.getAttribute('xv-module');

        // 事件回调函数
        let cFun = e => {
            xhearEle[mKey] = mEle.value;
        }
        // 判断是否xvRender的元素
        if (mEle.xvRender) {
            let sEle = createXHearElement(mEle);
            sEle.watch('value', cFun);
        } else {
            mEle.addEventListener('change', cFun);
            mEle.addEventListener('input', cFun);
        }

        // 反向绑定
        xhearEle.watch(mKey, e => {
            mEle.value = xhearEle[mKey];
        });
    });

    // watch事件绑定
    let watchMap = tdb.watch;
    Object.keys(watchMap).forEach(kName => {
        xhearEle.watch(kName, watchMap[kName]);
    });

    // 要设置的数据
    let rData = assign({}, tdb.data);

    // attrs 上的数据
    tdb.attrs.forEach(attrName => {
        // 获取属性值并设置
        let attrVal = ele.getAttribute(attrName);
        if (!isUndefined(attrVal) && attrVal != null) {
            rData[attrName] = attrVal;
        }

        // 绑定值
        xhearEle.watch(attrName, d => {
            // 绑定值
            ele.setAttribute(attrName, d.val);
        });
    });

    // props 上的数据
    tdb.props.forEach(attrName => {
        let attrVal = ele.getAttribute(attrName);
        (!isUndefined(attrVal) && attrVal != null) && (rData[attrName] = attrVal);
    });


    // 添加_exkey
    let exkeys = Object.keys(rData);
    defineProperty(xhearData, EXKEYS, {
        value: exkeys
    });
    exkeys.push(...Object.keys(watchMap));

    // 合并数据后设置
    exkeys.forEach(k => {
        let val = rData[k];

        if (val instanceof Object) {
            val = cloneObject(val);
            // 数据转换
            val = createXData(val, {
                parent: xhearEle,
                hostkey: k
            });
        }

        if (!isUndefined(val)) {
            xhearEle[k] = val;
        }
    });

    // 设置 value key
    if (exkeys.includes('value')) {
        // 设置value取值
        defineProperty(ele, 'value', {
            get() {
                return xhearEle.value;
            },
            set(d) {
                xhearEle.value = d;
            }
        });
    }

    // 执行inited 函数
    tdb.inited && tdb.inited.call(xhearEle);

    if (tdb.attached && !ele[ATTACHED] && ele.getRootNode() === document) {
        // tdb.attached.call(xhearEle);
        // attached 和 detached 不用内部的 xhearEle
        tdb.attached.call(createXHearElement(ele));
        ele[ATTACHED] = 1;
    }
}

const register = (options) => {
    let defaults = {
        // 自定义标签名
        tag: "",
        // 正文内容字符串
        temp: "",
        // 属性绑定keys
        attrs: [],
        props: [],
        // 默认数据
        data: {},
        // 直接监听属性变动对象
        watch: {},
        // render tag 映射
        // renderMap:{},
        // 原型链上的方法
        // proto: {},
        // 初始化完成后触发的事件
        // inited() {},
        // 添加进document执行的callback
        // attached() {},
        // 删除后执行的callback
        // detached() {}
    };
    assign(defaults, options);

    // 复制数据
    defaults.attrs = defaults.attrs.slice();
    defaults.props = defaults.props.slice();
    defaults.data = cloneObject(defaults.data);
    defaults.watch = assign({}, defaults.watch);

    // 确定没有关键key
    let allKeys = new Set([...defaults.attrs, ...defaults.props, ...Object.keys(defaults.data)]);
    importantKeys.forEach(k => {
        if (allKeys.has(k)) {
            console.error(`Register illegal key => ${k}`, options);
            throw "";
        }
    });

    if (defaults.temp) {
        let {
            temp
        } = defaults;

        // 判断temp有内容的话，就必须带上 xv-content
        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = temp;

        let xvcontent = tempDiv.querySelector('[xv-content]');
        if (!xvcontent) {
            throw defaults.tag + " need container!";
        }

        // 去除无用的代码（注释代码）
        temp = temp.replace(/<!--.+?-->/g, "");

        //准换自定义字符串数据
        var textDataArr = temp.match(/{{.+?}}/g);
        textDataArr && textDataArr.forEach((e) => {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                temp = temp.replace(e, `<xv-span xvkey="${key[1].trim()}"></xv-span>`);
            }
        });

        defaults.temp = temp;
    }

    // 判断是否有attached 或者 detached，有的话初始 全局dom监听事件
    if (defaults.attached || defaults.detached) {
        initDomObserver();
    }

    // 设置映射tag数据
    regDatabase.set(defaults.tag, defaults);

    // 尝试查找页面存在的元素
    Array.from(document.querySelectorAll(defaults.tag + '[xv-ele]')).forEach(e => {
        renderEle(e);
    });
}

// 初始化全局监听dom事件
let isInitDomObserve = 0;
const initDomObserver = () => {
    if (isInitDomObserve) {
        return;
    }
    isInitDomObserve = 1;

    // attached detached 监听
    let observer = new MutationObserver((mutations) => {
        mutations.forEach((e) => {
            let {
                addedNodes,
                removedNodes
            } = e;


            // 监听新增元素
            addedNodes && tachedArrFunc(Array.from(addedNodes), "attached", ATTACHED);

            // 监听去除元素
            removedNodes && tachedArrFunc(Array.from(removedNodes), "detached", DETACHED);
        });
    });
    observer.observe(document.body, {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true,
    });
}

const tachedArrFunc = (arr, tachedFunName, tachedKey) => {
    arr.forEach(ele => {
        if (ele.xvRender) {
            attachedFun(ele, tachedFunName, tachedKey);
        }

        if (ele instanceof Element) {
            // 触发已渲染的attached
            arr.forEach(e => {
                attachedFun(ele, tachedFunName, tachedKey);
            });
        }
    });
}

const attachedFun = (ele, tachedFunName, tachedKey) => {
    if (!ele.xvRender || ele[tachedKey]) {
        return;
    }
    let tagdata = regDatabase.get(ele.tagName.toLowerCase());
    if (tagdata[tachedFunName]) {
        tagdata[tachedFunName].call(ele, createXHearElement(ele));
        ele[tachedKey] = 1;
    }
}

    // 全局用$
    let $ = (expr) => {
        if (expr instanceof XhearElement) {
            return expr;
        }

        let tar = expr;

        if (getType(expr) === "string" && expr.search("<") === -1) {
            tar = document.querySelector(expr);
        }

        return parseToXHearElement(tar);
    }

    // init 
    glo.$ = $;
    assign($, {
        fn: XhearElementFn,
        type: getType,
        init: createXHearElement,
        que: (expr, root = document) => createXHearElement(root.querySelector(expr)),
        queAll: (expr, root = document) => Array.from(root.querySelectorAll(expr)).map(e => createXHearElement(e)),
        xdata: createXData,
        register
    });

    // 初始化控件
    nextTick(() => {
        Array.from(document.querySelectorAll('[xv-ele]')).forEach(e => {
            renderEle(e);
        });
    });

    // 添加默认样式
    let mStyle = document.createElement('style');
    mStyle.innerHTML = "[xv-ele]{display:none;}";
    document.head.appendChild(mStyle);

})(window);