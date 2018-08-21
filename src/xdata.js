// COMMON
// 事件key
const XDATAEVENTS = "_events_" + getRandomId();
// 数据绑定记录
const XDATASYNCS = "_syncs_" + getRandomId();
// 数据entrend id记录
const XDATATRENDIDS = "_trend_" + getRandomId();
// listen 记录
const LISTEN = "_listen_" + getRandomId();

// function
let deepClone = obj => obj instanceof Object ? JSON.parse(JSON.stringify(obj)) : obj;
// 异步执行的清理函数
// 执行函数后，5000毫秒清理一次
let clearTick;
(() => {
    // 函数容器
    let funcs = [];
    // 异步是否开启
    let runing = 0;
    clearTick = callback => {
        funcs.push(callback);
        if (!runing) {
            setTimeout(() => {
                runing = 0;
                let b_funcs = funcs;
                funcs = [];
                b_funcs.forEach(func => func());
            }, 5000);
        }
        runing = 1;
    }
})();

// business function
// trend清理器
const trendClear = (tar, tid) => {
    tar[XDATATRENDIDS].push(tid);
    if (!tar._trendClear) {
        tar._trendClear = 1;
        clearTick(() => {
            tar[XDATATRENDIDS].length = 0;
            tar._trendClear = 0;
        });
    }
}

// 设置_inMethod属性
const setInMethod = (obj, value) => defineProperty(obj, "_inMethod", {
    configurable: true,
    value
});

// 查找数据
const seekData = (data, key, sVal) => {
    let arr = [];

    if (sVal === undefined) {
        if (data.hasOwnProperty(key)) {
            arr.push(data);
        }
    } else if (data[key] == sVal) {
        arr.push(data);
    }

    for (let k in data) {
        let val = data[k];
        if (val instanceof XData) {
            let sData = seekData(val, key, sVal);
            sData.forEach(e => {
                if (!arr.includes(e)) {
                    arr.push(e);
                }
            });
        }
    }

    return arr;
}

// 解析 trend data 到最终对象
const detrend = (tar, trendData) => {
    let key;

    // 数组last id
    let lastId = trendData.keys.length - 1;
    trendData.keys.forEach((tKey, i) => {
        if (i < lastId) {
            tar = tar[tKey];
        }
        key = tKey;
    });

    return [tar, key];
}

// 获取事件寄宿对象
const getEventObj = (tar, eventName) => tar[XDATAEVENTS][eventName] || (tar[XDATAEVENTS][eventName] = []);

// 触发事件
const emitXDataEvent = (tar, eventName, args) => {
    let eveArr = getEventObj(tar, eventName);

    // 遍历事件对象
    eveArr.forEach(callback => {
        callback(...args);
    });
}

// 绑定事件
const onXDataEvent = (tar, eventName, callback) => getEventObj(tar, eventName).push(callback);

// 注销事件
const unXDataEvent = (tar, eventName, callback) => {
    let eveArr = getEventObj(tar, eventName);
    let id = eveArr.indexOf(callback);
    eveArr.splice(id, 1);
};

// class
function XData(obj, host, hostkey) {
    defineProperties(this, {
        "_id": {
            value: obj._id || getRandomId()
        },
        // 事件寄宿对象
        [XDATAEVENTS]: {
            value: obj[XDATAEVENTS] || {}
        },
        // 数据绑定记录
        [XDATASYNCS]: {
            value: obj[XDATASYNCS] || []
        },
        // entrend id 记录
        [XDATATRENDIDS]: {
            value: obj[XDATATRENDIDS] || []
        },
        // listen 记录
        [LISTEN]: {
            value: obj[LISTEN] || []
        },
        // 是否开启trend清洁
        "_trendClear": {
            writable: true,
            value: 0
        }
    });

    // 设置id
    if (!obj._id) {
        defineProperty(obj, "_id", {
            value: this._id
        });
    }

    // 判断是否有host
    if (host) {
        defineProperties(this, {
            // 根对象
            "root": {
                value: host.root || host
            },
            // 父层对象
            "host": {
                value: host
            },
            "hostkey": {
                value: hostkey
            }
        });
    }

    // 获取关键key数组
    let keys = Object.keys(obj);
    if (getType(obj) === "array") {
        keys.push('length');
    }

    // 需要返回的值
    let _this = new Proxy(this, XDataHandler);

    keys.forEach(k => {
        // 获取值，getter,setter
        let {
            get,
            set,
            value
        } = Object.getOwnPropertyDescriptor(obj, k);

        if (get || set) {
            defineProperty(this, k, {
                get,
                set
            });
        } else {
            this[k] = createXData(value, _this, k);
        }
    });

    return _this;
}

// xdata的原型
let XDataFn = Object.create(Array.prototype);
defineProperties(XDataFn, {
    // 直接获取字符串
    "string": {
        get() {
            return JSON.stringify(this);
        }
    },
    // 直接获取对象类型
    "object": {
        get() {
            return deepClone(this);
        }
    }
});

// 原型链衔接
XData.prototype = XDataFn;

// 原型链上的方法
let XDataProto = {
    // 监听变化
    watch(key, callback) {
        let arg1Type = getType(key);
        if (arg1Type === "object") {
            for (let k in key) {
                this.watch(k, key[k]);
            }
            return this;
        } else if (arg1Type.search('function') > -1) {
            callback = key;
            key = "";
        }
        onXDataEvent(this, 'watch-' + key, callback);
        return this;
    },
    // 取消监听
    unwatch(key, callback) {
        let arg1Type = getType(key);
        if (arg1Type === "object") {
            for (let k in key) {
                this.unwatch(k, key[k]);
            }
            return this;
        } else if (arg1Type.search('function') > -1) {
            callback = key;
            key = "";
        }
        unXDataEvent(this, 'watch-' + key, callback);
        return this;
    },
    // 重置数据
    reset(value) {
        let valueKeys = Object.keys(value);

        // 删除本身不存在的key
        Object.keys(this).forEach(k => {
            if (!valueKeys.includes(k)) {
                delete this[k];
            }
        });

        assign(this, value);
        return this;
    },
    // 传送器入口
    entrend(trendData) {
        // 判断tid
        if (!trendData.tid) {
            throw "trendData invalid";
        }
        if (this[XDATATRENDIDS].includes(trendData.tid)) {
            return;
        }

        // tid记录器 和 定时清理 entrend 记录器
        trendClear(this, trendData.tid);

        // 获取目标和目标key
        let [tar, key] = detrend(this, trendData);

        // 临时数组
        let tempArr = tar.slice();

        switch (trendData.type) {
            case "sort":
                // 禁止事件驱动 type:排序
                setInMethod(this, "sort");

                // 修正顺序
                trendData.order.forEach((e, i) => {
                    tar[e] = tempArr[i];
                });
                break;
            case "delete":
                // 禁止事件驱动 type:设置值
                setInMethod(this, "delete");

                delete tar[key];
                break;
            case "array-method":
                let {
                    methodName,
                    args
                } = trendData;
                // 禁止事件驱动 type:设置值
                setInMethod(this, "array-" + methodName);

                // 继承方法
                if (methodName === "copyWithin") {
                    XDataFnCopyWithin.apply(tar, args);
                } else {
                    Array.prototype[methodName].apply(tar, args);
                }
                break;
            default:
                // 禁止事件驱动 type:设置值
                setInMethod(this, "default");

                // 最终设置
                tar[key] = deepClone(trendData.val);
        }

        // 开启事件驱动
        delete this._inMethod;

        // 延续trend
        this[XDATASYNCS].forEach(o => {
            o.func({
                trend: trendData
            });
        });
        return this;
    },
    // 同步数据
    sync(target, options) {
        let func1, func2;
        switch (getType(options)) {
            case "object":
                let reverseOptions = {};
                for (let k in options) {
                    reverseOptions[options[k]] = k;
                }
                func1 = e => {
                    let trendData = deepClone(e.trend);
                    let replaceKey = reverseOptions[e.key];
                    if (replaceKey !== undefined) {
                        trendData.keys[0] = replaceKey;
                        this.entrend(trendData);
                    }
                }
                func2 = e => {
                    let trendData = deepClone(e.trend);
                    let replaceKey = options[e.key];
                    if (replaceKey !== undefined) {
                        trendData.keys[0] = replaceKey;
                        target.entrend(trendData);
                    }
                }
                break;
            case "array":
                func1 = e => {
                    if (options.includes(e.key)) {
                        this.entrend(e.trend);
                    }
                }
                func2 = e => {
                    if (options.includes(e.key)) {
                        target.entrend(e.trend);
                    }
                }
                break;
            case "string":
                func1 = e => {
                    if (e.key === options) {
                        this.entrend(e.trend);
                    }
                }
                func2 = e => {
                    if (e.key === options) {
                        target.entrend(e.trend);
                    }
                }
                break;
            default:
                // undefined
                func1 = e => this.entrend(e.trend);
                func2 = e => target.entrend(e.trend);
        }

        // 绑定函数
        target.watch(func1);
        this.watch(func2);

        let bid = getRandomId();

        // 留下案底
        target[XDATASYNCS].push({
            bid,
            options,
            opp: this,
            func: func1
        });
        this[XDATASYNCS].push({
            bid,
            options,
            opp: target,
            func: func2
        });
        return this;
    },
    // 取消数据同步
    unsync(target, options) {
        // 内存对象和行为id
        let syncObjId = this[XDATASYNCS].findIndex(e => e.opp === target && e.options === options);

        if (syncObjId > -1) {
            let syncObj = this[XDATASYNCS][syncObjId];

            // 查找target相应绑定的数据
            let tarSyncObjId = target[XDATASYNCS].findIndex(e => e.bid === syncObj.bid);
            let tarSyncObj = target[XDATASYNCS][tarSyncObjId];

            // 取消绑定函数
            this.unwatch(syncObj.func);
            target.unwatch(tarSyncObj.func);

            // 各自从数组删除
            this[XDATASYNCS].splice(syncObjId, 1);
            target[XDATASYNCS].splice(tarSyncObjId, 1);
        } else {
            console.log('not found =>', target);
        }
        return this;
    },
    // 超找数据
    seek(expr) {
        let reData;
        let propMatch = expr.match(/\[.+?\]/g);
        if (!propMatch) {
            // 查找_id
            reData = seekData(this, "_id", expr)[0];
        } else {
            propMatch.forEach((expr, i) => {
                let [key, value] = expr.replace(/[\[]|[\]]/g, "").split("=");
                let tempData = seekData(this, key, value);
                if (i === 0) {
                    reData = tempData;
                } else {
                    // 取代返回值得数组
                    let replaceData = [];

                    // 从新组合交集
                    tempData.forEach(e => {
                        if (reData.includes(e)) {
                            replaceData.push(e);
                        }
                    });

                    // 替代旧的
                    reData = replaceData;
                }
            });
        }
        return reData;
    },
    // 异步监听数据变动
    listen(expr, callback, reduceTime = 10) {
        let watchFunc;
        if (expr) {
            // 先记录一次值
            let data = JSON.stringify(this.seek(expr).map(e => e._id));

            let timer;

            this.watch(watchFunc = e => {
                let tempData = this.seek(expr);
                let tempId = tempData.map(e => e._id);

                if (JSON.stringify(tempId) !== data) {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        callback(tempData);
                    }, reduceTime);
                }
            });
        } else {
            let timer;

            this.watch(watchFunc = e => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    callback(tempData);
                }, reduceTime);
            });
        }

        this[LISTEN].push({
            expr,
            callback,
            watchFunc
        });
        return this;
    },
    // 取消监听数据变动
    unlisten(expr, callback) {
        this[LISTEN].forEach(o => {
            if (o.expr === expr && o.callback === callback) {
                let {
                    watchFunc
                } = o;

                this.unwatch(watchFunc);
            }
        });
        return this;
    },
    // 转换数据
    transData(options) {
        let defaults = {
            // 自身key监听
            key: "",
            // 目标数据对象
            target: "",
            // 目标key
            targetKey: "",
            // 数据对接对象
            // trans: {}
        };
        assign(defaults, options);

        let {
            key,
            target,
            targetKey,
            trans
        } = defaults;

        // 判断是否有trans
        if (defaults.trans) {
            // 生成翻转对象
            let resverObj = {};
            for (let k in trans) {
                resverObj[trans[k]] = k;
            }

            // 监听
            this.watch(key, d => {
                d = trans[d];
                target[targetKey] = d;
            });
            target.watch(targetKey, d => {
                d = resverObj[d];
                this[key] = d;
            });
        }
    },
    // 删除自己或子元素
    clear(...args) {
        let [keyName] = args;
        if (0 in args) {
            if (getType(keyName) === "number") {
                // 删除数组内相应index的数据
                this.splice(keyName, 1);
            } else {
                delete this[keyName];
            }
        } else {
            if (this.host) {
                delete this.host[this.hostkey];
            }
        }
    },
    // 克隆对象，为了更好理解，还是做成方法获取
    clone() {
        return createXData(this.object);
    },
    // 排序方法
    // 需要特别处理，因为参数可能是函数
    sort(...args) {
        // 设定禁止事件驱动
        setInMethod(this, "sort");

        // 记录id顺序
        let ids = this.map(e => e._id);

        // 执行默认方法
        let reValue = Array.prototype.sort.apply(this, args);

        // 开启事件驱动
        delete this._inMethod;

        // 记录新顺序
        let new_ids = this.map(e => e._id);

        // 记录顺序置换
        let order = [];
        ids.forEach((e, index) => {
            let newIndex = new_ids.indexOf(e);
            order[index] = newIndex;
        });

        // 手动触发事件
        let tid = getRandomId();

        // 自身添加该tid
        trendClear(this, tid);

        emitChange(this, undefined, this, this, "sort", {
            tid,
            keys: [],
            type: "sort",
            order
        });

        return reValue
    }
};

// 设置 XDataFn
Object.keys(XDataProto).forEach(k => {
    defineProperty(XDataFn, k, {
        value: XDataProto[k]
    });
});

// copyWithin
let XDataFnCopyWithin = function (target, start, end) {
    // 范围内的数据
    let areaData = this.slice(start, end);

    let hasXData = areaData.some(e => e instanceof XData);
    let lastId = this.length - 1;

    if (hasXData) {
        let areaId = 0;
        // 覆盖
        this.forEach((e, i) => {
            if (i >= target && i < lastId) {
                let d = areaData[areaId];
                if (d instanceof XData) {
                    d = createXData(d.object, this, i);
                }
                this[i] = d;
                areaId++;
            }
        });
        return this;
    } else {
        // 没有XData的话，还是原生性能好点
        return Array.prototype.copyWithin.call(this, target, start, end);
    }
}

// 特殊方法 copyWithin
defineProperty(XDataFn, 'copyWithin', {
    writable: true,
    value(...args) {
        // throw `can't use copyWithin`;
        return XDataFnCopyWithin.apply(this, args);
    }
});

// 更新数组方法
// 参数不会出现函数的方法
['splice', 'shift', 'unshfit', 'push', 'pop', 'fill', , 'reverse', 'copyWithin'].forEach(k => {
    let oldFunc = XDataFn[k];
    oldFunc && defineProperty(XDataFn, k, {
        value(...args) {
            // 设定禁止事件驱动
            setInMethod(this, "array-" + k);

            // 继承旧的方法
            let reValue = oldFunc.apply(this, args);

            // 手动触发事件
            let tid = getRandomId();

            // 自身添加该tid
            trendClear(this, tid);

            // 触发事件
            emitChange(this, undefined, this, this, "array-method", {
                tid,
                keys: [],
                type: "array-method",
                methodName: k,
                args
            });

            delete this._inMethod;
            return reValue
        }
    });
});

// 触发器
const emitChange = (tar, key, val, oldVal, type, trend) => {
    // watch option
    let watchOption = {
        oldVal,
        type
    };

    // 自身watch option
    let selfOption = {
        key,
        val: tar[key],
        type,
        oldVal
    };

    if (trend) {
        (key !== undefined) && trend.keys.unshift(key);
    } else {
        let keys = [key];
        let tid = getRandomId();
        trend = {
            // 行动id
            tid,
            keys,
            type
        };

        if (oldVal instanceof XData) {
            trend.oldId = oldVal._id;
        }

        // 自身添加该tid
        trendClear(tar, tid);

        defineProperties(trend, {
            val: {
                value: val,
                enumerable: true
            }
        });
    }

    watchOption.trend = trend;
    selfOption.trend = trend;

    // watch处理
    emitXDataEvent(tar, "watch-" + key, [tar[key], watchOption]);
    emitXDataEvent(tar, "watch-", [selfOption]);

    // 冒泡
    let {
        host,
        hostkey
    } = tar;

    if (host) {
        emitChange(host, hostkey, tar, tar, "update", deepClone(trend));
    }
}

// Handler
const XDataHandler = {
    set(target, key, value, receiver) {
        // 判断不是下划线开头的属性，才触发改动事件
        if (!/^_.+/.test(key)) {
            let oldVal = target[key];
            let type = target.hasOwnProperty(key) ? "update" : "new";

            let newValue = createXData(value, receiver, key);

            // 分开来写，不然这条判断语句太长了不好维护
            let canEmit = 1;

            if (target._exkeys) {
                if (target._exkeys.includes(key)) {
                    // 只修改准入值
                    target[key] = newValue;
                } else {
                    canEmit = 0;
                    Reflect.set(target, key, newValue, receiver);
                }
            } else {
                // 执行默认操作
                // 赋值
                Reflect.set(target, key, newValue, receiver);
            }

            if (value instanceof Object && oldVal instanceof Object && JSON.stringify(value) == JSON.stringify(oldVal)) {
                // object类型，判断结构值是否全等
                canEmit = 0;
            } else if (value === oldVal || target._inMethod) {
                // 普通类型是否相等
                // 在数组处理函数内禁止触发
                canEmit = 0;
            }

            // 触发改动
            canEmit && emitChange(target, key, value, oldVal, type);

            return true;
        }
        return Reflect.set(target, key, value, receiver);
    },
    deleteProperty(target, key) {
        if (!/^_.+/.test(key)) {
            // 获取旧值
            let oldVal = target[key];

            // 默认行为
            let reValue = Reflect.deleteProperty(target, key);

            // 触发改动事件
            (!target._inMethod) && emitChange(target, key, undefined, oldVal, "delete");

            return reValue;
        } else {
            return Reflect.deleteProperty(target, key);
        }
    }
};

// main
const createXData = (obj, host, hostkey) => {
    switch (getType(obj)) {
        case "array":
        case "object":
            return new XData(obj, host, hostkey);
    }
    return obj;
}