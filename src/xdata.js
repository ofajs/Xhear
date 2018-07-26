let isXData = (obj) => (obj instanceof XObject) || (obj instanceof XArray);

// 将xdata转换成字符串
let XDataToObject = (xdata) => {
    let reObj = xdata;
    if (xdata instanceof Array) {
        reObj = [];
        xdata.forEach(e => {
            if (isXData(e)) {
                reObj.push(XDataToObject(e));
            } else {
                reObj.push(e);
            }
        });
    } else if (xdata instanceof Object) {
        reObj = {};
        for (let k in xdata) {
            let tar = xdata[k];
            if (isXData(tar)) {
                reObj[k] = XDataToObject(tar);
            } else {
                reObj[k] = tar;
            }
        }
    }
    return reObj;
}

// 同步数据的方法
const syncData = (xdata1, xdata2, options) => {
    let type = getType(options)
    let func1, func2;

    // 数据同步
    switch (type) {
        case "string":
            func1 = e => {
                let key = e.key[0];
                if (options === key) {
                    xdata2.entrend(e);
                }
            }
            func2 = e => {
                let key = e.key[0];
                if (options === key) {
                    xdata1.entrend(e);
                }
            }
            break;
        case "array":
            func1 = e => {
                let key = e.key[0];
                if (options.indexOf(key) > -1) {
                    xdata2.entrend(e);
                }
            }
            func2 = e => {
                let key = e.key[0];
                if (options.indexOf(key) > -1) {
                    xdata1.entrend(e);
                }
            }
            break;
        case "object":
            let keys1 = Object.keys(options),
                keys2 = Object.values(options);
            func1 = e => {
                // 获取对应key
                let key = e.key[0];

                if (keys1.indexOf(key) > -1) {
                    // 深复制
                    e = Object.assign({}, e);

                    // 修正keyname
                    e.key[0] = keys2[keys1.indexOf(key)];

                    xdata2.entrend(e);
                }
            }
            func2 = e => {
                // 获取对应key
                let key = e.key[0];

                if (keys2.indexOf(key) > -1) {
                    // 深复制
                    e = Object.assign({}, e);

                    // 修正keyname
                    e.key[0] = keys1[keys2.indexOf(key)];

                    xdata1.entrend(e);
                }
            }
            break;
        default:
            func1 = e => xdata2.entrend(e);
            func2 = e => xdata1.entrend(e);
    }

    // 数据绑定逻辑
    xdata1.trend(func1);
    xdata2.trend(func2);

    // 行动id
    let behaviorId = getRandomId();

    xdata1._syncs.push({
        bid: behaviorId,
        type,
        func: func1,
        opp: xdata2,
    });
    xdata2._syncs.push({
        bid: behaviorId,
        type,
        func: func2,
        opp: xdata1,
    });
}

const unSyncData = (xdata1, xdata2, options) => {
    let type = getType(options);

    // 获取相应的对象
    let tar = xdata1._syncs.find(e => e.opp === xdata2 && e.type === type);

    // 有目标，取出相应id的对象
    if (tar) {
        let {
            bid
        } = tar;

        let id_1 = xdata1._syncs.find(e => e.bid == bid);
        let id_2 = xdata2._syncs.find(e => e.bid == bid);

        xdata1._syncs.splice(id_1, 1);

        let tar2 = xdata2._syncs.splice(id_2, 1);
        tar2 = tar2[0]

        xdata1.untrend(tar.func);
        xdata2.untrend(tar2.func);
    }
}

// 触发改动
let emitChange = (data, key, val, oldVal, type = "update", eOption) => {
    // 判断能否触发
    if (!data._canEmitWatch) {
        return;
    }

    // uphost通行
    if (type !== "uphost" && val === oldVal) {
        return;
    }

    // 对象级数据更新，判断对象是否相等
    if (type == "update" && isXData(val) && isXData(oldVal) && val.stringify() === oldVal.stringify()) {
        return;
    }

    let watchArr = data._watch[key];
    if (watchArr) {
        watchArr.forEach(func => {
            let watchOptions = {
                oldVal,
                type
            }
            // if (type == 'uphost') {
            watchOptions.uphost = assign({}, eOption);
            // } else if (type == "uparray") {
            //     watchOptions.uparray = assign({}, eOption);
            //     delete watchOptions.oldVal;
            // }
            func(val, watchOptions);
        });
    }

    data['_obs'].forEach(func => {
        let obsOption = {
            target: data,
            type,
            key,
            val,
            oldVal
        };
        // if (type == 'uphost') {
        obsOption.uphost = assign({}, eOption);
        // } else if (type == "uparray") {
        //     obsOption.uparray = assign({}, eOption);
        //     delete obsOption.oldVal;
        // }
        func(obsOption);
    });

    let {
        _host
    } = data;

    // 触发变动参数监听
    if (type !== "uphost") {
        // 只有根节点才有权trend
        let {
            _trend,
            _host
        } = data;

        // key数组
        let trendKeys = [];

        let aKey = key;

        while (_trend) {
            // 加入key
            trendKeys.unshift(aKey);

            let options = {
                key: trendKeys,
                val: XDataToObject(val),
                oldVal: XDataToObject(oldVal),
                type
            };

            // if (type == "uparray") {
            //     options.uparray = eOption;
            // }

            _trend.forEach(func => {
                func(assign({}, options));
            });

            if (_host) {
                let tar = _host.target[_host.key];

                // 触发uphost
                emitChange(_host.target, _host.key, tar, tar, "uphost", options)

                _trend = _host.target._trend;
                aKey = _host.key;
                _host = _host.target._host;
            } else {
                _trend = null
            }
        }
    }
}

// 代理对象
let XObjectHandler = {
    set(target, key, value, receiver) {
        if (!/^_.+/.test(key)) {
            // 获取旧值
            let oldVal = target[key];

            let type = target.hasOwnProperty(key) ? "update" : "new";

            // 不能设置xdata
            if (isXData(value)) {
                // throw `cann't set xdata`;
                value = value.toObject();
            }

            // 判断value是否object
            value = createXData(value, target._root || target, target, key);

            // 继承行为
            let reValue = !0;

            if (target._exkeys) {
                if (target._exkeys.indexOf(key) > -1) {
                    // 只修改准入值
                    target[key] = value;

                    // 触发改动事件
                    emitChange(target, key, value, oldVal, type);
                } else {
                    reValue = Reflect.set(target, key, value, receiver);
                }
            } else {
                reValue = Reflect.set(target, key, value, receiver);

                // 触发改动事件
                emitChange(target, key, value, oldVal, type);
            }

            // 返回行为值
            return reValue;
        } else {
            return Reflect.set(target, key, value, receiver);
        }
    },
    deleteProperty(target, key) {
        if (!/^_.+/.test(key)) {
            // 获取旧值
            let oldVal = target[key];

            // 默认行为
            let reValue = Reflect.deleteProperty(target, key);

            // 触发改动事件
            emitChange(target, key, undefined, oldVal, "delete");

            return reValue;
        } else {
            return Reflect.deleteProperty(target, key);
        }
    }
}

// 主体xObject
function XObject(root, host, key) {
    defineProperties(this, {
        '_id': {
            value: getRandomId()
        },
        '_obs': {
            value: []
        },
        '_trend': {
            value: []
        },
        '_syncs': {
            value: []
        },
        // 可以特殊绕过的key
        // '_exkeys': {
        //     value: []
        // },
        '_watch': {
            value: {}
        },
        '_canEmitWatch': {
            writable: !0,
            value: 0
        },
        'isRoot': {
            value: !!root
        }
    });

    if (root) {
        defineProperty(this, '_root', {
            value: root
        });
        defineProperty(this, '_host', {
            value: {
                target: host,
                key
            }
        });
    } else {
        defineProperty(this, '_cache', {
            value: {}
        });
    }
}

// 定位trendData
const detrend = (tar, trendData) => {
    let lastId = trendData.key.length - 1;
    let reTar, reKey;
    trendData.key.forEach((key, i) => {
        // 没有对象就别再执行了
        if (tar instanceof Object && i <= lastId) {

            // 最后那个才设置
            if (i == lastId) {
                reTar = tar;
                reKey = key;
            }

            // 修正对象
            tar = tar[key];
        }
    });

    return [reTar, reKey];
}

let XObjectFn = {
    // 监听
    watch(key, func) {
        switch (getType(key)) {
            case "string":
                let watchArr = this._watch[key] || (this._watch[key] = []);
                func && watchArr.push(func);
                break;
            case "object":
                for (let i in key) {
                    this.watch(i, key[i]);
                }
                break;
        }
        return this;
    },
    // 取消监听
    unwatch(key, func) {
        switch (getType(key)) {
            case "string":
                let watchArr = this._watch[key] || (this._watch[key] = []);
                let id = watchArr.indexOf(func);
                id > -1 && watchArr.splice(id, 1);
                break;
            case "object":
                for (let i in key) {
                    this.watch(i, key[i]);
                }
                break;
        }
        return this;
    },
    // 视奸
    observe(func) {
        func && this['_obs'].push(func);
        return this;
    },
    // 注销
    unobserve(func) {
        let id = this['_obs'].indexOf(func);
        (id > -1) && this['_obs'].splice(id, 1);
        return this;
    },
    // 完全重置对象（为了使用同一个内存对象）
    reset(value, options) {
        if (options) {
            // 清空选项
            if (options.watch) {
                for (let k in this._watch) {
                    delete this._watch[k];
                }
            }
            if (options.obs) {
                this._obs.length = 0;
            }
            if (options.trend) {
                this._trend.length = 0;
            }
            if (sync) {
                this._syncs.length = 0;
            }
        }

        // 删除后重新设置
        for (let k in this) {
            delete this[k];
        }
        assign(this, value);
    },
    // 监听数据变动字符串流
    trend(func) {
        func && this['_trend'].push(func);
        return this;
    },
    // 流入变动字符串流数据
    entrend(trendData) {
        let [tar, key] = detrend(this, trendData);

        switch (trendData.type) {
            case "delete":
                // 删除
                delete tar[key];
                break;
            default:
                //默认update和new
                tar[key] = trendData.val;
        }

        return this;
    },
    // 取消数据变动字符串流监听
    untrend(func) {
        let id = this['_trend'].indexOf(func);
        (id > -1) && this['_trend'].splice(id, 1);
        return this;
    },
    // 同步数据
    sync(xdata, options) {
        xdata.reset(this.toObject());
        syncData(this, xdata, options);
        return this;
    },
    // 取消数据绑定
    unsync(xdata, options) {
        unSyncData(this, xdata, options);
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
    // 转换成普通对象
    toObject() {
        let reObj = XDataToObject(this);
        return reObj;
    },
    // 转换成json字符串
    // 会保留数组数据
    stringify() {
        let obj = XDataToObject(this);
        let reObj = JSON.stringify(obj);
        return reObj;
    }
};

// 设置在 prototype 上
for (let k in XObjectFn) {
    defineProperty(XObject.prototype, k, {
        value: XObjectFn[k]
    });
}

// 生成对象
let createXObject = (obj, root, host, key) => {
    // 转换对象数据
    let xobj = new XObject(root, host, key);

    let reObj = new Proxy(xobj, XObjectHandler)

    // 合并数据
    assign(reObj, obj);

    // 打开阀门
    xobj._canEmitWatch = 1;

    // 返回代理对象
    return reObj;
}

function XArray(...args) {
    XObject.apply(this, args);
}

let XArrayFn = Object.create(Array.prototype);

for (let k in XObjectFn) {
    defineProperty(XArrayFn, k, {
        value: XObjectFn[k]
    });
}

XArray.prototype = XArrayFn;

// 生成数组型对象
let createXArray = (arr, root, host, key) => {
    let xarr = new XArray(root, host, key);

    let reObj = new Proxy(xarr, XObjectHandler);

    // 合并数据
    Array.prototype.splice.call(reObj, 0, 0, ...arr);

    // 打开阀门
    xarr._canEmitWatch = 1;

    return reObj;
}

let createXData = (obj, root, host, key) => {
    switch (getType(obj)) {
        case "object":
            return createXObject(obj, root, host, key);
        case "array":
            return createXArray(obj, root, host, key);
    }
    return obj;
}

$.xdata = obj => createXData(obj);
$.detrend = detrend;