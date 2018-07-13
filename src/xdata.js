// 获取监听对象数组
const getWatchObj = (d, k, sName = SWATCH) => d[sName] && (d[sName][k] || (d[sName][k] = []));

const watchGetter = (host, k, func) => {
    getWatchObj(host, k).push(func);
}

// 触发改动监听
const emitChange = (tar, key, val, oldVal, type = "update") => {
    // 触发watch事件
    (type === "update") && each(getWatchObj(tar, key), callFunc => {
        callFunc(val, oldVal);
    });

    // 触发观察
    each(tar[OBSERVERKEYS], callFunc => {
        callFunc({
            name: key,
            type,
            oldVal,
            val
        });
    });
};

// 值绑定
const bridge = (obj1, key1, obj2, key2) => {
    obj1.watch(key1, d => {
        obj2[key2] = d;
    });
    obj2.watch(key2, d => {
        obj1[key1] = d;
    });

    // 设置一次值
    obj2[key2] = obj1[key1];
}

// 数据绑定Class
let XData = function () {
    defineProperty(this, SWATCH, {
        value: {}
    });

    defineProperty(this, XDATA_DATAOBJ, {
        value: {}
    });
    // 设置xdata
    this.xdata = this[XDATA_DATAOBJ];

    defineProperty(this, SWATCHGET, {
        value: {}
    });

    defineProperty(this, OBSERVERKEYS, {
        value: []
    });
}

let XDataFn = {
    watch(k, func) {
        switch (getType(k)) {
            case "string":
                getWatchObj(this, k).push(func);
                break;
            case "object":
                for (let i in k) {
                    this.watch(i, k[i]);
                }
                break;
        }
    },
    unwatch(k, func) {
        if (k && func) {
            let tars = getWatchObj(this, k);
            // 查找到函数就去掉
            let id = tars.indexOf(func);
            tars.splice(id, 1);
        }
    },
    set(key, value) {
        switch (getType(key)) {
            case "object":
                for (let i in key) {
                    this.set(i, key[i]);
                }
                return;
            case "array":
                each(key, k => this.set(k));
                return;
        }

        // 寄存对象
        let regObj = this[XDATA_DATAOBJ];

        // 寄放处
        regObj[key] = value;

        // 定义函数
        defineProperty(this, key, {
            enumerable: true,
            get() {
                // get操作频繁，比重建数组的each快
                getWatchObj(this, key, SWATCHGET).forEach(callFunc => {
                    callFunc(regObj[key]);
                });
                return regObj[key];
            },
            set(d) {
                let oldVal = regObj[key];

                // 判断是否对象类型
                // let oldValType = getType(oldVal),
                //     oriValueType = getType(d);

                // // 对象类型就进行深复制
                // if (oriValueType == "object") {
                //     d = Object.assign({}, d);
                // } else if (oriValueType == "array") {
                //     d = d.slice();
                // }

                regObj[key] = d;

                let canEmit = 0;

                // if ((oriValueType == "object" || oriValueType == "array") && oriValueType == oldValType) {
                //     if (JSON.stringify(oldVal) !== JSON.stringify(d)) {
                //         canEmit = 1;
                //     }
                // } else {
                if (oldVal !== d) {
                    canEmit = 1;
                }
                // }

                if (canEmit) {
                    // 防止重复值触发改动
                    emitChange(this, key, d, oldVal);
                }
            }
        });

        emitChange(this, key, value, undefined, "new");

        // 设置值
        this[key] = value;
    },
    // 直接触发
    emit(key) {
        emitChange(this, key, this[key], this[key]);
    },
    // 观察
    observe(callback) {
        callback && this[OBSERVERKEYS].push(callback);
        return this;
    },
    // 取消观察
    unobserve(callback) {
        if (callback) {
            let arr = this[OBSERVERKEYS];
            let id = arr.indexOf(callback);
            if (id > -1) {
                arr.splice(id, 1);
            }
        }
        return this;
    },
    // 覆盖对象数据
    cover(obj) {
        for (let k in obj) {
            if (k in this) {
                this[k] = obj[k];
            }
        }
        return this;
    }
};

let XDataFnDefineObj = {
    // 同步数据的方法
    syncData: {
        value(obj, options) {
            if (!(obj instanceof XData) && !obj.svRender) {
                throw 'the arg1 is not xdata';
            }
            switch (getType(options)) {
                case "object":
                    for (let k in options) {
                        bridge(this, k, obj, options[k]);
                    }
                    break;
                case "array":
                    each(options, k => {
                        bridge(this, k, obj, k);
                    });
                    break;
                case "string":
                    bridge(this, options, obj, options);
                    break;
                default:
                    for (let k in this) {
                        if (k in obj) {
                            bridge(this, k, obj, k);
                        }
                    }
            }
            return this;
        }
    },
    // 带中转的同步数据方法
    transData: {
        value(options) {
            let defaults = {
                // 自身key监听
                key: "",
                // 目标数据对象
                target: "",
                // 目标key
                targetKey: "",
                // 数据对接对象
                // trans: {},
                // get set 转换函数
                // get() {},
                // set() {}
            };
            assign(defaults, options);

            let {
                key,
                target,
                targetKey,
                trans,
                get,
                set
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

                // 先设置一次
                defaults.target[defaults.targetKey] = trans[this[defaults.key]];
            } else {
                if (get) {
                    target.watch(targetKey, d => {
                        d = get(d);
                        this[key] = d;
                    });
                }
                if (set) {
                    this.watch(key, d => {
                        d = set(d);
                        target[targetKey] = d;
                    });
                }
            }

            return this;
        }
    }
};
for (let k in XDataFn) {
    XDataFnDefineObj[k] = {
        value: XDataFn[k]
    }
}
defineProperties(XData.prototype, XDataFnDefineObj);

// 直接生成
$.xdata = function (obj, options) {
    // 生成对象
    let xd = new XData();

    // 注册keys
    // xd.set(Object.keys(obj));

    // 设置数据
    // xd.cover(obj);

    xd.set(obj);

    return xd;
}