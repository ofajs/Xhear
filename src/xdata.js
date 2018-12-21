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