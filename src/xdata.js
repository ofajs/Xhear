

// common
// 事件寄宿对象key
const EVES = Symbol("xEves");
// 是否在数组方法执行中key
const RUNARRMETHOD = Symbol("runArrMethod");
// 存放modifyId的寄宿对象key
const MODIFYIDHOST = Symbol("modifyHost");
// modifyId打扫器寄存变量
const MODIFYTIMER = Symbol("modifyTimer");
// watch寄宿对象
const WATCHHOST = Symbol("watchHost");
// 同步数据寄宿对象key
const SYNCHOST = Symbol("syncHost");

// business function
let isXData = obj => obj instanceof XData;

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

// 清除xdata的方法
let clearXData = (xdata) => {
    if (!isXData(xdata)) {
        return;
    }
    // 干掉parent
    if (xdata.parent) {
        xdata.parent = null;
    }
    // 改变状态
    xdata.status = "destory";
    // 去掉hostkey
    xdata.hostkey = null;

    // 开始清扫所有绑定
    // 先清扫 sync
    for (let d of xdata[SYNCHOST].keys()) {
        xdata.unsync(d);
    }

    // 清扫 watch
    xdata[WATCHHOST].clear();

    // 清扫 on
    xdata[EVES].clear();

    xdata[MODIFYIDHOST].clear();
}

// virData用的数据映射方法
const mapData = (data, options) => {
    if (!(data instanceof Object)) {
        return data;
    }

    let {
        key,
        type,
        mapping
    } = options;

    switch (type) {
        case "mapKey":
            Object.keys(data).forEach(k => {
                let val = data[k];
                if (mapping[k]) {
                    data[mapping[k]] = val;
                    delete data[k];
                }
                switch (getType(val)) {
                    case "object":
                        mapData(val, options);
                        break;
                }
            });
            break;
        case "mapValue":
            Object.keys(data).forEach(k => {
                let val = data[k];
                if (k == key && mapping[val]) {
                    data[key] = mapping[val];
                }
                switch (getType(val)) {
                    case "object":
                        mapData(val, options);
                        break;
                }
            });
            break
    }
}

    function XData(obj, options = {}) {
    let proxyThis = new Proxy(this, XDataHandler);
    // let proxyThis = this;

    // 数组的长度
    let length = 0;

    // 数据合并
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
        // [EVES]: new Map(),
        // modifyId存放寄宿对象
        // [MODIFYIDHOST]: new Set(),
        // modifyId清理器的断定变量
        // [MODIFYTIMER]: 0,
        // watch寄宿对象
        // [WATCHHOST]: new Map(),
        // 同步数据寄宿对象
        // [SYNCHOST]: new Map()
    };

    // 设置不可枚举数据
    setNotEnumer(this, opt);

    // 设置专属值
    defineProperties(this, {
        [EVES]: {
            value: new Map()
        },
        [MODIFYIDHOST]: {
            value: new Set()
        },
        [WATCHHOST]: {
            value: new Map()
        },
        [SYNCHOST]: {
            value: new Map()
        },
        [MODIFYTIMER]: {
            writable: true,
            value: 0
        },
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

    return proxyThis;
}

let XDataFn = XData.prototype = {};

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

            // 设置fromKey
            defineProperties(reobj, {
                "oldVal": {
                    value: modify.oldVal
                },
                "fromKey": {
                    get() {
                        let fromKey = this.keys[0];
                        return isUndefined(fromKey) ? modify.key : fromKey;
                    },
                    enumerable: true
                }
            });

            switch (modify.genre) {
                case "arrayMethod":
                    var {
                        methodName,
                        args,
                        modifyId,
                        returnValue
                    } = modify;

                    // 修正args，将XData还原成object对象
                    args = args.map(e => {
                        if (isXData(e)) {
                            return e.object;
                        }
                        return e;
                    });

                    assign(reobj, {
                        methodName,
                        args,
                        modifyId
                    });

                    defineProperties(reobj, {
                        "returnValue": {
                            get() {
                                return returnValue instanceof Object ? cloneObject(returnValue) : returnValue;
                            }
                        }
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

            return Object.freeze(reobj);
        }
    }
});

    // 获取事件数组
const getEvesArr = (tar, eventName) => {
    let eves = tar[EVES];
    let tarSetter = eves.get(eventName);

    if (!tarSetter) {
        tarSetter = new Set();
        eves.set(eventName, tarSetter);
    }

    return tarSetter;
};

setNotEnumer(XDataFn, {
    // 事件注册
    on(eventName, callback, data) {
        let count;
        // 判断是否对象传入
        if (getType(eventName) == "object") {
            let eveONObj = eventName;
            eventName = eveONObj.event;
            callback = eveONObj.callback;
            data = eveONObj.data;
            count = eveONObj.count;
        }

        // 设置数量
        (isUndefined(count)) && (count = Infinity);

        // 分解id参数
        let spIdArr = eventName.split('#');
        let eventId;
        if (1 in spIdArr) {
            eventId = spIdArr[1];
            eventName = spIdArr[0];
        }

        // 获取事件寄宿对象
        let eves = getEvesArr(this, eventName);

        if (!isUndefined(eventId)) {
            // 判断是否存在过这个id的事件注册过
            // 注册过这个id的把旧的删除
            Array.from(eves).some((opt) => {
                // 想等值得删除
                if (opt.eventId === eventId) {
                    eves.delete(opt);
                    return true;
                }
            });
        }

        // 事件数据记录
        callback && eves.add({
            eventName,
            callback,
            data,
            eventId,
            count
        });

        return this;
    },
    // 注册触发一次的事件
    one(eventName, callback, data) {
        if (getType(eventName) == "object") {
            eventName.count = 1;
            this.on(eventName);
        } else {
            this.on({
                event: eventName,
                callback,
                data,
                count: 1
            });
        }
        return this;
    },
    off(eventName, callback) {
        // 判断是否对象传入
        if (getType(eventName) == "object") {
            let eveONObj = eventName;
            eventName = eveONObj.event;
            callback = eveONObj.callback;
        }
        let eves = getEvesArr(this, eventName);
        Array.from(eves).some((opt) => {
            // 想等值得删除
            if (opt.callback === callback) {
                eves.delete(opt);
                return true;
            }
        });
        return this;
    },
    emit(eventName, emitData) {
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

        // 修正currentTarget
        eventObj.currentTarget = this;

        // 获取事件队列数组
        eves = getEvesArr(this, eventName);

        // 事件数组触发
        Array.from(eves).some((opt) => {
            // 触发callback
            // 如果cancel就不执行了
            if (eventObj.cancel) {
                return true;
            }

            // 根据count运行函数
            // 为插件行为提供一个暂停运行的方式
            // 添加数据
            let args = [eventObj];
            !isUndefined(opt.data) && (eventObj.data = opt.data);
            !isUndefined(opt.eventId) && (eventObj.eventId = opt.eventId);
            eventObj.count = opt.count;
            !isUndefined(emitData) && (args.push(emitData));

            // 添加事件插件机制
            let isRun = !opt.before ? 1 : opt.before({
                self: this,
                event: eventObj,
                emitData
            });

            isRun && opt.callback.apply(this, args);

            // 添加事件插件机制
            opt.after && opt.after({
                self: this,
                event: eventObj,
                emitData
            });

            // 删除多余数据
            delete eventObj.data;
            delete eventObj.eventId;
            delete eventObj.count;

            // 递减
            opt.count--;

            if (opt.count <= 0) {
                eves.delete(opt);
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
    }
});

    // 主体entrend方法
const entrend = (options) => {
    let {
        target,
        key,
        value,
        receiver,
        modifyId,
        genre
    } = options;

    // 判断modifyId
    if (!modifyId) {
        // 生成随机modifyId
        modifyId = getRandomId();
    } else {
        // 查看是否已经存在这个modifyId了，存在就不折腾
        if (receiver[MODIFYIDHOST].has(modifyId)) {
            return true;
        };
    }

    // 自身添加modifyId
    receiver[MODIFYIDHOST].add(modifyId);

    // 准备打扫函数
    clearModifyIdHost(receiver);

    // 返回的数据
    let reData = true;

    // 事件实例生成
    let eveObj = new XDataEvent('update', receiver);

    switch (genre) {
        case "handleSet":
            // 获取旧的值
            var oldVal = target[key];

            // 如果相等的话，就不要折腾了
            if (oldVal === value) {
                return true;
            }

            // 如果value是XData就删除原来的数据，自己变成普通对象
            if (isXData(value)) {
                let valueObject = value.object;
                value.remove();
                value = valueObject
            }

            let isFirst;
            // 判断是否初次设置
            if (!target.hasOwnProperty(key)) {
                isFirst = 1;
            }

            // 设置值
            target[key] = createXData(value, {
                parent: receiver,
                hostkey: key
            });

            // 添加修正数据
            eveObj.modify = {
                // change 改动
                // set 新增值
                genre: isFirst ? "new" : "change",
                key,
                value,
                oldVal,
                modifyId
            };
            break;
        case "handleDelete":
            // 没有值也不折腾了
            if (!target.hasOwnProperty(key)) {
                return true;
            }

            // 获取旧的值
            var oldVal = target[key];

            // 删除值
            delete target[key];

            // 清理数据
            clearXData(oldVal);

            // 添加修正数据
            eveObj.modify = {
                // change 改动
                // set 新增值
                genre: "delete",
                key,
                oldVal,
                modifyId
            };
            break;
        case "arrayMethod":
            let {
                methodName,
                args
            } = options;

            // 根据方法对新添加参数修正
            switch (methodName) {
                case "splice":
                case "push":
                case "unshift":
                    args = args.map(e => {
                        if (isXData(e)) {
                            // 是xdata的话，干掉原来的数据
                            if (!e.parent) {
                                return e;
                            }
                            let eObj = e.object;
                            e.remove();
                            e = eObj;
                        }
                        return createXData(e);
                    });
            }

            // 设置不可执行setHandler
            receiver[RUNARRMETHOD] = 1;

            // 对sort方法要特殊处理，已应对sort函数参数的问题
            if (methodName == "sort" && !(args[0] instanceof Array)) {
                // 备份
                let backupTarget = receiver.slice();

                // 运行方法
                reData = arrayFn[methodName].apply(receiver, args);
                let backupReData = reData.slice();

                // 转换成数组
                let newArg0 = [],
                    putId = getRandomId();
                backupTarget.forEach(e => {
                    // 查找id
                    let id = backupReData.indexOf(e);

                    // 清空相应的数组内数据
                    backupReData[id] = putId;

                    // 加入新数组
                    newArg0.push(id);
                });

                // 修正参数
                args = [newArg0];
            } else {
                // 运行方法
                reData = arrayFn[methodName].apply(receiver, args);
            }

            // 复原状态
            delete receiver[RUNARRMETHOD];

            // 根据方法是否清除返回的数据
            switch (methodName) {
                case "splice":
                case "pop":
                case "shift":
                    // 清理被裁剪的数据
                    reData.forEach(e => {
                        clearXData(e);
                    });
                    break;
            }

            // 添加修正数据
            eveObj.modify = {
                genre: "arrayMethod",
                methodName,
                modifyId,
                args,
                returnValue: reData
            };

            break;
    }

    receiver.emit(eveObj);

    return reData;
}

// 清理modifyIdHost的方法，每次清理一半，少于2个就一口气清理
const clearModifyIdHost = (xdata) => {
    // 判断是否开始打扫了
    if (xdata[MODIFYTIMER]) {
        return;
    }

    // 琐起清洁器
    xdata[MODIFYTIMER] = 1;

    let clearFunc = () => {
        // 获取存量长度
        let {
            size
        } = xdata[MODIFYIDHOST];

        if (size > 10) {
            // 清理一半数量，从新跑回去清理函数
            let halfSzie = Math.floor(size / 2);

            // 清理一半数量的modifyId
            xdata[MODIFYIDHOST].forEach((e, i) => {
                if (i < halfSzie) {
                    xdata[MODIFYIDHOST].delete(e);
                }
            });

            // 计时递归
            setTimeout(clearFunc, 3000);
        } else {
            // 小于两个就清理掉啦
            // 改成小于10个就不理了
            // xdata[MODIFYIDHOST].clear();
            // 解锁
            xdata[MODIFYTIMER] = 0;
            // 清理函数
            clearFunc = null;
        }
    }

    setTimeout(clearFunc, 10000);
}

    // 数组通用方法
// 可运行的方法
['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'includes', 'join'].forEach(methodName => {
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

// 设置 ArrayFn
const arrayFn = {};

// 几个会改变数据结构的方法
['pop', 'push', 'reverse', 'splice', 'shift', 'unshift', 'sort'].forEach(methodName => {
    // 原来的数组方法
    let arrayFnFunc = Array.prototype[methodName];

    arrayFn[methodName] = arrayFnFunc;

    // 存在方法的情况下加入
    if (arrayFnFunc) {
        defineProperty(XDataFn, methodName, {
            writable: true,
            value(...args) {
                // 获取到_entrendModifyId就立刻删除
                let modifyId = this._entrendModifyId;
                if (modifyId) {
                    delete this._entrendModifyId;
                }

                // 其他方式就要通过主体entrend调整
                return entrend({
                    genre: "arrayMethod",
                    args,
                    methodName,
                    modifyId,
                    receiver: this
                });
            }
        });
    }
});

assign(arrayFn, {
    // 改良的sort方法，可以直接传入置换顺序对象
    sort(func) {
        if (func instanceof Array) {
            let backupThis = this.slice();

            func.forEach((k, i) => {
                this[k] = backupThis[i];
            });

            return this;
        } else {
            // 参数和原生sort无区别，直接代入
            return Array.prototype.sort.call(this, func);
        }
    }
});

    // 私有属性正则
const PRIREG = /^_.+|^parent$|^hostkey$|^status$|^length$/;
let XDataHandler = {
    set(target, key, value, receiver) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (typeof key === "symbol" || PRIREG.test(key)) {
            return Reflect.set(target, key, value, receiver);
        }

        // 数组内组合，修改hostkey和parent
        if (target.hasOwnProperty(RUNARRMETHOD)) {
            if (isXData(value)) {
                value.parent = receiver;
                value.hostkey = key;
                value.status = "binding";
            }
            return Reflect.set(target, key, value, receiver);
        }

        // 获取到_entrendModifyId就立刻删除
        let modifyId = target._entrendModifyId;
        if (modifyId) {
            delete target._entrendModifyId;
        }

        // 其他方式就要通过主体entrend调整
        return entrend({
            genre: "handleSet",
            modifyId,
            target,
            key,
            value,
            receiver
        });
    },
    deleteProperty(target, key) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (typeof key === "symbol" || /^_.+/.test(key) || target.hasOwnProperty(RUNARRMETHOD)) {
            return Reflect.deleteProperty(target, key);
        }

        // 获取到_entrendModifyId就立刻删除
        let modifyId = target._entrendModifyId;
        if (modifyId) {
            delete target._entrendModifyId;
        }

        // 获取receiver
        let receiver;

        if (target.parent) {
            receiver = target.parent[target.hostkey];
        } else {
            Object.values(target).some(e => {
                if (isXData(e)) {
                    receiver = e.parent;
                    return true;
                }
            });

            if (!receiver) {
                receiver = new Proxy(target, XDataHandler);
            }
        }

        return entrend({
            genre: "handleDelete",
            modifyId,
            target,
            key,
            receiver
        });
    }
};

    setNotEnumer(XDataFn, {
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
    watch(expr, callback, arg3) {
        // 调整参数
        let arg1Type = getType(expr);
        if (arg1Type === "object") {
            Object.keys(expr).forEach(k => {
                this.watch(k, expr[k]);
            });
            return;
        } else if (/function/.test(arg1Type)) {
            callback = expr;
            expr = "";
        }

        // 根据参数调整类型
        let watchType;

        if (expr == "") {
            watchType = "watchOri";
        } else if (/\[.+\]/.test(expr)) {
            watchType = "seekOri";
        } else {
            watchType = "watchKey";
        }

        // 获取相应队列数据
        let tarExprObj = this[WATCHHOST].get(expr);
        if (!tarExprObj) {
            tarExprObj = new Set();

            this[WATCHHOST].set(expr, tarExprObj);
        }

        // 要保存的对象数据
        let saveObj = {
            modifys: [],
            isNextTick: 0,
            callback,
            // updateFunc
        };

        // 添加保存对象
        tarExprObj.add(saveObj);

        // 更新函数
        let updateFunc;

        // 根据类型调整
        switch (watchType) {
            case "watchOri":
                this.on('update', updateFunc = (e) => {
                    // 添加trend数据
                    saveObj.modifys.push(e.trend);

                    // 判断是否进入nextTick
                    if (saveObj.isNextTick) {
                        return;
                    }

                    // 锁上
                    saveObj.isNextTick = 1;

                    nextTick(() => {
                        // 监听整个数据
                        saveObj.callback.call(this, {
                            modifys: Array.from(saveObj.modifys)
                        });

                        // 事后清空modifys
                        saveObj.modifys.length = 0;

                        // 解锁
                        saveObj.isNextTick = 0;
                    });
                });
                break;
            case "watchKey":
                this.on('update', updateFunc = e => {
                    let {
                        trend
                    } = e;

                    if (trend.fromKey != expr) {
                        return;
                    }

                    // 添加改动
                    saveObj.modifys.push(trend);

                    // 判断是否进入nextTick
                    if (saveObj.isNextTick) {
                        return;
                    }

                    // 锁上
                    saveObj.isNextTick = 1;

                    nextTick(() => {
                        // 获取值
                        let val = this[expr];

                        // 监听整个数据
                        saveObj.callback.call(this, {
                            expr,
                            val,
                            modifys: Array.from(saveObj.modifys)
                        }, val);

                        // 事后清空modifys
                        saveObj.modifys.length = 0;

                        // 解锁
                        saveObj.isNextTick = 0;
                    });
                });

                let val = this[expr];
                (arg3 === true) && callback.call(this, {
                    expr,
                    val,
                    modifys: []
                }, val);
                break;
            case "seekOri":
                // 先记录旧的数据
                let sData = saveObj.oldVals = this.seek(expr);

                this.on('update', updateFunc = e => {
                    // 判断是否进入nextTick
                    if (saveObj.isNextTick) {
                        return;
                    }

                    // 锁上
                    saveObj.isNextTick = 1;

                    nextTick(() => {
                        let {
                            oldVals
                        } = saveObj;

                        let sData = this.seek(expr);

                        // 判断是否相等
                        let isEq = 1;
                        if (sData.length != oldVals.length) {
                            isEq = 0;
                        }
                        isEq && sData.some((e, i) => {
                            if (!(oldVals[i] == e)) {
                                isEq = 0;
                                return true;
                            }
                        });

                        // 不相等就触发callback
                        if (!isEq) {
                            saveObj.callback.call(this, {
                                expr,
                                old: oldVals,
                                val: sData
                            }, sData);
                        }

                        // 替换旧值
                        saveObj.oldVals = sData;

                        // 解锁
                        saveObj.isNextTick = 0;
                    });
                });

                // 执行初始callback
                callback({
                    expr,
                    val: sData
                }, sData);
                break;
        }

        // 设置绑定update的函数
        saveObj.updateFunc = updateFunc;
    },
    // 注销watch
    unwatch(expr, callback) {
        // 调整参数
        let arg1Type = getType(expr);
        if (/function/.test(arg1Type)) {
            callback = expr;
            expr = "";
        }

        let tarExprObj = this[WATCHHOST].get(expr);

        if (tarExprObj) {
            // 搜索相应的saveObj
            let saveObj;
            Array.from(tarExprObj).some(e => {
                if (e.callback === callback) {
                    saveObj = e;
                    return;
                }
            });

            if (saveObj) {
                // 去除update监听
                this.off('update', saveObj.updateFunc);

                // 删除对象
                tarExprObj.delete(saveObj);

                // 判断arr是否清空，是的话回收update事件绑定
                if (!tarExprObj.size) {
                    delete this[WATCHHOST].delete(expr);
                }
            } else {
                console.warn(`can't find this watch callback => `, callback);
            }
        }

        return this;
    },
    entrend(options) {
        // 目标数据
        let target = this;

        let {
            modifyId
        } = options;

        if (!modifyId) {
            throw "illegal trend data";
        }

        // 获取target
        options.keys.forEach(k => {
            target = target[k];
        });

        if (target) {
            // 添加_entrendModifyId
            target._entrendModifyId = modifyId;

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
        } else {
            console.warn(`data not found => `, this, options);
        }

        return this;
    },
    // 同步数据的方法
    sync(xdata, options, cover) {
        let optionsType = getType(options);

        let watchFunc, oppWatchFunc;

        switch (optionsType) {
            case "string":
                // 单键覆盖
                if (cover) {
                    xdata[options] = this[options];
                }

                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        if (trend.fromKey == options) {
                            xdata.entrend(trend);
                        }
                    });
                });
                xdata.watch(oppWatchFunc = e => {
                    e.modifys.forEach(trend => {
                        if (trend.fromKey == options) {
                            this.entrend(trend);
                        }
                    });
                });
                break;
            case "array":
                // 数组内的键覆盖
                if (cover) {
                    options.forEach(k => {
                        xdata[k] = this[k];
                    });
                }

                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        if (options.includes(trend.fromKey)) {
                            xdata.entrend(trend);
                        }
                    });
                });
                xdata.watch(oppWatchFunc = e => {
                    e.modifys.forEach(trend => {
                        if (options.includes(trend.fromKey)) {
                            this.entrend(trend);
                        }
                    });
                });
                break;
            case "object":
                let optionsKeys = Object.keys(options);

                // 映射key来绑定值
                let resOptions = {};

                // 映射对象内的数据合并
                if (cover) {
                    optionsKeys.forEach(k => {
                        let oppK = options[k];
                        xdata[oppK] = this[k];
                        resOptions[oppK] = k;
                    });
                } else {
                    optionsKeys.forEach(k => {
                        resOptions[options[k]] = k;
                    });
                }

                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        trend = cloneObject(trend);
                        let keysOne = trend.fromKey;

                        if (options.hasOwnProperty(keysOne)) {
                            if (isUndefined(trend.keys[0])) {
                                trend.key = options[keysOne];
                            } else {
                                trend.keys[0] = options[keysOne];
                            }
                            xdata.entrend(trend);
                        }
                    });
                });

                xdata.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {

                        trend = cloneObject(trend);

                        let keysOne = trend.fromKey;

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
                if (cover) {
                    xdata.extend(this.object);
                }

                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        xdata.entrend(trend);
                    });
                });
                xdata.watch(oppWatchFunc = e => {
                    e.modifys.forEach(trend => {
                        this.entrend(trend);
                    });
                });
                break;
        }

        // 双方添加数据对称记录
        this[SYNCHOST].set(xdata, {
            // opp: xdata,
            oppWatchFunc,
            watchFunc
        });
        xdata[SYNCHOST].set(this, {
            // opp: this,
            oppWatchFunc: watchFunc,
            watchFunc: oppWatchFunc
        });

        return this;
    },
    // 注销sync绑定
    unsync(xdataObj) {
        let syncData = this[SYNCHOST].get(xdataObj);

        if (syncData) {
            let {
                oppWatchFunc,
                watchFunc
            } = syncData;

            // 解除绑定的watch函数
            this.unwatch(watchFunc);
            xdataObj.unwatch(oppWatchFunc);
            this[SYNCHOST].delete(xdataObj);
            xdataObj[SYNCHOST].delete(this);
        } else {
            console.warn("not found => ", xdataObj);
        }

        return this;
    },
    virData(options) {
        // 转换为xdata
        let cloneData = this.object;
        mapData(cloneData, options);
        cloneData = createXData(cloneData);

        let {
            mapping,
            type,
            key
        } = options;

        let reserveMapping = {};

        Object.keys(mapping).forEach(k => {
            let k2 = mapping[k];
            !isUndefined(k2) && (reserveMapping[k2] = k);
        });

        let _thisUpdateFunc, selfUpdataFunc;
        switch (type) {
            case "mapKey":
                this.on('update', _thisUpdateFunc = e => {
                    let {
                        trend
                    } = e;

                    trend = cloneObject(trend);

                    // 修正trend的数据
                    if (trend.args) {
                        mapData(trend.args, options);
                    } else if (trend.value) {
                        mapData(trend.value, options);
                    }

                    let tarKey = mapping[trend.key];
                    if (!isUndefined(tarKey)) {
                        // 修正trend数据
                        trend.key = tarKey;
                    }
                    cloneData.entrend(trend);
                });
                cloneData.on('update', selfUpdataFunc = e => {
                    let {
                        trend
                    } = e;

                    trend = cloneObject(trend);

                    if (trend.args) {
                        mapData(trend.args, {
                            type,
                            // key,
                            mapping: reserveMapping
                        });
                    } else if (trend.value) {
                        mapData(trend.value, {
                            type,
                            // key,
                            mapping: reserveMapping
                        });
                    }

                    let tarKey = reserveMapping[trend.key];

                    if (!isUndefined(tarKey)) {
                        trend.key = tarKey;
                    }
                    this.entrend(trend);
                });
                break;
            case "mapValue":
                this.on('update', _thisUpdateFunc = e => {
                    let {
                        trend
                    } = e;

                    trend = cloneObject(trend);

                    // 修正trend的数据
                    if (trend.args) {
                        mapData(trend.args, options);
                    } else if (trend.value) {
                        mapData(trend.value, options);
                    }

                    if (trend.key == key) {
                        let val = trend.value;
                        if (mapping.hasOwnProperty(val)) {
                            // 修正value
                            trend.value = mapping[val];
                        }
                    }

                    // 同步
                    cloneData.entrend(trend);

                });
                cloneData.on('update', selfUpdataFunc = e => {
                    let {
                        trend
                    } = e;

                    trend = cloneObject(trend);

                    if (trend.args) {
                        mapData(trend.args, {
                            type,
                            key,
                            mapping: reserveMapping
                        });
                    } else if (trend.value) {
                        mapData(trend.value, {
                            type,
                            key,
                            mapping: reserveMapping
                        });
                    }

                    if (trend.key == key) {
                        let val = trend.value;
                        if (reserveMapping.hasOwnProperty(val)) {
                            // 修正value
                            trend.value = reserveMapping[val];
                        }
                    }

                    // 同步
                    this.entrend(trend);
                });
                break;
        }

        // 修正remove方法
        defineProperty(cloneData, "remove", {
            value(...args) {
                if (!args.length) {
                    // 确认删除自身，清除this的函数
                    this.off('update', _thisUpdateFunc);
                    cloneData.off('update', selfUpdataFunc);
                    _thisUpdateFunc = selfUpdataFunc = cloneData = null;
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
                clearXData(this);
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
    // 添加到前面
    before(data) {
        if (/\D/.test(this.hostkey)) {
            console.error(`can't use before in this data =>`, this, data);
            throw "";
        }
        this.parent.splice(this.hostkey, 0, data);
        return this;
    },
    // 添加到后面
    after(data) {
        if (/\D/.test(this.hostkey)) {
            console.error(`can't use after in this data =>`, this, data);
            throw "";
        }
        this.parent.splice(this.hostkey + 1, 0, data);
        return this;
    },
    // push的去重版本
    add(data) {
        !this.includes(data) && this.push(data);
    },
    clone() {
        return createXData(this.object);
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
    },
    extend(...args) {
        assign(this, ...args);
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
    },
    "prev": {
        get() {
            if (!/\D/.test(this.hostkey) && this.hostkey > 0) {
                return this.parent[this.hostkey - 1];
            }
        }
    },
    "next": {
        get() {
            if (!/\D/.test(this.hostkey)) {
                return this.parent[this.hostkey + 1];
            }
        }
    }
});

    