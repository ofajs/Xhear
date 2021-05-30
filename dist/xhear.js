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

            if (this[CANUPDATE] || this._update === false) {
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
            return this.splice(0, 1)[0];
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
    // 创建xEle元素
    const createXEle = (ele) => {
        return ele.__xEle__ ? ele.__xEle__ : (ele.__xEle__ = new XEle(ele));
    }

    const meetTemp = document.createElement('template');
    // 判断元素是否符合条件
    const meetsEle = (ele, expr) => {
        if (!ele.tagName) {
            return false;
        }
        if (ele === expr) {
            return true;
        }
        if (ele === document) {
            return false;
        }
        meetTemp.innerHTML = `<${ele.tagName.toLowerCase()} ${Array.from(ele.attributes).map(e => e.name + '="' + e.value + '"').join(" ")} />`;
        return !!meetTemp.content.querySelector(expr);
    }

    const pstTemp = document.createElement('div');
    // 转换元素
    const parseStringToDom = (str) => {
        pstTemp.innerHTML = str;
        let childs = Array.from(pstTemp.children);
        return childs.map(function(e) {
            pstTemp.removeChild(e);
            return e;
        });
    };

    // 将对象转为element
    const parseDataToDom = (objData) => {
        if (!objData.tag) {
            console.error("this data need tag =>", objData);
            throw "";
        }

        // 生成element
        let ele = document.createElement(objData.tag);

        // 添加数据
        objData.class && ele.setAttribute('class', objData.class);
        objData.slot && ele.setAttribute('slot', objData.slot);
        objData.text && (ele.textContent = objData.text);

        // 填充子元素
        let akey = 0;
        while (akey in objData) {
            // 转换数据
            let childEle = parseDataToDom(objData[akey]);
            ele.appendChild(childEle);
            akey++;
        }

        return ele;
    }
    const XEleHandler = {
        get(target, key, receiver) {
            if (typeof key === 'string' && !/\D/.test(key)) {
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
            if (typeof key === 'string' && !/\D/.test(key)) {
                return {
                    enumerable: true,
                    configurable: true,
                }
            }
            return Reflect.getOwnPropertyDescriptor(target, key);
        }
    };

    const EVENTS = Symbol("events");

    class XEle extends XData {
        constructor(ele) {
            super(Object.assign({
                tag: ele.tagName.toLowerCase()
            }, XEleHandler));

            defineProperties(this, {
                ele: {
                    get: () => ele
                },
                [EVENTS]: {
                    writable: true,
                    value: ""
                }
            });

            delete this.length;
            this._update = 0;
        }

        get parent() {
            let {
                parentNode
            } = this.ele;
            return (!parentNode || parentNode === document) ? null : createXEle(parentNode);
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

        get class() {
            return this.ele.classList;
        }

        get data() {
            return this.ele.dataset;
        }

        get css() {
            return getComputedStyle(this.ele);
        }

        get style() {
            return this.ele.style;
        }

        set style(d) {
            if (getType(d) == "string") {
                this.ele.style = d;
                return;
            }

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

            Object.assign(style, d);
        }

        get display() {
            return getComputedStyle(this.ele)['display'];
        }

        set display(val) {
            this.ele.style['display'] = val;
        }

        get position() {
            return {
                top: this.ele.offsetTop,
                left: this.ele.offsetLeft
            };
        }

        get offset() {
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

        get width() {
            return parseInt(getComputedStyle(this.ele).width);
        }

        get height() {
            return parseInt(getComputedStyle(this.ele).height);
        }

        get innerWidth() {
            return this.ele.clientWidth;
        }

        get innerHeight() {
            return this.ele.clientHeight;
        }

        get offsetWidth() {
            return this.ele.offsetWidth;
        }

        get offsetHeight() {
            return this.ele.offsetHeight;
        }

        get outerWidth() {
            let computedStyle = getComputedStyle(this.ele);
            return this.ele.offsetWidth + parseInt(computedStyle['margin-left']) + parseInt(computedStyle['margin-right']);
        }

        get outerHeight() {
            let computedStyle = getComputedStyle(this.ele);
            return this.ele.offsetHeight + parseInt(computedStyle['margin-top']) + parseInt(computedStyle['margin-bottom']);
        }

        $(expr) {
            return createXEle(this.ele.querySelector(expr));
        }

        all(expr) {
            return Array.from(this.ele.children).map(e => {
                return createXEle(e);
            })
        }

        is(expr) {
            return meetsEle(this.ele, expr)
        }

        attr(...args) {
            let [key, value] = args;

            let {
                ele
            } = this;

            if (args.length == 1) {
                if (key instanceof Object) {
                    Object.keys(key).forEach(k => {
                        ele.setAttribute(k, key[k]);
                    });
                }
                return ele.getAttribute(key);
            }

            ele.setAttribute(key, value);
        }

        siblings(expr) {
            // 获取相邻元素
            let parChilds = Array.from(this.parent.ele.children);

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

            return parChilds.map(e => createXEle(e));
        }

        parents(expr, until) {
            let pars = [];
            let tempTar = this.parent;

            if (!expr) {
                while (tempTar) {
                    pars.push(tempTar);
                    tempTar = tempTar.parent;
                }
            } else {
                if (getType(expr) == "string") {
                    while (tempTar && tempTar) {
                        if (meetsEle(tempTar.ele, expr)) {
                            pars.push(tempTar);
                        }
                        tempTar = tempTar.parent;
                    }
                }
            }

            if (until) {
                if (until instanceof XhearEle) {
                    let newPars = [];
                    pars.some(e => {
                        if (e === until) {
                            return true;
                        }
                        newPars.push(e);
                    });
                    pars = newPars;
                } else if (getType(until) == "string") {
                    let newPars = [];
                    pars.some(e => {
                        if (e.is(until)) {
                            return true;
                        }
                        newPars.push(e);
                    });
                    pars = newPars;
                }
            }

            return pars;
        }

        clone() {
            let cloneEle = createXEle(this.ele.cloneNode(true));

            // 数据重新设置
            Object.keys(this).forEach(key => {
                if (key !== "tag") {
                    cloneEle[key] = this[key];
                }
            });

            return cloneEle;
        }

        splice(index, howmany, ...items) {
            const {
                ele
            } = this;
            const children = Array.from(ele.children);

            // 删除相应元素
            const removes = [];
            let b_index = index;
            let b_howmany = howmany;
            let target = children[b_index];
            while (target && b_howmany > 0) {
                removes.push(target);
                ele.removeChild(target);
                b_index++;
                b_howmany--;
                target = children[b_index];
            }

            // 新增元素
            if (items.length) {
                let fragEle = document.createDocumentFragment();
                items.forEach(e => {
                    if (e instanceof Element) {
                        fragEle.appendChild(e);
                        return;
                    }

                    let type = getType(e);

                    if (type == "string") {
                        parseStringToDom(e).forEach(e2 => {
                            fragEle.appendChild(e2);
                        });
                    } else if (type == "object") {
                        fragEle.appendChild(parseDataToDom(e));
                    }
                });

                if (index >= this.length) {
                    // 在末尾添加元素
                    ele.appendChild(fragEle);
                } else {
                    // 指定index插入
                    ele.insertBefore(fragEle, ele.children[index]);
                }
            }

            return removes;
        }
    }
    // DOM自带事件，何必舍近求远
    const getEventsMap = (target) => {
        return target[EVENTS] ? target[EVENTS] : (target[EVENTS] = new Map());
    }

    extend(XEle.prototype, {
        on(name, selector, callback) {
            if (isFunction(selector)) {
                callback = selector;
                selector = undefined;
                this.ele.addEventListener(name, callback);
                const eid = "e_" + getRandomId()
                getEventsMap(this).set(eid, {
                    name,
                    selector,
                    callback
                });
                return eid;
            }
        },
        off(eid) {
            let d = getEventsMap(this).get(eid);

            if (!d) {
                return false;
            }

            this.ele.removeEventListener(d.name, d.callback);
            this[EVENTS].delete(eid);
            return true;
        },
        one(name, selector, callback) {
            let eid, func;
            if (typeof selector == "string") {
                func = callback;
                callback = (e) => {
                    func(e);
                    this.off(eid);
                }
            } else {
                func = selector;
                selector = (e) => {
                    func(e);
                    this.off(eid);
                }
            }

            eid = this.on(name, selector, callback);

            return eid;
        },
        emit(name, data) {

        },
        emitHandler(name, data) {

        }
    });


    function $(expr) {
        if (expr instanceof Element) {
            return createXEle(expr);
        }

        const exprType = getType(expr);

        if (exprType == "string") {
            if (!/\<.+\>/.test(expr)) {
                return createXEle(document.querySelector(expr));
            } else {
                return createXEle(parseStringToDom(expr)[0]);
            }
        } else if (exprType == "object") {
            return createXEle(parseDataToDom(expr));
        }

        return null;
    }

    $.all = (expr) => {
        return Array.from(document.querySelectorAll(expr)).map(e => createXEle(e));
    }

    glo.$ = $
})(window);