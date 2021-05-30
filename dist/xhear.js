/*!
 * xhear v6.0.0
 * https://github.com/kirakiray/Xhear#readme
 * 
 * (c) 2018-2021 YAO
 * Released under the MIT License.
 */
((glo) => {
    "use strict";
    // public function
    const getRandomId = () => Math.random().toString(32).substr(2);
    // const getRandomId = (len = 40) => {
    //     return Array.from(crypto.getRandomValues(new Uint8Array(len / 2)), dec => ('0' + dec.toString(16)).substr(-2)).join('');
    // }
    var objectToString = Object.prototype.toString;
    var getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
    const isFunction = d => getType(d).search('function') > -1;
    var isEmptyObj = obj => !Object.keys(obj).length;
    const defineProperties = Object.defineProperties;
    const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    const isxdata = obj => obj instanceof XData;

    const isDebug = document.currentScript.getAttribute("debug") !== null;

    // 改良异步方法
    const nextTick = (() => {
        if (isDebug) {
            let nMap = new Map();
            return (fun, key) => {
                if (!key) {
                    key = getRandomId();
                }

                let timer = nMap.get(key);
                clearTimeout(timer);
                nMap.set(key, setTimeout(() => {
                    fun();
                    nMap.delete(key);
                }));
            };
        }

        // 定位对象寄存器
        let nextTickMap = new Map();

        let pnext = (func) => Promise.resolve().then(() => func())

        if (typeof process === "object" && process.nextTick) {
            pnext = process.nextTick;
        }

        let inTick = false;
        return (fun, key) => {
            if (!key) {
                key = getRandomId();
            }

            nextTickMap.set(key, {
                key,
                fun
            });

            if (inTick) {
                return;
            }

            inTick = true;

            pnext(() => {
                if (nextTickMap.size) {
                    nextTickMap.forEach(({
                        key,
                        fun
                    }) => {
                        try {
                            fun();
                        } catch (e) {
                            console.error(e);
                        }
                        nextTickMap.delete(key);
                    });
                }

                nextTickMap.clear();
                inTick = false;
            });
        };
    })();

    // 在tick后运行收集的函数数据
    const collect = (func) => {
        let arr = [];
        const reFunc = e => {
            arr.push(e);
            nextTick(() => {
                func(arr);
                arr.length = 0;
            }, reFunc);
        }

        return reFunc;
    }

    // 扩展对象
    const extend = (_this, proto) => {
        Object.keys(proto).forEach(k => {
            // 获取描述
            let {
                get,
                set,
                value
            } = getOwnPropertyDescriptor(proto, k);

            if (value) {
                if (_this.hasOwnProperty(k)) {
                    _this[k] = value;
                } else {
                    Object.defineProperty(_this, k, {
                        value
                    });
                }
            } else {
                Object.defineProperty(_this, k, {
                    get,
                    set
                });
            }
        });
    }

    const startTime = Date.now();
    // 获取高精度的当前时间
    // const getTimeId = () => startTime + performance.now();
    // const getTimeId = () => Date.now().toString(32);
    // const getTimeId = () => performance.now().toString(32);


    const XDATASELF = Symbol("self");
    const WATCHS = Symbol("watchs");
    const CANUPDATE = Symbol("can_update");

    const emitUpdate = (target, opts) => {
        // 触发callback
        target[WATCHS].forEach(f => f(opts))

        // 向上冒泡
        target.owner.forEach(parent => emitUpdate(parent, opts));
    }

    class XData {
        constructor(obj) {
            if (isxdata(obj)) {
                return obj;
            }

            let proxy_self;

            if (obj.get) {
                proxy_self = new Proxy(this, {
                    get: obj.get,
                    ownKeys: obj.ownKeys,
                    getOwnPropertyDescriptor: obj.getOwnPropertyDescriptor,
                    set: xdataHandler.set,
                });

                delete obj.get;
                delete obj.ownKeys;
                delete obj.getOwnPropertyDescriptor;
            } else {
                proxy_self = new Proxy(this, xdataHandler);
            }

            // 每个对象的专属id
            defineProperties(this, {
                [XDATASELF]: {
                    value: this
                },
                // 每个对象必有的id
                xid: {
                    value: "x_" + getRandomId()
                },
                // 所有父层对象存储的位置
                // 拥有者对象
                owner: {
                    value: new Set()
                },
                // 数组对象
                length: {
                    configurable: true,
                    writable: true,
                    value: 0
                },
                // 监听函数
                [WATCHS]: {
                    value: new Map()
                },
                [CANUPDATE]: {
                    writable: true,
                    value: 0
                }
            });

            let maxNum = -1;
            Object.keys(obj).forEach(key => {
                let descObj = getOwnPropertyDescriptor(obj, key);
                let {
                    value,
                    get,
                    set
                } = descObj;

                if (key === "get") {
                    return;
                }
                if (!/\D/.test(key)) {
                    key = parseInt(key);
                    if (key > maxNum) {
                        maxNum = key;
                    }
                }
                if (get || set) {
                    // 通过get set 函数设置
                    defineProperties(this, {
                        [key]: descObj
                    });
                } else {
                    // 直接设置函数
                    this.setData(key, value);
                }
            });

            if (maxNum > -1) {
                this.length = maxNum + 1;
            }

            this[CANUPDATE] = 1;

            return proxy_self;
        }

        watch(callback) {
            const wid = "e_" + getRandomId();

            this[WATCHS].set(wid, callback);

            return wid;
        }

        unwatch(wid) {
            return this[WATCHS].delete(wid);
        }

        setData(key, value) {
            // 确认key是隐藏属性
            if (/^_/.test(key)) {
                defineProperties(this, {
                    [key]: {
                        writable: true,
                        configurable: true,
                        value
                    }
                })
                return true;
            }

            let valueType = getType(value);
            if (valueType == "array" || valueType == "object") {
                // if (value instanceof Object) {
                value = new XData(value, this);

                // 设置父层的key
                value.owner.add(this);
            }

            const oldVal = this[key];

            let reval = Reflect.set(this, key, value);

            if (this[CANUPDATE]) {
                // 改动冒泡
                emitUpdate(this, {
                    xid: this.xid,
                    name: "setData",
                    args: [key, value]
                });
            }

            if (isxdata(oldVal)) {
                oldVal.owner.delete(this);
            }

            return reval;
        }

        delete(key) {
            // 确认key是隐藏属性
            if (/^_/.test(key) || typeof key === "symbol") {
                return Reflect.deleteProperty(this, key);
            }

            if (!key) {
                return false;
            }

            // 无proxy自身
            const _this = this[XDATASELF];

            let val = _this[key];
            if (isxdata(val)) {
                // 清除owner上的父层
                val.owner.delete(_this);
            }

            let reval = Reflect.deleteProperty(_this, key);

            // 改动冒泡
            emitUpdate(this, {
                xid: this.xid,
                name: "delete",
                args: [key]
            });

            return reval;
        }
    }

    // 中转XBody的请求
    const xdataHandler = {
        set(target, key, value, receiver) {
            if (typeof key === "symbol") {
                return Reflect.set(target, key, value, receiver);
            }
            return target.setData(key, value);
        },
        deleteProperty: function(target, key) {
            return target.delete(key);
        }
    }

    const createXData = (obj) => {
        return new XData(obj);
    };

    extend(XData.prototype, {
        seek(expr) {
            let arr = [];

            if (!isFunction(expr)) {
                let f = new Function(`with(this){return ${expr}}`)
                expr = _this => {
                    try {
                        return f.call(_this, _this);
                    } catch (e) {}
                };
            }

            if (expr.call(this, this)) {
                arr.push(this);
            }

            Object.values(this).forEach(e => {
                if (isxdata(e)) {
                    arr.push(...e.seek(expr));
                }
            });

            return arr;
        },
        // watch异步收集版本
        watchTick(func) {
            return this.watch(collect(func));
        },
        // 转换为json数据
        toJSON() {
            let obj = {};

            let isPureArray = true;
            let maxId = 0;

            Object.keys(this).forEach(k => {
                let val = this[k];

                if (!/\D/.test(k)) {
                    k = parseInt(k);
                    if (k > maxId) {
                        maxId = k;
                    }
                } else {
                    isPureArray = false;
                }

                if (isxdata(val)) {
                    val = val.toJSON();
                }

                obj[k] = val;
            });

            if (isPureArray) {
                obj.length = maxId + 1;
                obj = Array.from(obj);
            }

            const xid = this.xid;
            defineProperties(obj, {
                xid: {
                    get: () => xid
                }
            });

            return obj;
        },
        // 转为字符串
        toString() {
            return JSON.stringify(this.toJSON());
        }
    });

    // 不影响数据原结构的方法，重新做钩子
    ['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'lastIndexOf', 'includes', 'join'].forEach(methodName => {
        let arrayFnFunc = Array.prototype[methodName];
        if (arrayFnFunc) {
            defineProperties(XData.prototype, {
                [methodName]: {
                    value: arrayFnFunc
                }
            });
        }
    });

    // 原生splice方法
    const arraySplice = Array.prototype.splice;

    extend(XData.prototype, {
        splice(index, howmany, ...items) {
            let self = this[XDATASELF];

            // items修正
            items = items.map(e => {
                let valueType = getType(e);
                if (valueType == "array" || valueType == "object") {
                    e = new XData(e);
                    e.owner.add(self);
                }

                return e;
            })

            // 套入原生方法
            let rmArrs = arraySplice.call(self, index, howmany, ...items);

            rmArrs.forEach(e => isxdata(e) && e.owner.delete(self));

            // 改动冒泡
            emitUpdate(this, {
                xid: this.xid,
                name: "splice",
                args: [index, howmany, ...items]
            });

            return rmArrs;
        },
        unshift(...items) {
            this.splice(0, 0, ...items);
            return this.length;
        },
        push(...items) {
            this.splice(this.length, 0, ...items);
            return this.length;
        },
        shift() {
            return this.splice(0, 0)[0];
        },
        pop() {
            return this.splice(this.length - 1, 1)[0];
        }
    });

    ['sort', 'reverse'].forEach(methodName => {
        // 原来的数组方法
        const arrayFnFunc = Array.prototype[methodName];

        if (arrayFnFunc) {
            defineProperties(XData.prototype, {
                [methodName]: {
                    value(...args) {
                        let reval = arrayFnFunc.apply(this[XDATASELF], args)

                        emitUpdate(this, {
                            xid: this.xid,
                            name: methodName
                        });

                        return reval;
                    }
                }
            });
        }
    });
    const createXEle = (ele) => {
        return ele.__xEle__ ? ele.__xEle__ : (ele.__xEle__ = new XEle(ele));
    }
    const XEleHandler = {
        get(target, key, receiver) {
            if (!/\D/.test(key)) {
                return createXEle(target.ele.children[key]);
            }
            return Reflect.get(target, key, receiver);
        },
        ownKeys(target) {
            let keys = Reflect.ownKeys(target);
            let len = target.ele.children.length;
            for (let i = 0; i < len; i++) {
                keys.push(String(i));
            }
            return keys;
        },
        getOwnPropertyDescriptor(target, key) {
            if (!/\D/.test(key)) {
                return {
                    enumerable: true,
                    configurable: true,
                }
            }
            return Reflect.getOwnPropertyDescriptor(target, key);
        }
    };
    class XEle extends XData {
        constructor(ele) {
            super(Object.assign({
                tag: ele.tagName.toLowerCase()
            }, XEleHandler));

            defineProperties(this, {
                ele: {
                    get: () => ele
                }
            });

            delete this.length;
        }

        get length() {
            return this.ele.children.length;
        }

        get text() {
            return this.ele.textContent;
        }

        set text(val) {
            this.ele.textContent = val;
        }

        get html() {
            return this.ele.innerHTML;
        }

        set html(val) {
            this.ele.innerHTML = val;
        }

        $(expr) {

        }

        all() {

        }
    }




    function $(expr) {
        if (expr instanceof Element) {
            return createXEle(expr);
        }

        const exprType = getType(expr);

        if (exprType == "string") {
            return createXEle(document.querySelector(expr));
        }
    }

    glo.$ = $
})(window);