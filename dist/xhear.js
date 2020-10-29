/*!
 * xhear v5.2.0
 * https://github.com/kirakiray/Xhear#readme
 * 
 * (c) 2018-2020 YAO
 * Released under the MIT License.
 */
((glo) => {
    "use strict";
    const getRandomId = () => Math.random().toString(32).substr(2);
    let objectToString = Object.prototype.toString;
    const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
    const isUndefined = val => val === undefined;
    const isFunction = val => getType(val).includes("function");
    const cloneObject = obj => JSON.parse(JSON.stringify(obj));

    const nextTick = (() => {
        let isDebug = document.currentScript.getAttribute("debug") !== null;
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

        let inTick = false;

        // 定位对象寄存器
        let nextTickMap = new Map();

        let pnext = setTimeout;

        if (typeof process === "object" && process.nextTick) {
            pnext = process.nextTick;
        }

        return (fun, key) => {
            if (!inTick) {
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
            }

            if (!key) {
                key = getRandomId();
            }

            nextTickMap.set(key, {
                key,
                fun
            });
        };
    })();

    // 触发update事件
    const emitUpdate = (target, name, args, assingData) => {
        let mid;

        if (target._modifyId) {
            mid = target._modifyId;
        } else {
            mid = getRandomId();
        }

        getXDataProp(target, MODIFYIDS).push(mid);
        recyclModifys(target);

        // 事件冒泡
        let event = new XEvent({
            type: "update",
            target: target[PROXYTHIS] || target
        });

        Object.defineProperties(event, {
            trend: {
                get() {
                    return new XDataTrend(event);
                }
            }
        });

        assingData && Object.assign(event, assingData);

        // 设置modify数据
        event.modify = {
            name,
            args: args.map(e => {
                if (e instanceof XData) {
                    return e.object;
                } else if (e instanceof Object) {
                    return cloneObject(e);
                }
                return e;
            }),
            mid
        };

        // 冒泡update
        target.emit(event);
    }

    // 清理modifys
    let recyTimer, recyArr = new Set();
    const recyclModifys = (xobj) => {
        // 不满50个别瞎折腾
        if (xobj[MODIFYIDS].length < 50) {
            return;
        }

        clearTimeout(recyTimer);
        recyArr.add(xobj);
        recyTimer = setTimeout(() => {
            let copyRecyArr = Array.from(recyArr);
            setTimeout(() => {
                copyRecyArr.forEach(e => recyclModifys(e));
            }, 1000);
            recyArr.forEach(e => {
                let modifys = e[MODIFYIDS]
                // 清除掉一半
                modifys.splice(0, Math.ceil(modifys.length / 2));
            });
            recyArr.clear();
        }, 3000)
    }

    // 清理XData数据
    const clearXData = (xobj) => {
        if (!(xobj instanceof XData)) {
            return;
        }
        let _this = xobj[XDATASELF];
        if (_this) {
            try {
                // 防止index和parent被重定向导致失败
                _this.index = undefined;
                _this.parent = undefined;
            } catch (e) {}
        }

        // 解除virData绑定
        if (xobj instanceof VirData) {
            let {
                mappingXData
            } = xobj;
            let tarHostData = mappingXData[VIRDATAHOST].find(e => e.data === _this);
            let {
                leftUpdate,
                rightUpdate
            } = tarHostData;
            xobj.off("update", rightUpdate);
            mappingXData.off("update", leftUpdate);
            _this.mappingXData = null;
        }

        // 清除sync
        if (_this[SYNCSHOST]) {
            for (let [oppXdata, e] of _this[SYNCSHOST]) {
                xobj.unsync(oppXdata);
            }
        }

        if (_this[VIRDATAHOST]) {
            _this[VIRDATAHOST].forEach(e => {
                let {
                    data,
                    leftUpdate,
                    rightUpdate
                } = e;
                data.off("update", rightUpdate);
                _this.off("update", leftUpdate);
                data.mappingXData = null;
            });
            _this[VIRDATAHOST].splice(0);
        }
        _this[WATCHHOST] && _this[WATCHHOST].clear();
        _this[EVENTS] && _this[EVENTS].clear();
    }

    /**
     * 生成XData数据
     * @param {Object} obj 对象值，是Object就转换数据
     * @param {Object} options 附加信息，记录相对父层的数据
     */
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

    /**
     * 将 stanz 转换的对象再转化为 children 结构的对象
     * @param {Object} obj 目标对象
     * @param {String} childKey 数组寄存属性
     */
    const toNoStanz = (obj, childKey) => {
        if (obj instanceof Array) {
            return obj.map(e => toNoStanz(e, childKey));
        } else if (obj instanceof Object) {
            let newObj = {};
            let childs = [];
            Object.keys(obj).forEach(k => {
                if (!/\D/.test(k)) {
                    childs.push(toNoStanz(obj[k], childKey));
                } else {
                    newObj[k] = toNoStanz(obj[k]);
                }
            });
            if (childs.length) {
                newObj[childKey] = childs;
            }
            return newObj;
        } else {
            return obj;
        }
    }

    // common
    const EVENTS = Symbol("events");

    // 获取事件队列
    const getEventsArr = (eventName, tar) => {
        let eventHost = tar[EVENTS];

        if (!eventHost) {
            eventHost = new Map();
            Object.defineProperty(tar, EVENTS, {
                value: eventHost
            });
        }

        let tarEves = eventHost.get(eventName);
        if (!tarEves) {
            tarEves = [];
            eventHost.set(eventName, tarEves);
        }
        return tarEves;
    };

    /**
     * 转换为事件对象
     * @param {String|XEvent} eventName 事件对象或事件名
     * @param {Object} _this 目标元素
     */
    const transToEvent = (eventName, _this) => {
        let event;
        // 不是实例对象的话，重新生成
        if (!(eventName instanceof XEvent)) {
            event = new XEvent({
                type: eventName,
                target: _this[PROXYTHIS] || _this
            });
        } else {
            event = eventName;
            eventName = event.type;
        }
        return event;
    }

    /**
     * 事件触发器升级版，可设置父节点，会模拟冒泡操作
     * @class XEmiter
     * @constructor
     * @param {Object} options 
     */
    class XEmiter {
        constructor(options = {}) {
            Object.defineProperties(this, {
                // 记录事件用的Map对象
                // [EVENTS]: {
                //     value: new Map()
                // },
                // 父对象
                parent: {
                    writable: true,
                    value: options.parent,
                    configurable: true
                },
                index: {
                    writable: true,
                    value: options.index,
                    configurable: true
                }
            });
        }

        /**
         * 注册事件
         * @param {String} type 注册的事件名
         * @param {Function} callback 注册事件的回调函数
         * @param {Object} data 注册事件的自定义数据
         */
        on(type, callback, data) {
            this.addListener({
                type,
                data,
                callback
            });
        }

        /**
         * 注册一次性事件
         * @param {String} type 注册的事件名
         * @param {Function} callback 注册事件的回调函数
         * @param {Object} data 注册事件的自定义数据
         */
        one(type, callback, data) {
            this.addListener({
                count: 1,
                type,
                data,
                callback
            });
        }

        /**
         * 外部注册事件统一到内部的注册方法
         * @param {Object} opts 注册事件对象参数
         */
        addListener(opts = {}) {
            let {
                type,
                data,
                callback,
                // 事件可触发次数
                count = Infinity,
                eventId
            } = opts;

            if (!type) {
                throw {
                    desc: "addListener no type",
                    options: opts
                };
            }

            // 分解id参数
            let spIdArr = type.split('#');
            if (1 in spIdArr) {
                type = spIdArr[0];
                eventId = spIdArr[1];
            }

            let evesArr = getEventsArr(type, this);

            if (!isUndefined(eventId)) {
                // 判断是否存在过这个id的事件注册过
                // 注册过这个id的把旧的删除
                Array.from(evesArr).some((opt) => {
                    // 想等值得删除
                    if (opt.eventId === eventId) {
                        let id = evesArr.indexOf(opt);
                        if (id > -1) {
                            evesArr.splice(id, 1);
                        }
                        return true;
                    }
                });
            }

            callback && evesArr.push({
                type,
                data,
                callback,
                eventId,
                count
            });
        }

        /**
         * 注销事件
         * @param {String} eventName 需要注销的事件名
         * @param {Function} callback 注销的事件函数
         */
        off(eventName, callback) {
            if (!eventName) {
                return;
            }
            if (callback) {
                let evesArr = getEventsArr(eventName, this);
                let tarId = evesArr.findIndex(e => e.callback == callback);
                (tarId > -1) && evesArr.splice(tarId, 1);
            } else {
                // this[EVENTS] && this[EVENTS].delete(eventName);
                // 防止误操作，必须填入event
                throw {
                    desc: `off must have callback`
                };
            }
        }

        /**
         * 触发事件
         * 不会触发冒泡
         * @param {String|XEvent} eventName 触发的事件名
         * @param {Object} emitData 触发事件的自定义数据
         */
        emitHandler(eventName, emitData) {
            let event = transToEvent(eventName, this);
            eventName = event.type;

            let evesArr = getEventsArr(eventName, this);

            // 需要去除的事件对象
            let needRmove = [];

            // 修正currentTarget
            event.currentTarget = this[PROXYTHIS] || this;

            // 触发callback函数
            evesArr.some(e => {
                e.data && (event.data = e.data);
                e.eventId && (event.eventId = e.eventId);

                // 中转确认对象
                let middleObj = {
                    self: this,
                    event,
                    emitData
                };

                let isRun = e.before ? e.before(middleObj) : 1;

                isRun && e.callback.call(this[PROXYTHIS] || this, event, emitData);

                e.after && e.after(middleObj);

                delete event.data;
                delete event.eventId;

                e.count--;

                if (!e.count) {
                    needRmove.push(e);
                }

                if (event.cancel) {
                    return true;
                }
            });

            delete event.currentTarget;

            // 去除count为0的事件记录对象
            needRmove.forEach(e => {
                let id = evesArr.indexOf(e);
                (id > -1) && evesArr.splice(id, 1);
            });

            return event;
        }

        /**
         * 触发事件
         * 带有冒泡状态
         * @param {String|XEvent} eventName 触发的事件名
         * @param {Object} emitData 触发事件的自定义数据
         */
        emit(eventName, emitData) {
            let event = this.emitHandler(eventName, emitData);

            // 判断父层并冒泡
            if (event.bubble && !event.cancel) {
                let {
                    parent
                } = this;

                if (parent) {
                    event.keys.unshift(this.index);
                    parent.emit(event, emitData);
                }
            }
        }
    }

    /**
     * 事件记录对象
     * @class XEvent
     * @constructor
     * @param {String} type 事件名称
     */
    class XEvent extends XEmiter {
        constructor(opt) {
            super();
            this.type = opt.type;
            this.target = opt.target;
            this._bubble = true;
            this._cancel = false;
            this.keys = [];
        }

        get bubble() {
            return this._bubble;
        }
        set bubble(val) {
            if (this._bubble === val) {
                return;
            }
            this.emitHandler(`set-bubble`, val);
            this._bubble = val;
        }
        get cancel() {
            return this._cancel;
        }
        set cancel(val) {
            if (this._cancel === val) {
                return;
            }
            this.emitHandler(`set-cancel`, val);
            this._cancel = val;
        }
    }

    // get 可直接获取的正则
    // const GET_REG = /^_.+|^parent$|^index$|^length$|^object$/;
    const GET_REG = /^_.+|^index$|^length$|^object$|^getData$|^setData$/;
    // set 不能设置的Key的正则
    const SET_NO_REG = /^parent$|^index$|^length$|^object$/

    let XDataHandler = {
        get(target, key, receiver) {
            // 私有变量直接通过
            if (typeof key === "symbol" || GET_REG.test(key)) {
                return Reflect.get(target, key, receiver);
            }

            return target.getData(key);
        },
        set(target, key, value, receiver) {
            // 私有变量直接通过
            // 数组函数运行中直接通过
            if (typeof key === "symbol") {
                return Reflect.set(target, key, value, receiver);
            }

            return target.setData(key, value)
        }
    };

    const PROXYTHIS = Symbol("proxyThis");

    // 未Proxy时的自身
    const XDATASELF = Symbol("XDataSelf");

    // watch寄存数据
    const WATCHHOST = Symbol("WatchHost");

    // modifyId寄存
    const MODIFYIDS = Symbol("ModifyIDS");

    // sync寄存
    const SYNCSHOST = Symbol("SyncHost");

    // virData寄存器
    const VIRDATAHOST = Symbol("VirDataHost");

    const STANZID = Symbol("StanzID");

    /**
     * 获取对象内置数据
     * 这个操作是为了节省内存用的
     * @param {XData} target 目标元素
     * @param {Symbol} key 需要获取的元素key
     */
    const getXDataProp = (target, key) => {
        let value = target[key];

        if (!value) {
            switch (key) {
                case WATCHHOST:
                case SYNCSHOST:
                    value = new Map();
                    break;
                case MODIFYIDS:
                case VIRDATAHOST:
                    value = [];
                    break;
            }
            Object.defineProperty(target, key, {
                value
            });
        }

        return value;
    }

    const hasElement = typeof Element !== "undefined";

    /**
     * 事件触发器升级版，可设置父节点，会模拟冒泡操作
     * @class
     * @constructor
     * @param {Object} obj 合并到实例上的数据对象
     * @param {Object} opts 合并选项
     * @returns {ArrayLike} 当前实例，会根据XData上的
     */
    class XData extends XEmiter {
        constructor(obj, opts = {}) {
            super(opts);

            let proxyThis = new Proxy(this, XDataHandler);

            // 重新计算当前数据的数组长度
            let length = 0;

            // 数据合并
            Object.keys(obj).forEach(k => {
                // 值
                let value = obj[k];

                if (/^\_/.test(k) || (hasElement && value instanceof Element)) {
                    // this[k] = obj[k];
                    Object.defineProperty(this, k, {
                        configurable: true,
                        writable: true,
                        value
                    });
                    return;
                }

                if (!/\D/.test(k)) {
                    // 数字key进行length长度计算
                    k = parseInt(k);

                    if (k >= length) {
                        length = k + 1;
                    }
                }

                if (value instanceof Object) {
                    this[k] = new XData(value, {
                        parent: this,
                        index: k
                    });
                } else {
                    this[k] = value;
                }
            });

            const xid = getRandomId();

            Object.defineProperties(this, {
                [XDATASELF]: {
                    get: () => this
                },
                [PROXYTHIS]: {
                    value: proxyThis
                },
                [STANZID]: {
                    value: xid
                },
                xid: {
                    get() {
                        return xid;
                    }
                },
                // [WATCHHOST]: {
                //     value: new Map()
                // },
                // [MODIFYIDS]: {
                //     value: []
                // },
                // [SYNCSHOST]: {
                //     value: new Map()
                // },
                _modifyId: {
                    value: null,
                    writable: true
                },
                // 当前实例数组长度
                length: {
                    configurable: true,
                    writable: true,
                    value: length
                }
            });
        }

        /**
         * 合并数据到实例对象
         * @param {Object} opts 设置当前数据
         */
        setData(key, value) {
            if (SET_NO_REG.test(key)) {
                console.warn(`you can't set this key in XData => `, key);
                return false;
            }

            if (/^_.+/.test(key)) {
                Object.defineProperty(this, key, {
                    configurable: true,
                    writable: true,
                    value
                })
                return true;
            }

            let _this = this[XDATASELF];

            // 是否 point key
            if (/\./.test(key)) {
                let kMap = key.split(".");
                let lastId = kMap.length - 1;
                kMap.some((k, i) => {
                    if (i == lastId) {
                        key = k;
                        return true;
                    }
                    _this = _this[k];
                });
                _this.setData(key, value);
                return true;
            }

            if (getType(key) === "string") {
                let oldVal = _this[key];

                if (value === oldVal) {
                    // 一样还瞎折腾干嘛
                    return true;
                }

                if (oldVal instanceof XData) {
                    oldVal = oldVal.object;
                }

                // 去除旧的依赖
                if (value instanceof XData) {
                    value = value[XDATASELF];
                    value.remove();

                    value.parent = _this;
                    value.index = key;
                } else if (value instanceof Object) {
                    // 如果是Object就转换数据
                    value = createXData(value, {
                        parent: _this,
                        index: key
                    });
                }

                _this[key] = value;

                emitUpdate(_this, "setData", [key, value], {
                    oldValue: oldVal
                });

                return true;

            } else if (key instanceof Object) {
                let data = key;
                Object.keys(data).forEach(key => {
                    let value = data[key];

                    _this.setData(key, value);
                });

                return true;
            }
        }

        /**
         * 获取相应数据，相比直接获取，会代理得到数组类型相应的index的值
         * @param {String} keyName 获取当前实例相应 key 的数据
         */
        getData(keyName) {
            let target = this[keyName];

            if (target instanceof XData) {
                target = target[PROXYTHIS];
            }

            return target;
        }

        /**
         * 删除相应Key或自身
         * @param {String|NUmber|Undefined} key 需要删除的key
         */
        remove(key) {
            if (isUndefined(key)) {
                // 删除自身
                let {
                    parent
                } = this;

                if (parent) {
                    parent.remove(this.index);
                } else {
                    clearXData(this);
                }
            } else {
                let oldVal = this[key];

                // 删除子数据
                if (/\D/.test(key)) {
                    // 非数字
                    delete this[key];

                    clearXData(oldVal);

                    emitUpdate(this, "remove", [key]);
                } else {
                    // 纯数字，术语数组内元素，通过splice删除
                    this.splice(parseInt(key), 1);
                }
            }
        }

        /**
         *  深度清除当前对象，所有子对象数据也会被深度清除
         */
        deepClear() {
            // 清除非数字键
            Object.keys(this).forEach(key => {
                if (/\D/.test(key)) {
                    let obj = this[key];

                    if (obj instanceof XData) {
                        obj.deepClear();
                    }
                }
            });

            // 数组键内深度清除对象
            this.forEach(obj => {
                if (obj instanceof XData) {
                    obj.deepClear();
                }
            });

            // 清除自身
            clearXData(this);
        }

        /**
         * 从 Set 参考的方法，push的去从版
         * @param {*} value 需要添加的数据
         */
        add(value) {
            !this.includes(value) && this.push(value);
        }

        /**
         * 从 Set 参考的方法
         * @param {*} value 需要删除的数据
         */
        delete(value) {
            let tarId = this.indexOf(value);

            if (tarId > -1) {
                this.splice(tarId, 1);
            }
        }

        /**
         * 是否包含当前值
         * 同数组方法includes，好歹has只有三个字母，用起来方便
         * @param {*} value 数组内的值
         */
        has(value) {
            return this.includes(value);
        }

        /**
         * 从 Set 参考的方法
         */
        clear() {
            this.splice(0, this.length);
        }

        /**
         * 向前插入数据
         * 当前数据必须是数组子元素
         * @param {Object} data 插入的数据
         */
        before(data) {
            if (/\D/.test(this.index)) {
                throw {
                    text: `It must be an array element`,
                    target: this,
                    index: this.index
                };
            }
            this.parent.splice(this.index, 0, data);
            return this;
        }

        /**
         * 向后插入数据
         * 当前数据必须是数组子元素
         * @param {Object} data 插入的数据
         */
        after(data) {
            if (/\D/.test(this.index)) {
                throw {
                    text: `It must be an array element`,
                    target: this,
                    index: this.index
                };
            }
            this.parent.splice(this.index + 1, 0, data);
            return this;
        }

        clone() {
            return createXData(cloneObject(this))[PROXYTHIS];
        }

        // 在emitHandler后做中间件
        emitHandler(eventName, emitData) {
            let event = transToEvent(eventName, this);

            // 过滤unBubble和update的数据
            if (event.type === "update") {
                let {
                    _unBubble,
                    _update,
                    _unpush
                } = this;
                let {
                    fromKey
                } = event.trend;
                if (_update === false || (_unBubble && _unBubble.includes(fromKey))) {
                    event.bubble = false;
                    // return event;
                }

                if (_unpush && _unpush.includes(fromKey)) {
                    Object.defineProperty(event, "_unpush", {
                        value: true
                    });
                }
            }

            XEmiter.prototype.emitHandler.call(this, event, emitData);

            return event;
        }

        // 转换为children属性机构的数据
        noStanz(opts = {
            childKey: "children"
        }) {
            return toNoStanz(this.object, opts.childKey);
        }

        /**
         * 转换为普通 object 对象
         * @property {Object} object
         */
        get object() {
            let obj = {};

            let isPureArray = true;

            let {
                _unBubble = []
            } = this;

            // 遍历合并数组，并判断是否有非数字
            Object.keys(this).forEach(k => {
                if (/^_/.test(k) || !/\D/.test(k) || _unBubble.includes(k)) {
                    return;
                }

                let val = this[k];

                if (val instanceof XData) {
                    // 禁止冒泡
                    if (val._update === false) {
                        return;
                    }

                    val = val.object;
                }

                obj[k] = val;

                isPureArray = false;
            });
            this.forEach((val, k) => {
                if (val instanceof XData) {
                    val = val.object;
                }
                obj[k] = val;
            });

            // 转换为数组格式
            if (isPureArray) {
                obj.length = this.length;
                obj = Array.from(obj);
            }

            return obj;
        }

        get string() {
            return JSON.stringify(this.object);
        }

        /**
         * 获取根节点
         * @property {XData} root
         */
        get root() {
            let root = this;
            while (root.parent) {
                root = root.parent;
            }
            return root;
        }

        /**
         * 获取前一个相邻数据
         * @property {XData} prev
         */
        get prev() {
            if (!/\D/.test(this.index) && this.index > 0) {
                return this.parent.getData(this.index - 1);
            }
        }

        /**
         * 获取后一个相邻数据
         * @property {XData} after
         */
        get next() {
            if (!/\D/.test(this.index)) {
                return this.parent.getData(this.index + 1);
            }
        }

        /**
         * 根据keys获取目标对象
         * @param {Array} keys 深度键数组
         */
        getTarget(keys) {
            let target = this;
            if (keys.length) {
                keys.some(k => {
                    if (!target) {
                        console.warn("getTarget failure");
                        return true;
                    }
                    target = target[k];
                });
            }
            return target;
        }

        /**
         * 查询符合条件的对象
         * @param {String|Function} expr 需要查询的对象特征
         */
        seek(expr) {
            let arg1Type = getType(expr);

            if (arg1Type === "function") {
                let arr = [];

                let f = val => {
                    if (val instanceof XData) {
                        let isAgree = expr(val);

                        isAgree && (arr.push(val));

                        // 深入查找是否有符合的
                        let meetChilds = val.seek(expr);

                        arr = [...arr, ...meetChilds];
                    }
                }

                // 专门为Xhear优化的操作
                // 拆分后，Xhear也能为children进行遍历
                Object.keys(this).forEach(k => {
                    if (/\D/.test(k)) {
                        f(this[k]);
                    }
                });
                this.forEach(f);

                f = null;

                return arr;
            } else if (arg1Type === "string") {
                // 判断是否符合条件
                if (/^\[.+\]$/) {
                    expr = expr.replace(/[\[\]]/g, "");

                    let exprArr = expr.split("=");

                    let fun;

                    if (exprArr.length == 2) {
                        let [key, value] = exprArr;
                        fun = data => data[key] == value;
                    } else {
                        let [key] = exprArr;
                        fun = data => Object.keys(data).includes(key);
                    }

                    return this.seek(fun);
                }
            }
        }

        /**
         * 监听当前对象的值
         * 若只传callback，就监听当前对象的所有变化
         * 若 keyName，则监听对象的相应 key 的值
         * 若 seek 的表达式，则监听表达式的值是否有变化
         * @param {string} expr 监听键值，可以是 keyName 可以是 seek表达式
         * @param {Function} callback 相应值变动后出发的callback
         * @param {Boolean} ImmeOpt 是否立刻触发callback
         */
        watch(expr, callback, ImmeOpt) {
            // 调整参数
            let arg1Type = getType(expr);
            if (arg1Type === "object") {
                Object.keys(expr).forEach(k => {
                    this.watch(k, expr[k]);
                });
                return;
            } else if (/function/.test(arg1Type)) {
                ImmeOpt = callback;
                callback = expr;
                expr = "";
            }

            // 根据参数调整类型
            let watchType;

            if (expr === "") {
                watchType = "watchSelf";
            } else if (expr instanceof RegExp) {
                watchType = "watchKeyReg";
            } else if (/\[.+\]/.test(expr)) {
                watchType = "seekData";
            } else if (/\./.test(expr)) {
                watchType = "watchPointKey";
            } else {
                watchType = "watchKey";
            }

            // let targetHostObj = this[WATCHHOST].get(expr);
            // if (!targetHostObj) {
            //     targetHostObj = new Set();
            //     this[WATCHHOST].set(expr, targetHostObj)
            // }

            let targetHostObj = getXDataProp(this, WATCHHOST).get(expr);
            if (!targetHostObj) {
                targetHostObj = new Set();
                getXDataProp(this, WATCHHOST).set(expr, targetHostObj)
            }

            let cacheObj = {
                trends: [],
                callback,
                expr,
                push(t) {
                    this.trends.push(t);
                }
            };

            targetHostObj.add(cacheObj);

            let updateMethod;

            let callSelf = this[PROXYTHIS];
            switch (watchType) {
                case "watchSelf":
                    // 监听自身
                    updateMethod = e => {
                        cacheObj.push(e.trend);

                        nextTick(() => {
                            callback.call(callSelf, {
                                trends: Array.from(cacheObj.trends)
                            }, callSelf);

                            cacheObj.trends.length = 0;
                        }, cacheObj);
                    };

                    if (ImmeOpt === true) {
                        callback.call(callSelf, {
                            trends: []
                        }, callSelf);
                    }
                    break;
                case "watchKey":
                case "watchKeyReg":
                    // 监听key
                    updateMethod = e => {
                        let {
                            trend
                        } = e;
                        if ((watchType === "watchKeyReg" && expr.test(trend.fromKey)) || trend.fromKey == expr) {
                            cacheObj.push(e.trend);

                            if (!cacheObj.cacheOld) {
                                // 获取旧值
                                cacheObj._oldVal = e.oldValue instanceof XData ? e.oldValue.object : e.oldValue;
                                cacheObj.cacheOld = true;
                            }

                            nextTick(() => {
                                let val = this[expr];

                                callback.call(callSelf, {
                                    expr,
                                    val,
                                    // old: cacheObj.trends[0].args[1],
                                    old: cacheObj._oldVal,
                                    trends: Array.from(cacheObj.trends)
                                }, val);

                                cacheObj.trends.length = 0;
                                cacheObj._oldVal = cacheObj.cacheOld = false;
                            }, cacheObj);
                        }
                    };

                    if (ImmeOpt === true) {
                        callback.call(callSelf, {
                            expr,
                            val: callSelf[expr],
                            trends: []
                        }, callSelf[expr]);
                    }
                    break;
                case "watchPointKey":
                    let pointKeyArr = expr.split(".");
                    let firstKey = pointKeyArr[0];
                    let oldVal = this.getTarget(pointKeyArr);

                    updateMethod = e => {
                        let {
                            trend
                        } = e;
                        if (trend.fromKey == firstKey) {
                            oldVal;
                            let newVal;
                            try {
                                newVal = this.getTarget(pointKeyArr);
                            } catch (e) {}
                            if (newVal !== oldVal) {
                                cacheObj.push(trend);
                                nextTick(() => {
                                    newVal = this.getTarget(pointKeyArr);

                                    (newVal !== oldVal) && callback.call(callSelf, {
                                        expr,
                                        old: oldVal,
                                        val: newVal,
                                        trends: Array.from(cacheObj.trends)
                                    }, newVal);

                                    cacheObj.trends.length = 0;
                                }, cacheObj);
                            }
                        }
                    }

                    if (ImmeOpt === true) {
                        callback.call(callSelf, {
                            expr,
                            val: oldVal
                        }, oldVal);
                    }
                    break;
                case "seekData":
                    let oldVals = callSelf.seek(expr);
                    updateMethod = e => {
                        nextTick(() => {
                            let tars = callSelf.seek(expr);
                            let isEqual = 1;

                            if (tars.length === oldVals.length) {
                                tars.some(e => {
                                    if (!oldVals.includes(e)) {
                                        isEqual = 0;
                                        return true;
                                    }
                                });
                            } else {
                                isEqual = 0;
                            }

                            // 有变动就触发
                            !isEqual && callback.call(callSelf, {
                                expr,
                                old: oldVals,
                                val: tars
                            }, tars);

                            oldVals = tars;
                        }, cacheObj);
                    };

                    if (ImmeOpt === true) {
                        callback.call(callSelf, {
                            expr,
                            old: oldVals,
                            val: oldVals
                        }, oldVals);
                    }
                    break;
            }

            this.on("update", updateMethod);

            cacheObj.updateMethod = updateMethod;

            return this;
        }

        /**
         * 取消watch监听
         * @param {string} expr 监听值
         * @param {Function} callback 监听callback
         */
        unwatch(expr, callback) {
            // 调整参数
            let arg1Type = getType(expr);
            if (arg1Type === "object") {
                Object.keys(expr).forEach(k => {
                    this.unwatch(k, expr[k]);
                });
                return this;
            } else if (/function/.test(arg1Type)) {
                callback = expr;
                expr = "";
            }

            let targetHostObj = getXDataProp(this, WATCHHOST).get(expr);

            if (targetHostObj) {
                let cacheObj = Array.from(targetHostObj).find(e => e.callback === callback && e.expr === expr);

                // 清除数据绑定
                if (cacheObj) {
                    cacheObj.updateMethod && this.off("update", cacheObj.updateMethod);
                    targetHostObj.delete(cacheObj);
                    (!targetHostObj.size) && (getXDataProp(this, WATCHHOST).delete(expr));
                }
            }

            return this;
        }

        /**
         * 监听表达式为正确时就返回成功
         * @param {String} expr 监听表达式
         */
        watchUntil(expr) {
            if (/[^=]=[^=]/.test(expr)) {
                throw 'cannot use single =';
            }
            return new Promise(resolve => {
                let f;
                // 忽略错误
                let exprFun = new Function(`
            try{with(this){
                return ${expr}
            }}catch(e){}`).bind(this);
                this.watch(f = () => {
                    let reVal = exprFun();
                    if (reVal) {
                        this.unwatch(f);
                        resolve(reVal);
                    }
                }, true);
            });
        }

        /**
         * 趋势数据的入口，用于同步数据
         * @param {Object} trend 趋势数据
         */
        entrend(trend) {
            let {
                mid,
                keys,
                name,
                args,
                _unpush
            } = trend;

            if (_unpush) {
                // 不同步的就返回
                return;
            }

            let {
                _unpull
            } = this;
            let fkey = getFromKey(trend);
            if (_unpull && _unpull.includes(fkey)) {
                return;
            }

            if (!mid) {
                throw {
                    text: "Illegal trend data"
                };
            }

            // 获取相应目标，并运行方法
            let target = this.getTarget(keys);

            if (target) {
                let targetSelf = target[XDATASELF];
                if (getXDataProp(targetSelf, MODIFYIDS).includes(mid)) {
                    return false;
                }

                targetSelf._modifyId = mid;
                // target._modifyId = mid;
                targetSelf[name](...args);
                targetSelf._modifyId = null;
            }

            return true;
        }
    }

    const getFromKey = (_this) => {
        let keyOne = _this.keys[0];

        if (isUndefined(keyOne) && (_this.name === "setData" || _this.name === "remove")) {
            keyOne = _this.args[0];
        }

        return keyOne;
    }

    /**
     * trend数据class，记录趋势数据
     * XData的每次数据变动（值变动或数组变动），都会生成趋势数据
     * @class XDataTrend
     * @constructor
     */
    class XDataTrend {
        constructor(xevent) {
            if (xevent instanceof XEvent) {
                // 元对象数据会被修改，必须深克隆数据
                let {
                    modify: {
                        name,
                        args,
                        mid
                    },
                    keys
                } = cloneObject(xevent);
                let {
                    _unpush
                } = xevent;
                // let { modify: { name, args, mid }, keys, _unpush } = xevent;

                if (_unpush) {
                    Object.defineProperty(this, "_unpush", {
                        value: true
                    });
                }

                Object.assign(this, {
                    name,
                    args,
                    mid,
                    keys
                });

            } else {
                Object.assign(this, xevent);
            }
        }

        /**
         * 转换后的字符串
         */
        get string() {
            return JSON.stringify(this);
        }

        get finalSetterKey() {
            switch (this.name) {
                case "remove":
                case "setData":
                    return this.args[0];
            }
        }

        get fromKey() {
            return getFromKey(this);

            // let keyOne = this.keys[0];

            // if (isUndefined(keyOne) && (this.name === "setData" || this.name === "remove")) {
            //     keyOne = this.args[0];
            // }

            // return keyOne;
        }

        set fromKey(keyName) {
            let keyOne = this.keys[0];

            if (!isUndefined(keyOne)) {
                this.keys[0] = keyName;
            } else if (this.name === "setData" || this.name === "remove") {
                this.args[0] = keyName;
            }
        }
    }

    /**
     * 根据key值同步数据
     * @param {String} key 要同步的key
     * @param {Trend} e 趋势数据
     * @param {XData} xdata 同步覆盖的数据对象
     */
    const pubSyncByKey = (key, e, xdata) => {
        e.trends.forEach(trend => {
            if (trend.fromKey === key) {
                xdata.entrend(trend);
            }
        });
    }

    /**
     * 根据key数组同步数据
     * @param {String} keyArr 要同步的key数组
     * @param {Trend} e 趋势数据
     * @param {XData} xdata 同步覆盖的数据对象
     */
    const pubSyncByArray = (keyArr, e, xdata) => {
        e.trends.forEach(trend => {
            if (keyArr.includes(trend.fromKey)) {
                xdata.entrend(trend);
            }
        });
    }

    /**
     * 根据映射对象同步数据
     * @param {Map} optMap key映射对象
     * @param {Trend} e 趋势数据
     * @param {XData} xdata 同步覆盖的数据对象
     */
    const pubSyncByObject = (optMap, e, xdata) => {
        let cloneTrends = cloneObject(e.trends);
        cloneTrends.forEach(trend => {
            trend = new XDataTrend(trend);
            let {
                fromKey
            } = trend;
            // 修正key值
            if (!isUndefined(fromKey)) {
                let mKey = optMap.get(fromKey)
                if (mKey) {
                    trend.fromKey = mKey;
                    xdata.entrend(trend);
                }
            }
        });
    }

    /**
     * 转换可以直接设置在XData上的值
     * @param {*} value 如果是XData，转换为普通对象数据
     */
    const getNewSyncValue = (value) => {
        (value instanceof XData) && (value = value.object);
        return value;
    };

    const virDataTrans = (self, target, callback) => {
        Object.keys(self).forEach(key => {
            let val = self[key];

            if (val instanceof Object) {
                if (!target[key]) {
                    if (target.setData) {
                        target.setData(key, {})
                    } else {
                        target[key] = {};
                    }
                }

                let vdata = target[key];

                virDataTrans(val, vdata, callback);
            } else {
                let keyValue = callback([key, val], {
                    self,
                    target
                });
                if (keyValue) {
                    let [newKey, newValue] = keyValue;
                    target[newKey] = newValue;
                }
            }
        });
    }

    const entrendByCall = (target, e, callback) => {
        let {
            trend
        } = e;
        if (trend) {
            switch (trend.name) {
                case "setData":
                    let value = trend.args[1];
                    if (value instanceof Object) {
                        let obj = {};
                        virDataTrans(value, obj, callback);
                        trend.args[1] = obj;
                    } else if (!isUndefined(value)) {
                        trend.args = callback(trend.args, {
                            event: e
                        });
                    }
                    break;
                default:
                    // 其他数组的话，修正参数
                    trend.args = trend.args.map(value => {
                        let nVal = value;
                        if (value instanceof Object) {
                            nVal = {};
                            virDataTrans(value, nVal, callback);
                        }
                        return nVal;
                    });
                    break;
            }
            target.entrend(trend);
        }
    }

    const SyncMethods = {
        /**
         * 同步数据
         * @param {XData} xdata 需要同步的数据
         */
        sync(xdata, opts, isCoverRight) {
            let optsType = getType(opts);

            let leftFun, rightFun;

            switch (optsType) {
                case "string":
                    if (isCoverRight) {
                        xdata.setData(opts, getNewSyncValue(this[opts]));
                    }

                    leftFun = e => pubSyncByKey(opts, e, xdata)
                    rightFun = e => pubSyncByKey(opts, e, this)
                    break;
                case "array":
                    if (isCoverRight) {
                        opts.forEach(key => {
                            xdata.setData(key, getNewSyncValue(this[key]));
                        });
                    }

                    leftFun = e => pubSyncByArray(opts, e, xdata)
                    rightFun = e => pubSyncByArray(opts, e, this)
                    break;
                case "object":
                    let optMap = new Map(Object.entries(opts));
                    let resOptsMap = new Map(Object.entries(opts).map(arr => arr.reverse()));

                    if (isCoverRight) {
                        Object.keys(opts).forEach(key => {
                            xdata.setData(opts[key], getNewSyncValue(this[key]));
                        });
                    }

                    leftFun = e => pubSyncByObject(optMap, e, xdata)
                    rightFun = e => pubSyncByObject(resOptsMap, e, this)
                    break
                default:
                    if (isCoverRight) {
                        let obj = this.object;

                        Object.keys(obj).forEach(k => {
                            xdata.setData(k, obj[k]);
                        });
                    }

                    leftFun = e => e.trends.forEach(trend => xdata.entrend(trend))
                    rightFun = e => e.trends.forEach(trend => this.entrend(trend))
                    break;
            }

            this.watch(leftFun);
            xdata.watch(rightFun);

            let sHost = getXDataProp(this, SYNCSHOST);

            // 把之前的绑定操作清除
            if (sHost.has(xdata)) {
                this.unsync(xdata);
            }

            // 记录信息
            sHost.set(xdata, {
                selfWatch: leftFun,
                oppWatch: rightFun
            });
            getXDataProp(xdata, SYNCSHOST).set(this, {
                selfWatch: rightFun,
                oppWatch: leftFun
            });
        },
        /**
         * 取消同步数据
         * @param {XData} xdata 需要取消同步的数据
         */
        unsync(xdata) {
            let syncData = getXDataProp(this, SYNCSHOST).get(xdata);

            if (syncData) {
                let {
                    selfWatch,
                    oppWatch
                } = syncData;
                this.unwatch(selfWatch);
                xdata.unwatch(oppWatch);
                getXDataProp(this, SYNCSHOST).delete(xdata);
                getXDataProp(xdata, SYNCSHOST).delete(this);
            }
        },
        /**
         * 生成虚拟数据
         */
        virData(leftCall, rightCall) {
            // 初始生成数据
            let vdata = new VirData(this[XDATASELF], {});
            let arg1Type = getType(leftCall);
            let mapOpts = leftCall;

            if (arg1Type == "object") {
                if ("mapKey" in mapOpts) {
                    let mappingOpt = Object.entries(mapOpts.mapKey);
                    let mapping = new Map(mappingOpt);
                    let resMapping = new Map(mappingOpt.map(e => e.reverse()));

                    leftCall = ([key, value]) => {
                        if (mapping.has(key)) {
                            return [mapping.get(key), value];
                        }
                        return [key, value];
                    }
                    rightCall = ([key, value]) => {
                        if (resMapping.has(key)) {
                            return [resMapping.get(key), value];
                        }
                        return [key, value];
                    }
                } else if ("mapValue" in mapOpts) {
                    let tarKey = mapOpts.key;
                    let mappingOpt = Object.entries(mapOpts.mapValue);
                    let mapping = new Map(mappingOpt);
                    let resMapping = new Map(mappingOpt.map(e => e.reverse()));

                    leftCall = ([key, value]) => {
                        if (key === tarKey && mapping.has(value)) {
                            return [key, mapping.get(value)];
                        }
                        return [key, value];
                    }
                    rightCall = ([key, value]) => {
                        if (key === tarKey && resMapping.has(value)) {
                            return [key, resMapping.get(value)];
                        }
                        return [key, value];
                    }
                }
            }
            // 转换数据
            virDataTrans(this, vdata, leftCall);

            let leftUpdate, rightUpdate;

            this.on("update", leftUpdate = e => entrendByCall(vdata, e, leftCall));
            vdata.on("update", rightUpdate = e => entrendByCall(this, e, rightCall));

            // 记录信息
            getXDataProp(this, VIRDATAHOST).push({
                data: vdata,
                leftUpdate,
                rightUpdate
            });

            return vdata[PROXYTHIS];
        }
    };

    Object.keys(SyncMethods).forEach(methodName => {
        Object.defineProperty(XData.prototype, methodName, {
            writable: true,
            value: SyncMethods[methodName]
        });
    });

    class VirData extends XData {
        constructor(xdata, ...args) {
            super(...args);
            Object.defineProperty(this, "mappingXData", {
                writable: true,
                value: xdata
            });
        }
    }

    // 重构Array的所有方法

    // 不影响数据原结构的方法，重新做钩子
    ['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'lastIndexOf', 'includes', 'join'].forEach(methodName => {
        let arrayFnFunc = Array.prototype[methodName];
        if (arrayFnFunc) {
            Object.defineProperty(XData.prototype, methodName, {
                value(...args) {
                    return arrayFnFunc.apply(this, args);
                }
            });
        }
    });

    // 触发updateIndex事件
    const emitXDataIndex = (e, index, oldIndex) => {
        if (index !== oldIndex) {
            e.emitHandler("updateIndex", {
                oldIndex,
                index
            });
        }
    }

    // 几个会改变数据结构的方法
    ['pop', 'push', 'reverse', 'splice', 'shift', 'unshift'].forEach(methodName => {
        // 原来的数组方法
        let arrayFnFunc = Array.prototype[methodName];

        if (arrayFnFunc) {
            Object.defineProperty(XData.prototype, methodName, {
                value(...args) {
                    // 重构新参数
                    let newArgs = [];

                    let _this = this[XDATASELF];

                    let oldValue = _this.object;

                    args.forEach(val => {
                        if (val instanceof XData) {
                            let xSelf = val[XDATASELF];
                            xSelf.remove();
                            newArgs.push(xSelf);
                        } else {
                            // 转化内部数据
                            let newVal = createXData(val, {
                                parent: _this
                            });
                            newArgs.push(newVal);
                        }
                    });

                    // pop shift splice 的返回值，都是被删除的数据，内部数据清空并回收
                    let returnVal = arrayFnFunc.apply(_this, newArgs);

                    // 重置index
                    _this.forEach((e, i) => {
                        if (e instanceof XData) {
                            let oldIndex = e.index;
                            e.index = i;
                            emitXDataIndex(e, i, oldIndex);
                        }
                    });

                    // 删除returnVal的相关数据
                    switch (methodName) {
                        case "shift":
                        case "pop":
                            if (returnVal instanceof XData) {
                                clearXData(returnVal);
                            }
                            break;
                        case "splice":
                            returnVal.forEach(e => {
                                if (e instanceof XData) {
                                    clearXData(e);
                                }
                            });
                    }

                    emitUpdate(_this, methodName, args, {
                        oldValue
                    });

                    return returnVal;
                }
            });
        }
    });

    Object.defineProperties(XData.prototype, {
        sort: {
            value(arg) {
                let args = [];
                let _this = this[XDATASELF];
                let oldValue = _this.object;
                let oldThis = Array.from(_this);
                if (isFunction(arg) || !arg) {
                    Array.prototype.sort.call(_this, arg);

                    // 重置index
                    // 记录重新调整的顺序
                    _this.forEach((e, i) => {
                        if (e instanceof XData) {
                            let oldIndex = e.index;
                            e.index = i;
                            emitXDataIndex(e, i, oldIndex);
                        }
                    });
                    let orders = oldThis.map(e => e.index);
                    args = [orders];
                    oldThis = null;
                } else if (arg instanceof Array) {
                    arg.forEach((aid, id) => {
                        let tarData = _this[aid] = oldThis[id];
                        let oldIndex = tarData.index;
                        tarData.index = aid;
                        emitXDataIndex(tarData, aid, oldIndex);
                    });
                    args = [arg];
                }

                emitUpdate(_this, "sort", args, {
                    oldValue
                });

                return this;
            }
        }
    });
    // business function
    // 判断元素是否符合条件
    const meetsEle = (ele, expr) => {
        if (ele === expr) {
            return !0;
        }
        if (ele === document) {
            return false;
        }
        let tempEle = document.createElement('template');
        let html = `<${ele.tagName.toLowerCase()} ${Array.from(ele.attributes).map(e => e.name + '="' + e.value + '"').join(" ")} />`

        tempEle.innerHTML = html;
        return !!tempEle.content.querySelector(expr);
    }

    // 转换元素
    const parseStringToDom = (str) => {
        let par = document.createElement('div');
        par.innerHTML = str;
        let childs = Array.from(par.childNodes);
        return childs.filter(function(e) {
            if (!(e instanceof Text) || (e.textContent && e.textContent.trim())) {
                par.removeChild(e);
                return e;
            }
        });
    };

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
        let {
            data
        } = objData;
        data && Object.keys(data).forEach(k => {
            let val = data[k];
            ele.dataset[k] = val;
        });

        if (ele.xvele) {
            let xhearele = createXhearEle(ele);

            xhearele[CANSETKEYS].forEach(k => {
                let val = objData[k];
                if (!isUndefined(val)) {
                    xhearele[k] = val;
                }
            });
        }

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

    const parseToDom = (expr) => {
        let ele;

        if (expr instanceof XhearEle) {
            return expr.ele;
        }

        switch (getType(expr)) {
            case "string":
                if (/\<.+\>/.test(expr)) {
                    ele = parseStringToDom(expr);
                    ele = ele[0];
                }
                break;
            case "object":
                ele = parseDataToDom(expr);
                break;
            default:
                if (expr instanceof Element || expr instanceof DocumentFragment || expr instanceof Document) {
                    ele = expr;
                }
        }
        return ele;
    }

    /**
     * 查找元素内相匹配的元素，并以数组形式返回
     * @param {Element} target 目标节点
     * @param {String} expr 表达字符串
     */
    const queAllToArray = (target, expr) => {
        let tars = target.querySelectorAll(expr);
        return tars ? Array.from(tars) : [];
    }

    const isXhear = (target) => target instanceof XhearEle;

    // 将 element attribute 横杠转换为大小写模式
    const attrToProp = key => {
        // 判断是否有横线
        if (/\-/.test(key)) {
            key = key.replace(/\-[\D]/g, (letter) => letter.substr(1).toUpperCase());
        }
        return key;
    }
    const propToAttr = key => {
        if (/[A-Z]/.test(key)) {
            key = key.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
        }
        return key;
    }

    // 设置属性
    const attrsHandler = {
        get: function(target, prop) {
            return target._ele.getAttribute(propToAttr(prop));
        },
        set: function(target, prop, value) {
            if (value === null) {
                target._ele.removeAttribute(propToAttr(prop));
            } else {
                target._ele.setAttribute(propToAttr(prop), String(value));
            }

            return true;
        }
    };

    /**
     * 元素 attributes 代理对象
     */
    class Attrs {
        constructor(ele) {
            Object.defineProperties(this, {
                _ele: {
                    get: () => ele
                }
            });
        }
    }

    /**
     * 生成代理attrs对象
     * @param {HTMLElement} ele 目标html元素
     */
    const createProxyAttrs = (ele) => {
        let proxyAttrs = ele.__p_attrs;

        if (!proxyAttrs) {
            ele.__p_attrs = proxyAttrs = new Proxy(new Attrs(ele), attrsHandler);
        }

        return proxyAttrs;
    }
    // 可setData的key
    const CANSETKEYS = Symbol("cansetkeys");
    const ORIEVE = Symbol("orignEvents");

    // 可直接设置的Key
    const xEleDefaultSetKeys = new Set(["text", "html", "display", "style"]);

    // 可直接设置的Key并且能冒泡（在普通元素下，非组件）
    // const xEleDefaultSetKeysCanUpdate = new Set(["text", "html"]);

    // 不可设置的key
    // const UnSetKeys = new Set(["parent", "index", "slot"]);
    const UnSetKeys = new Set(["parent", "slot"]);

    const XDataSetData = XData.prototype.setData;

    class XhearEle extends XData {
        constructor(ele) {
            super({});
            delete this.parent;
            delete this.index;
            delete this.length;
            Object.defineProperties(ele, {
                __xhear__: {
                    value: this,
                    configurable: true
                }
            });
            let tagValue = ele.tagName ? ele.tagName.toLowerCase() : '';
            Object.defineProperties(this, {
                tag: {
                    enumerable: true,
                    value: tagValue
                },
                ele: {
                    value: ele
                },
                [ORIEVE]: {
                    writable: true,
                    // value: new Map()
                    value: ""
                }
                // [CANSETKEYS]: {
                //     value: new Set([])
                // }
            });
        }

        get parent() {
            let {
                parentNode
            } = this.ele;
            // if (parentNode instanceof DocumentFragment) {
            //     return;
            // }
            return (!parentNode || parentNode === document) ? null : createXhearProxy(parentNode);
        }

        get index() {
            let {
                ele
            } = this;
            return Array.from(ele.parentNode.children).indexOf(ele);
        }

        get length() {
            return this.ele.children.length;
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

        get display() {
            return getComputedStyle(this.ele)['display'];
        }

        set display(val) {
            this.ele.style['display'] = val;
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

        get $shadow() {
            let {
                shadowRoot
            } = this.ele;
            return shadowRoot && createXhearProxy(shadowRoot);
        }

        get $root() {
            let root = this.ele;
            while (root.parentNode) {
                root = root.parentNode;
            }
            return root && createXhearProxy(root);
        }

        get $host() {
            let {
                $root
            } = this;
            return $root && $root.ele.host && createXhearProxy($root.ele.host);
        }

        get attrs() {
            return createProxyAttrs(this.ele);
        }

        // 监听指定元素的变动
        moni(queStr, func) {
            let olds;
            this.watch(() => {
                let eles = this.all(queStr);
                let isSame = true;

                // 确保数据一致
                if (olds && olds.length == eles.length) {
                    eles.some(e => {
                        if (!olds.includes(e)) {
                            isSame = false;
                            return true;
                        }
                    });
                } else {
                    isSame = false;
                }

                if (isSame) {
                    return;
                }

                let obj = {
                    old: olds,
                    val: eles
                };

                olds = eles;

                func(eles, obj);
            }, true);
        }


        setData(key, value) {
            if (UnSetKeys.has(key)) {
                console.warn(`can't set this key => `, key);
                return false;
            }

            key = attrToProp(key);

            let _this = this[XDATASELF];

            // 只有在允许列表里才能进行set操作
            let canSetKey = this[CANSETKEYS];
            if (xEleDefaultSetKeys.has(key)) {
                let oldVal = _this[key];

                // 直接设置
                _this[key] = value;

                // if (xEleDefaultSetKeysCanUpdate.has(key)) {
                //     emitUpdate(_this, "setData", [key, value], {
                //         oldValue: oldVal
                //     });
                // }
                return true;
            } else if ((canSetKey && canSetKey.has(key)) || /^_.+/.test(key)) {
                // 直接走xdata的逻辑
                return XDataSetData.call(_this, key, value);
            } else if (!/\D/.test(key)) {
                let xele = $(value);

                let targetChild = _this.ele.children[key];

                // 这里还欠缺冒泡机制的
                if (targetChild) {
                    let oldVal = _this.getData(key).object;

                    _this.ele.insertBefore(xele.ele, targetChild);
                    _this.ele.removeChild(targetChild);

                    // 冒泡设置
                    emitUpdate(_this, "setData", [key, value], {
                        oldValue: oldVal
                    });
                } else {
                    _this.ele.appendChild(xele.ele);

                    // 冒泡设置
                    emitUpdate(_this, "setData", [key, value], {
                        oldValue: undefined
                    });
                }
            }

            return false;
        }

        getData(key) {
            key = attrToProp(key);

            let _this = this[XDATASELF];

            let target;

            if (!/\D/.test(key)) {
                // 纯数字，直接获取children
                target = _this.ele.children[key];
                target && (target = createXhearProxy(target));
            } else {
                target = _this[key];
            }

            if (target instanceof XData) {
                target = target[PROXYTHIS];
            }

            return target;
        }

        siblings(expr) {
            // 获取相邻元素
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

            return parChilds.map(e => createXhearProxy(e));
        }

        empty() {
            this.splice(0, this.length);
            return this;
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
                    while (tempTar) {
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

        is(expr) {
            return meetsEle(this.ele, expr)
        }

        $(expr) {
            let tar = this.ele.querySelector(expr);
            if (tar) {
                return createXhearProxy(tar);
            }
        }

        all(expr) {
            return queAllToArray(this.ele, expr).map(tar => createXhearProxy(tar));
        }

        clone() {
            let cloneEle = createXhearProxy(this.ele.cloneNode(true));

            // 数据重新设置
            Object.keys(this).forEach(key => {
                if (key !== "tag") {
                    cloneEle[key] = this[key];
                }
            });

            return cloneEle;
        }

        extend(proto) {
            Object.keys(proto).forEach(k => {
                // 获取描述
                let {
                    get,
                    set,
                    value
                } = Object.getOwnPropertyDescriptor(proto, k);

                if (value) {
                    Object.defineProperty(this, k, {
                        value
                    });
                } else {
                    Object.defineProperty(this, k, {
                        get,
                        set
                    });

                    if (set) {
                        // 添加到可设置key权限内
                        xEleDefaultSetKeys.add(k);
                    }
                }
            });
            return this;
        }
    }

    const XhearEleFn = XhearEle.prototype;

    const MOUSEEVENT = glo.MouseEvent || Event;
    const TOUCHEVENT = glo.TouchEvent || Event;
    // 修正 Event Class 用的数据表
    const EventMap = new Map([
        ["click", MOUSEEVENT],
        ["mousedown", MOUSEEVENT],
        ["mouseup", MOUSEEVENT],
        ["mousemove", MOUSEEVENT],
        ["mouseenter", MOUSEEVENT],
        ["mouseleave", MOUSEEVENT],
        ["touchstart", TOUCHEVENT],
        ["touchend", TOUCHEVENT],
        ["touchmove", TOUCHEVENT]
    ]);

    // 分析事件参数
    const anlyEveOpts = (args) => {
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
        }

        return {
            eventName,
            selector,
            callback,
            data
        };
    }

    // 绑定事件on方法抽离
    function onEve(args, onOpts = {
        count: Infinity
    }) {
        let {
            eventName,
            selector,
            callback,
            data
        } = anlyEveOpts(args);

        let originEve = this[ORIEVE] || (this[ORIEVE] = new Map());

        if (!originEve.has(eventName)) {
            let eventCall = (e) => {
                let {
                    _para_x_eve_
                } = e;

                let event;
                if (_para_x_eve_) {
                    event = _para_x_eve_;

                    // 当target不一致时，修正target
                    if (event.target.ele !== e.target) {
                        event.target = createXhearProxy(e.target);
                    }

                    let newKeys = [];

                    let tarEle = e.target;
                    while (tarEle !== e.currentTarget) {
                        let par = tarEle.parentNode;
                        if (!par) {
                            break;
                        }
                        let tarId = Array.from(par.children).indexOf(tarEle);
                        newKeys.unshift(tarId);
                        tarEle = par;
                    }

                    // 重新修正keys
                    event.keys = newKeys;
                } else {
                    event = new XEvent({
                        type: eventName,
                        target: createXhearProxy(e.target)
                    });

                    // 事件方法转移
                    event.on("set-bubble", (e2, val) => !val && e.stopPropagation());
                    event.on("set-cancel", (e2, val) => val && e.stopImmediatePropagation());
                    event.preventDefault = e.preventDefault.bind(e);

                    e._para_x_eve_ = event;
                }

                // 设置原始事件对象
                event.originalEvent = e;

                // 触发事件
                this.emitHandler(event);

                // 清空原始事件
                event.originalEvent = null;

                // 次数修正
                // 计数递减
                onOpts.count--;
                if (!onOpts.count) {
                    this.off(eventName, callback);
                }
            }
            originEve.set(eventName, eventCall);
            this.ele.addEventListener(eventName, eventCall);
        }

        this.addListener({
            type: eventName,
            count: onOpts.count,
            data,
            callback
        });

        if (selector) {
            // 获取事件寄宿对象
            let eves = getEventsArr(eventName, this);

            eves.forEach(e => {
                if (e.callback == callback) {
                    e.before = (opts) => {
                        let {
                            self,
                            event
                        } = opts;
                        let target = event.target;

                        // 目标元素
                        let delegateTarget;
                        if (target.is(selector)) {
                            delegateTarget = target;
                        } else {
                            delegateTarget = target.parents(selector)[0];
                        }

                        // 判断是否在selector内
                        if (!delegateTarget) {
                            return 0;
                        }

                        // 通过selector验证
                        // 设置两个关键数据
                        Object.assign(event, {
                            selector,
                            delegateTarget
                        });

                        // 返回可运行
                        return 1;
                    }
                    e.after = (opts) => {
                        let {
                            self,
                            event
                        } = opts;

                        // 删除无关数据
                        delete event.selector;
                        delete event.delegateTarget;
                    }
                }
            });
        }
    }

    XhearEleFn.extend({
        on(...args) {
            onEve.call(this, args);
            return this;
        },
        off(...args) {
            let eventName = args[0];

            // 获取事件寄宿对象
            let eves = getEventsArr(eventName, this);

            // 继承旧方法
            XData.prototype.off.apply(this, args);

            if (!eves.length) {
                let originEve = this[ORIEVE] || (this[ORIEVE] = new Map());

                // 原生函数注册也干掉
                let oriFun = originEve.get(eventName);
                oriFun && this.ele.removeEventListener(eventName, oriFun);
                originEve.delete(eventName);
            }
            return this;
        },
        one(...args) {
            onEve.call(this, args, {
                count: 1
            });
            return this;
        },
        trigger(type, opts) {
            let event;

            let defaults = {
                bubbles: true,
                cancelable: true
            };

            Object.assign(defaults, opts);

            if (type instanceof Event) {
                event = type;
            } else {
                let E = EventMap.get(type) || Event;
                event = new E(type, {
                    bubbles: defaults.bubbles,
                    cancelable: defaults.cancelable
                });
            }

            // 触发事件
            this.ele.dispatchEvent(event);

            return this;
        }
    });
    // 不影响数据原结构的方法，重新做钩子
    ['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'lastIndexOf', 'includes', 'join'].forEach(methodName => {
        let arrayFnFunc = Array.prototype[methodName];
        if (arrayFnFunc) {
            Object.defineProperty(XhearEleFn, methodName, {
                value(...args) {
                    return arrayFnFunc.apply(Array.from(this.ele.children).map(e => createXhearProxy(e)), args);
                }
            });
        }
    });

    /**
     * 触发子元素的index事件
     * @param {Object} _this 目标元素
     * @param {Array} oldArr 旧的子元素数组
     */
    const emitChildsXDataIndex = (_this, oldArr) => {
        _this.forEach((e, index) => {
            let oldIndex = oldArr.findIndex(e2 => e2 === e);
            if (oldIndex !== -1 && oldIndex !== index) {
                emitXDataIndex(e, index, oldIndex);
            }
        });
    }

    /**
     * 模拟array splice方法
     * @param {XhearEle} t 目标对象
     * @param {Number} index splice index
     * @param {Number} howmany splice howmany
     * @param {Array} items splice push items
     */
    const XhearEleProtoSplice = (t, index, howmany, items = []) => {
        let _this = t[XDATASELF];

        // 返回的数组
        let reArr = [];

        let tarele = _this.ele;
        let {
            children
        } = tarele;

        let c_howmany = howmany;

        let oldArr = _this.map(e => e);

        while (c_howmany > 0) {
            let childEle = children[index];

            if (!childEle) {
                break;
            }

            reArr.push(createXhearProxy(childEle));

            // 删除目标元素
            tarele.removeChild(childEle);

            // 数量减少
            c_howmany--;
        }

        // 定位目标子元素
        let tar = children[index];

        // 添加元素
        if (items.length) {
            let fragment = document.createDocumentFragment();
            items.forEach(e => fragment.appendChild(parseToDom(e)));
            if (index >= 0 && tar) {
                tarele.insertBefore(fragment, tar)
            } else {
                tarele.appendChild(fragment);
            }
        }

        // 触发index改动
        emitChildsXDataIndex(_this, oldArr);

        emitUpdate(_this, "splice", [index, howmany, ...items]);

        return reArr;
    }

    /**
     * 根据数组结构进行排序
     * @param {XhearEle} t 目标对象
     * @param {Array} arr 排序数组结构
     */
    const sortByArray = (t, arr) => {
        let _this = t[XDATASELF];
        let {
            ele
        } = _this;

        let childsBackup = Array.from(ele.children);
        let fragment = document.createDocumentFragment();
        arr.forEach(k => {
            let ele = childsBackup[k];
            if (ele.xvele) {
                ele[RUNARRAY] = 1;
            }
            fragment.appendChild(ele);
        });
        ele.appendChild(fragment);
        childsBackup.forEach(ele => ele.xvele && (ele[RUNARRAY] = 0));
    }

    // 重置所有数组方法
    XhearEleFn.extend({
        // push就是最原始的appendChild，干脆直接appencChild
        push(...items) {
            let fragment = document.createDocumentFragment();
            items.forEach(item => {
                let ele = parseToDom(item);
                fragment.appendChild(ele);
            });
            this.ele.appendChild(fragment);
            emitUpdate(this[XDATASELF], "push", items);
            return this.length;
        },
        splice(index, howmany, ...items) {
            return XhearEleProtoSplice(this, index, howmany, items);
        },
        unshift(...items) {
            XhearEleProtoSplice(this, 0, 0, items);
            return this.length;
        },
        shift() {
            return XhearEleProtoSplice(this, 0, 1);
        },
        pop() {
            return XhearEleProtoSplice(this, this.length - 1, 1);
        },
        reverse() {
            let oldArr = this.map(e => e);
            let childs = Array.from(this.ele.children);
            let len = childs.length;
            sortByArray(this, childs.map((e, i) => len - 1 - i));

            // 触发index改动
            emitChildsXDataIndex(this, oldArr);
            emitUpdate(this[XDATASELF], "reverse", []);
        },
        sort(arg) {
            let oldArr = this.map(e => e);

            if (isFunction(arg)) {
                // 新生成数组
                let fake_this = Array.from(this.ele.children).map(e => createXhearProxy(e));
                let backup_fake_this = Array.from(fake_this);

                // 执行排序函数
                fake_this.sort(arg);

                // 记录顺序
                arg = [];
                let putId = getRandomId();

                fake_this.forEach(e => {
                    let id = backup_fake_this.indexOf(e);
                    // 防止查到重复值，所以查到过的就清空覆盖
                    backup_fake_this[id] = putId;
                    arg.push(id);
                });
            }

            if (arg instanceof Array) {
                // 修正新顺序
                sortByArray(this, arg);
            }

            // 触发index改动
            emitChildsXDataIndex(this, oldArr);

            emitUpdate(this[XDATASELF], "sort", [arg]);
        }
    });
    // 注册数据
    const regDatabase = new Map();

    const RUNARRAY = Symbol("runArray");

    // 渲染结束标记
    const RENDEREND = Symbol("renderend"),
        RENDEREND_RESOLVE = Symbol("renderend_resove"),
        RENDEREND_REJECT = Symbol("renderend_reject");

    const ATTRBINDINGKEY = "attr" + getRandomId();

    // 是否表达式
    const isFunctionExpr = (str) => /[ \|\&\(\)\?\:\!;]/.test(str.trim());

    // 获取函数
    const exprToFunc = (expr) => {
        return new Function("$event", `
with(this){
    try{
        return ${expr}
    }catch(e){
        let errObj = {
            expr:'${expr.replace(/'/g, "\\'").replace(/"/g, '\\"')}',
        }
        ele.__xInfo && Object.assign(errObj,ele.__xInfo);
        console.error(errObj,e);
    }
}
    `);
    }

    // 嵌入函数监听公用方法
    const embedWatch = ({
        target,
        callback,
        expr
    }) => {
        // 判断expr是否为函数表达式
        if (isFunctionExpr(expr)) {
            let func = exprToFunc(expr);
            target.watch(e => callback(func.call(target[PROXYTHIS])))
        } else {
            // 先设置值，后监听塞入
            target.watch(expr, (e, val) => callback(val));
        }
    }

    const register = (opts) => {
        let defaults = {
            // 自定义标签名
            tag: "",
            // 正文内容字符串
            temp: "",
            // 和attributes绑定的keys
            attrs: [],
            // 默认数据
            data: {},
            // 直接监听属性变动对象
            watch: {},
            // 原型链上的方法
            // proto: {},
            // 初始化完成后触发的事件
            // ready() {},
            // 添加进document执行的callback
            // attached() {},
            // 删除后执行的callback
            // detached() {}
        };
        Object.assign(defaults, opts);

        let attrs = defaults.attrs;

        let attrsType = getType(attrs);
        if (attrsType == "object") {
            // 修正数据
            let n_attrs = Object.keys(attrs);

            n_attrs.forEach(attrName => {
                defaults.data[attrToProp(attrName)] = attrs[attrName];
            });

            attrs = defaults.attrs = n_attrs.map(e => attrToProp(e));
        } else if (attrsType == "array") {
            // 修正属性值
            attrs = defaults.attrs = attrs.map(e => attrToProp(e));
        }

        defaults.data = cloneObject(defaults.data);
        defaults.watch = Object.assign({}, defaults.watch);

        // 转换tag
        let tag = defaults.tag = propToAttr(defaults.tag);

        // 自定义元素
        const CustomXhearEle = class extends XhearEle {
            constructor(...args) {
                super(...args);

                // 挂载渲染状态机
                this[RENDEREND] = new Promise((resolve, reject) => {
                    this[RENDEREND_RESOLVE] = resolve;
                    // this[RENDEREND_REJECT] = reject;
                });
            }

            get finish() {
                return this[RENDEREND];
            }
        }

        defaults.proto && CustomXhearEle.prototype.extend(defaults.proto);

        // 注册组件的地址
        let scriptSrc = document.currentScript && document.currentScript.src;

        // 注册自定义元素
        const XhearElement = class extends HTMLElement {
            constructor() {
                super();

                // 设置相关数据
                this.__xInfo = {
                    scriptSrc
                };

                // 删除旧依赖，防止组件注册前的xhear实例缓存
                delete this.__xhear__;
                let _xhearThis = new CustomXhearEle(this);

                // 设置渲染识别属性
                Object.defineProperty(this, "xvele", {
                    value: true
                });
                Object.defineProperty(_xhearThis, "xvele", {
                    value: true
                });

                let xvid = this.xvid = "xv" + getRandomId();

                let options = Object.assign({}, defaults);

                // 设置xv-ele
                // nextTick(() => this.setAttribute("xv-ele", ""), xvid);
                if (this.parentElement) {
                    this.setAttribute("xv-ele", "");
                } else {
                    nextTick(() => this.setAttribute("xv-ele", ""), xvid);
                }

                renderEle(this, options);
                options.ready && options.ready.call(_xhearThis[PROXYTHIS]);

                options.slotchange && _xhearThis.$shadow.on('slotchange', (e) => options.slotchange.call(_xhearThis[PROXYTHIS], e))

                Object.defineProperties(this, {
                    [RUNARRAY]: {
                        writable: true,
                        value: 0
                    }
                });
            }

            connectedCallback() {
                if (this[RUNARRAY]) {
                    return;
                }
                defaults.attached && defaults.attached.call(createXhearProxy(this));
            }

            disconnectedCallback() {
                if (this[RUNARRAY]) {
                    return;
                }

                let _this = createXhearProxy(this)

                defaults.detached && defaults.detached.call(_this);

                // 深度清除数据
                _this.deepClear();
            }

            attributeChangedCallback(name, oldValue, newValue) {
                let xEle = this.__xhear__;
                name = attrToProp(name);
                if (newValue != xEle[name]) {
                    xEle.setData(name, newValue);
                }
            }

            static get observedAttributes() {
                return attrs.map(e => propToAttr(e));
            }
        }

        Object.assign(defaults, {
            XhearElement
        });

        // 设置映射tag数据
        regDatabase.set(defaults.tag, defaults);

        customElements.define(tag, XhearElement);
    }

    // 定位元素
    const postionNode = (e) => {
        let textnode = document.createTextNode("");
        let par = e.parentNode;
        par.insertBefore(textnode, e);
        par.removeChild(e);

        return {
            textnode,
            par
        };
    }

    // 中转头部函数
    const funcToMain = (self, mainEle, {
        indexName,
        item
    }) => {
        let tbase = regDatabase.get(mainEle.tag);
        if (tbase) {
            let tbase_proto = tbase.proto;
            if (tbase_proto) {
                Object.keys(tbase_proto).forEach(key => {
                    let f = tbase_proto[key];

                    !isFunction(f) && Object.defineProperty(self, key, {
                        value: f.bind(mainEle)
                    });
                });
            }

            if (indexName) {
                Object.defineProperty(self, indexName, {
                    get() {
                        return item.index;
                    }
                });
            }
        }
    }

    // 组件for绑定复制并绑定元素
    const createForComp = (ele, e, temps, proxyEle) => {
        if (ele.tagName.toLowerCase() == "template") {
            // for循环渲染用的元素
            let tempName = ele.getAttribute("is");

            if (!tempName) {
                throw {
                    desc: "the templte missing 'is' attribute",
                    ele
                };
            }

            // 获取模板
            let targetTemp = temps.get(tempName);

            let c_ele = targetTemp.content.children[0].cloneNode(true);
            let n_proxyEle = createXhearProxy(c_ele);
            n_proxyEle[CANSETKEYS] = new Set(Object.keys(e));

            // 直接渲染原生元素
            renderTemp({
                sroot: c_ele,
                proxyEle: n_proxyEle,
                temps
            });

            // 索引属性key获取
            let indexName = targetTemp.getAttribute("index-name");
            funcToMain(n_proxyEle[XDATASELF], proxyEle, {
                indexName,
                item: e
            });

            e.sync(n_proxyEle, null, true);

            return {
                new_ele: c_ele
            };
        } else {
            // 自定义组件
            let new_ele = ele.cloneNode(true);

            // 数据覆盖
            let p_ele = createXhearProxy(new_ele);

            e.sync(p_ele, null, true);

            return {
                new_ele
            };
        }
    }

    // 生成fill用数据
    // const createFillEle = (ele, e, temps, proxyEle) => {
    //     debugger
    // }

    // 将元素前置并触发事件的方法
    const xdInsertBefore = (new_ele, textnode) => {
        let par = textnode.parentNode;

        // 记录旧顺序
        let old_childs = Array.from(par.children);

        par.insertBefore(new_ele, textnode);

        // 触发 updateIndex 事件
        Array.from(par.children).forEach((e, i) => {
            let old_index = old_childs.indexOf(e);

            if (old_index !== -1 && old_index !== i) {
                emitXDataIndex(createXhearProxy(e), i, old_index);
            }
        });
    }

    // render函数用元素查找（包含自身元素）
    const getCanRenderEles = (root, expr) => {
        let arr = queAllToArray(root, expr);
        if (!(root instanceof DocumentFragment) && createXhearEle(root).is(expr)) {
            arr.unshift(root);
        }
        return arr;
    }

    // 渲染shadow dom 的内容
    const renderTemp = ({
        sroot,
        proxyEle,
        temps
    }) => {
        // 处理用寄存对象
        const processObj = new Map();
        const addProcess = (expr, func) => {
            let calls = processObj.get(expr.trim());
            if (!calls) {
                calls = [];
                processObj.set(expr, {
                    calls
                });
            } else {
                calls = calls.calls;
            }

            calls.push({
                change: func
            })
        }

        const canSetKey = proxyEle[CANSETKEYS];

        // 重新中转内部特殊属性
        getCanRenderEles(sroot, "*").forEach(ele => {
            let attrbs = Array.from(ele.attributes);

            // 结束后要去除的属性
            let attrsRemoveKeys = new Set();

            // 事件绑定数据
            let bindEvent = {};

            // 属性绑定数据
            let bindAttr = {};

            attrbs.forEach(obj => {
                let {
                    name,
                    value
                } = obj;
                name = attrToProp(name);

                // 重定向目标
                if (name === "$") {
                    Object.defineProperty(proxyEle, "$" + value, {
                        get: () => createXhearProxy(ele)
                    });
                    attrsRemoveKeys.add(name);
                    return;
                }

                // 事件绑定
                let eventExecs = /^@(.+)/.exec(name);
                if (eventExecs) {
                    bindEvent[eventExecs[1]] = value;
                    attrsRemoveKeys.add(name);
                    return;
                }

                // 属性绑定
                let attrExecs = /^:(.+)/.exec(name);
                if (attrExecs) {
                    bindAttr[attrExecs[1]] = value;
                    attrsRemoveKeys.add(name);
                    return;
                }
            });

            let bindEventStr = JSON.stringify(bindEvent);
            if (bindEventStr != "{}") {
                ele.setAttribute("xv-on", bindEventStr);
            }

            let bindAttrStr = JSON.stringify(bindAttr);
            if (bindAttrStr != "{}") {
                ele.setAttribute("xv-bind", bindAttrStr);
            }

            attrsRemoveKeys.forEach(k => {
                ele.removeAttribute(k)
            });
        });

        // xv-for 组件渲染
        // comp-for 是防止 xv-for内多重循环垃圾代码的产生，强迫开发者封装多重组件
        getCanRenderEles(sroot, '[xv-for]').forEach(ele => {
            let {
                textnode,
                par
            } = postionNode(ele);
            ele.removeAttribute("xv-ele");

            // 添加标识
            const forId = getRandomId();
            ele.setAttribute("for-id", forId);

            // 前一份数据记录
            let old_val_ids = [];
            // for循环上的子元素
            const forChilds = [];
            const childsIds = [];

            addProcess(ele.getAttribute("xv-for"), val => {
                let has_obj = false;
                // 获取当前id数组
                let val_ids = val.map(e => {
                    if (e instanceof Object) {
                        has_obj = true;
                        return e.xid
                    }
                });

                if (!has_obj) {
                    forChilds.forEach(e => e.parentNode.removeChild(e));
                    forChilds.length = 0;
                    // 非数组类型都是直接渲染
                    val.forEach((e, index) => {
                        // 直接生成绑定数据的组件
                        let d = $.xdata({
                            item: e,
                            index
                        });
                        let {
                            new_ele
                        } = createForComp(ele, d, temps, proxyEle);

                        // 添加元素
                        xdInsertBefore(new_ele, textnode);
                        forChilds.push(new_ele);
                    });
                    return;
                }

                if (JSON.stringify(val_ids) === JSON.stringify(old_val_ids)) {
                    // 没有改动
                    return;
                }

                // 空状态直接重写数据
                if (old_val_ids.length === 0) {
                    val.forEach(e => {
                        // 直接生成绑定数据的组件
                        let {
                            new_ele
                        } = createForComp(ele, e, temps, proxyEle);

                        // 添加元素
                        xdInsertBefore(new_ele, textnode);
                        childsIds.push(e.xid);
                        forChilds.push(new_ele);
                    });
                } else {
                    let removeCount = 0;
                    old_val_ids.forEach((xid, index) => {
                        if (!val_ids.includes(xid)) {
                            // 删除不需要的
                            let i = index - removeCount;
                            childsIds.splice(i, 1);
                            let r_ele = forChilds.splice(i, 1)[0];
                            par.removeChild(r_ele);
                            removeCount++;
                        }
                    });

                    val_ids.forEach((xid, index) => {
                        // 确认是否旧的
                        let o_id = childsIds.indexOf(xid);

                        if (o_id !== index && o_id > -1) {
                            // 位移修正
                            let o_xid = childsIds.splice(o_id, 1)[0];
                            let o_ele = forChilds.splice(o_id, 1)[0];

                            if (o_id > index) {
                                // 内部位移
                                o_ele[RUNARRAY] = 1;
                                xdInsertBefore(o_ele, forChilds[index]);
                                o_ele[RUNARRAY] = 0;

                                // 虚拟位置数据修正
                                childsIds.splice(index, 0, o_xid);
                                forChilds.splice(index, 0, o_ele);
                            } else {
                                // 不明位移
                                debugger
                            }

                        } else if (o_id === -1) {
                            let e = val[index];
                            // 添加新元素
                            let {
                                new_ele
                            } = createForComp(ele, e, temps, proxyEle);

                            if (index > forChilds.length - 1) {
                                // 末尾添加
                                xdInsertBefore(new_ele, textnode);
                                childsIds.push(e.xid);
                                forChilds.push(new_ele);
                            } else {
                                // 中间插入
                                xdInsertBefore(new_ele, forChilds[index]);
                                childsIds.splice(index, 0, e.xid);
                                forChilds.splice(index, 0, new_ele);
                            }
                        }
                    });
                }

                if (JSON.stringify(childsIds) !== JSON.stringify(val_ids)) {
                    // 数据出现异常，请及时修正
                    debugger
                }

                old_val_ids = val_ids;
            });
        });

        // xv-fill，对内部进行填充的循环
        // getCanRenderEles(sroot, "[xv-fill]").forEach(e => {
        //     let fillAttr = e.getAttribute("xv-fill");
        //     let fillContent = e.getAttribute("fill-content");

        //     // 判断是否组件
        //     let isComponent = !/[^a-z\-]/.test(fillContent);

        //     // 旧的数据id
        //     let old_ids = [];

        //     addProcess(fillAttr, val => {
        //         if (isComponent) {
        //             // 组件
        //             // 先填充一匹内容

        //             if (!old_ids.length) {
        //                 // 直接填充
        //                 debugger
        //             }

        //             debugger
        //         } else {
        //             // 模板
        //             // 获取内容
        //             let targetTemp = temps.get(fillContent);

        //             if (targetTemp) {
        //                 let ele = createFillEle();

        //                 debugger
        //             }
        //         }
        //     });
        // });

        // xv-if判断
        // if会重新渲染组件，滥用导致性能差， 5.2之后不允许使用if，请改用xv-show
        // queAllToArray(sroot, "[xv-if]").forEach(e => {
        //     debugger
        // });

        // xv-show
        getCanRenderEles(sroot, "[xv-show]").forEach(e => {
            addProcess(e.getAttribute("xv-show"), val => {
                if (val) {
                    e.style.display = "";
                } else {
                    e.style.display = "none";
                }
            });
        });

        // 文本渲染
        getCanRenderEles(sroot, "xv-span").forEach(e => {
            // 定位元素
            let {
                textnode,
                par
            } = postionNode(e);

            let expr = e.getAttribute('xvkey');

            addProcess(expr, val => {
                textnode.textContent = val;
            });
        });

        // 事件修正
        getCanRenderEles(sroot, `[xv-on]`).forEach(e => {
            let data = JSON.parse(e.getAttribute("xv-on"));

            let $ele = createXhearEle(e);

            Object.keys(data).forEach(eventStr => {
                let [eventName, ...opts] = eventStr.split('.');

                let prop = data[eventStr];

                let func;
                if (isFunctionExpr(prop)) {
                    func = exprToFunc(prop);
                } else {
                    func = proxyEle[prop];
                }

                let functionName = "on";
                if (opts.includes("once")) {
                    functionName = "one";
                }

                $ele[functionName](eventName, (event, data) => {
                    if (opts.includes("prevent")) {
                        event.preventDefault();
                    }

                    if (opts.includes("stop")) {
                        event.bubble = false;
                    }

                    func.call(proxyEle, event, data);
                });
            });
        });

        // 属性修正
        getCanRenderEles(sroot, `[xv-bind]`).forEach(ele => {
            let data = JSON.parse(ele.getAttribute("xv-bind"));

            Object.keys(data).forEach(attrName => {
                let expr = data[attrName];

                let isEachBinding = /^#(.+)/.exec(attrName);
                if (isEachBinding) {
                    attrName = isEachBinding[1];
                    isEachBinding = !!isEachBinding;

                    // 函数表达式不能用于双向绑定
                    if (isFunctionExpr(expr)) {
                        throw {
                            desc: "Function expressions cannot be used for sync binding",
                        };
                    } else if (!canSetKey.has(expr)) {
                        // 不能双向绑定的值
                        console.error({
                            desc: "the key can't sync bind",
                            key: "attrName",
                            target: ele,
                            host: proxyEle
                        });
                    }

                    // 数据反向绑定
                    createXhearEle(ele).watch(attrName, (e, val) => {
                        proxyEle.setData(expr, val);
                    });
                }

                addProcess(expr, val => {
                    if (val instanceof XhearEle) {
                        val = val.object;
                    }

                    if (ele.xvele) {
                        createXhearEle(ele).setData(attrName, val);
                    } else {
                        ele.setAttribute(attrName, val);
                    }
                });
            });
        });


        // 需要跳过的元素列表
        let xvModelJump = new Set();

        // 绑定 xv-model
        getCanRenderEles(sroot, `[xv-model]`).forEach(ele => {
            if (xvModelJump.has(ele)) {
                return;
            }

            let modelKey = ele.getAttribute("xv-model");

            switch (ele.tagName.toLowerCase()) {
                case "input":
                    let inputType = ele.getAttribute("type");
                    switch (inputType) {
                        case "checkbox":
                            // 判断是不是复数形式的元素
                            let allChecks = getCanRenderEles(sroot, `input[type="checkbox"][xv-model="${modelKey}"]`);

                            // 查看是单个数量还是多个数量
                            if (allChecks.length > 1) {
                                allChecks.forEach(checkbox => {
                                    checkbox.addEventListener('change', e => {
                                        let {
                                            value,
                                            checked
                                        } = e.target;

                                        let tarData = proxyEle.getData(modelKey);
                                        if (checked) {
                                            tarData.add(value);
                                        } else {
                                            tarData.delete(value);
                                        }
                                    });
                                });

                                // 添加到跳过列表里
                                allChecks.forEach(e => {
                                    xvModelJump.add(e);
                                })
                            } else {
                                // 单个直接绑定checked值
                                proxyEle.watch(modelKey, (e, val) => {
                                    ele.checked = val;
                                });
                                ele.addEventListener("change", e => {
                                    let {
                                        checked
                                    } = ele;
                                    proxyEle.setData(modelKey, checked);
                                });
                            }
                            return;
                        case "radio":
                            let allRadios = getCanRenderEles(sroot, `input[type="radio"][xv-model="${modelKey}"]`);

                            let rid = getRandomId();

                            allRadios.forEach(radioEle => {
                                radioEle.setAttribute("name", `radio_${modelKey}_${rid}`);
                                radioEle.addEventListener("change", e => {
                                    if (radioEle.checked) {
                                        proxyEle.setData(modelKey, radioEle.value);
                                    }
                                });
                            });
                            return;
                    }
                    // 其他input 类型继续往下走
                    case "textarea":
                        proxyEle.watch(modelKey, (e, val) => {
                            ele.value = val;
                        });
                        ele.addEventListener("input", e => {
                            proxyEle.setData(modelKey, ele.value);
                        });
                        break;
                    case "select":
                        proxyEle.watch(modelKey, (e, val) => {
                            ele.value = val;
                        });
                        ele.addEventListener("change", e => {
                            proxyEle.setData(modelKey, ele.value);
                        });
                        break;
                    default:
                        // 自定义组件
                        if (ele.xvele) {
                            let cEle = ele.__xhear__;
                            cEle.watch("value", (e, val) => {
                                proxyEle.setData(modelKey, val);
                            });
                            proxyEle.watch(modelKey, (e, val) => {
                                cEle.setData("value", val);
                            });
                        } else {
                            console.warn(`can't xv-model with thie element => `, ele);
                        }
            }
        });
        xvModelJump.clear();
        xvModelJump = null;

        // 根据寄存对象监听值
        for (let [expr, d] of processObj) {
            let {
                calls,
                target
            } = d;
            target = target || proxyEle;

            if (canSetKey.has(expr)) {
                target.watch(expr, (e, val) => {
                    calls.forEach(d => d.change(val, e.trends));
                });
            } else {
                // 其余的使用函数的方式获取
                let f = exprToFunc(expr);
                let old_val;

                let watchFun;
                target.watch(watchFun = e => {
                    let val = f.call(target);

                    if (val === old_val || (val instanceof XData && val.string === old_val)) {
                        return;
                    }

                    if (e) {
                        let {
                            trends
                        } = e;
                        calls.forEach(d => d.change(val, trends));
                    }

                    if (val instanceof XData) {
                        old_val = val.string;
                    } else {
                        old_val = val;
                    }
                });

                // 同时监听index变动
                target.on("updateIndex", watchFun)
            }
        }
    }

    // 渲染元素
    const renderEle = (ele, defaults) => {
        // 初始化元素
        let xhearEle = createXhearEle(ele);

        // 存储promise队列
        let renderTasks = [];

        // 合并 proto
        defaults.proto && xhearEle.extend(defaults.proto);

        let {
            temp
        } = defaults;
        let sroot;

        // 要设置的数据
        let rData = Object.assign({}, defaults.data);

        // 添加_exkey
        let canSetKey = Object.keys(rData);
        canSetKey.push(...defaults.attrs);
        canSetKey.push(...Object.keys(defaults.watch));
        canSetKey = new Set(canSetKey);
        canSetKey.forEach(k => {
            // 去除私有属性
            if (/^_.+/.test(k)) {
                canSetKey.delete(k);
            }
        });
        let ck = xhearEle[CANSETKEYS];
        if (!ck) {
            Object.defineProperty(xhearEle, CANSETKEYS, {
                value: canSetKey
            });
        } else {
            canSetKey.forEach(k => ck.add(k))
        }

        // 判断是否有value，进行vaule绑定
        if (canSetKey.has("value")) {
            Object.defineProperty(ele, "value", {
                get() {
                    return xhearEle.value;
                },
                set(val) {
                    xhearEle.value = val;
                }
            });
        }

        if (temp) {
            // 添加shadow root
            sroot = ele.attachShadow({
                mode: "open"
            });

            // 去除无用的代码（注释代码）
            temp = temp.replace(/<!--.+?-->/g, "");

            // 自定义字符串转换
            var textDataArr = temp.match(/{{.+?}}/g);
            textDataArr && textDataArr.forEach((e) => {
                var key = /{{(.+?)}}/.exec(e);
                if (key) {
                    temp = temp.replace(e, `<xv-span xvkey="${key[1].trim()}"></xv-span>`);
                }
            });

            // 填充默认内容
            sroot.innerHTML = temp;

            // if (temp.includes("template")) {
            //     debugger
            // }

            // 查找所有模板
            let temps = new Map();
            let tempEle = Array.from(sroot.querySelectorAll(`template[name]`));
            tempEle.length && tempEle.forEach(e => {
                // 内部清除
                e.parentNode.removeChild(e);

                // 注册元素
                let name = e.getAttribute("name");

                temps.set(name, e);
            });

            renderTemp({
                sroot,
                proxyEle: xhearEle[PROXYTHIS],
                temps
            });

            // // 修正 style 内的动态值变动
            // // queAllToArray(sroot, `style`).forEach(styleEle => {
            // //     let oriStyleHTML = styleEle.innerHTML;

            // //     // 匹配到动态值
            // //     let sarr = oriStyleHTML.match(/<xv-span xvkey=".+?"><\/xv-span>/g);
            // //     if (sarr && sarr.length) {
            // //         // 去重
            // //         let s_key = Array.from(new Set(sarr)).map(e => e.replace(/<xv-span xvkey="(.+)"><\/xv-span>/, "$1"));

            // //         // 抽取关键元素并监听
            // //         s_key.forEach(expr => {
            // //             // 监听内容，根据值变动去更新style内部的所有Html
            // //             embedWatch({
            // //                 target: xhearEle,
            // //                 expr,
            // //                 callback(val) {
            // //                     // 重新渲染样式内容
            // //                     let b_style = oriStyleHTML;

            // //                     s_key.forEach(key => {
            // //                         let reg = new RegExp(`<xv-span xvkey="${key}"><\/xv-span>`, "g");
            // //                         b_style = b_style.replace(reg, xhearEle[key]);
            // //                     });

            // //                     styleEle.innerHTML = b_style;
            // //                 }
            // //             });
            // //         });
            // //     }
            // // });
        }

        // watch事件绑定
        xhearEle.watch(defaults.watch);

        // attrs 上的数据
        defaults.attrs.forEach(attrName => {
            // 绑定值
            xhearEle.watch(attrName, d => {
                if (d.val === null || d.val === undefined) {
                    ele.removeAttribute(propToAttr(attrName));
                } else {
                    // 绑定值
                    ele.setAttribute(propToAttr(attrName), d.val);
                }
            });
        });

        // 合并数据后设置
        Object.keys(rData).forEach(k => {
            let val = rData[k];

            if (!isUndefined(val)) {
                // xhearEle[k] = val;
                xhearEle.setData(k, val);
            }
        });

        // 查找是否有link为完成
        if (sroot) {
            let links = queAllToArray(sroot, `link`);
            if (links.length) {
                links.forEach(link => {
                    renderTasks.push(new Promise((resolve, reject) => {
                        if (link.sheet) {
                            resolve();
                        } else {
                            link.addEventListener("load", e => {
                                resolve();
                            });
                            link.addEventListener("error", e => {
                                reject({
                                    desc: "link load error",
                                    error: e,
                                    target: ele
                                });
                            });
                        }
                    }));
                });
            }
        }

        // 设置渲染完毕
        let setRenderend = () => {
            nextTick(() => ele.setAttribute("xv-ele", 1), ele.xvid);
            xhearEle[RENDEREND_RESOLVE]();
            xhearEle.trigger('renderend', {
                bubbles: false
            });
            setRenderend = null;
        }

        if (renderTasks.length) {
            Promise.all(renderTasks).then(() => {
                setRenderend();
            });
        } else {
            setRenderend();
        }
    }

    const createXhearEle = ele => (ele.__xhear__ || new XhearEle(ele));
    const createXhearProxy = ele => createXhearEle(ele)[PROXYTHIS];

    // 全局用$
    let $ = (expr) => {
        if (expr instanceof XhearEle) {
            return expr;
        }

        let ele;

        if (getType(expr) === "string" && !/\<.+\>/.test(expr)) {
            ele = document.querySelector(expr);
        } else {
            ele = parseToDom(expr);
        }

        return ele ? createXhearProxy(ele) : null;
    }

    // 扩展函数（只是辅助将内部函数暴露出去而已）
    const ext = (callback) => {
        callback({
            // 渲染shadow的内部方法
            renderEle
        });
    }

    Object.assign($, {
        register,
        nextTick,
        xdata: obj => createXData(obj)[PROXYTHIS],
        v: 5002000,
        version: "5.2.0",
        fn: XhearEleFn,
        isXhear,
        ext,
        all(expr) {
            return queAllToArray(document, expr).map(tar => createXhearProxy(tar));
        },
    });

    glo.$ = $;

})(window);