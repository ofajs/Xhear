((glo) => {
    "use strict";

    const getRandomId = () => Math.random().toString(32).substr(2);
    let objectToString = Object.prototype.toString;
    const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
    const isUndefined = val => val === undefined;
    const isFunction = val => getType(val).includes("function");
    const cloneObject = obj => JSON.parse(JSON.stringify(obj));

    const nextTick = (() => {
        let inTick = false;

        // 定位对象寄存器
        let nextTickMap = new Map();

        return (fun, key) => {
            if (!inTick) {
                inTick = true;
                setTimeout(() => {
                    if (nextTickMap.size) {
                        nextTickMap.forEach(cFun => {
                            cFun();
                        });
                    }

                    nextTickMap.clear();
                    inTick = false;
                }, 0);
            }

            if (!key) {
                key = getRandomId();
            }

            nextTickMap.set(key, fun);
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
            args: cloneObject(args),
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
            _this.index = undefined;
            _this.parent = undefined;
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
                _this.unsync(oppXdata);
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
            this._on({
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
            this._on({
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
        _on(opts = {}) {
            let {
                type,
                data,
                callback,
                // 事件可触发次数
                count = Infinity,
                eventId
            } = opts;

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
                this[EVENTS] && this[EVENTS].delete(eventName);
            }
        }

        /**
         * 触发事件
         * @param {String|XEvent} eventName 触发的事件名
         * @param {Object} emitData 触发事件的自定义数据
         */
        emit(eventName, emitData) {
            let event;
            // 不是实例对象的话，重新生成
            if (!(eventName instanceof XEvent)) {
                event = new XEvent({
                    type: eventName,
                    target: this[PROXYTHIS] || this
                });
            } else {
                event = eventName;
                eventName = event.type;
            }

            let evesArr = getEventsArr(eventName, this);

            // 需要去除的事件对象
            let needRmove = [];

            // 修正currentTarget
            event.currentTarget = this[PROXYTHIS] || this;

            // 触发callback函数
            evesArr.forEach(e => {
                e.data && (event.data = e.data);
                e.eventId && (event.eventId = e.eventId);
                e.callback.call(this[PROXYTHIS] || this, event, emitData);
                delete event.data;
                delete event.eventId;

                e.count--;

                if (!e.count) {
                    needRmove.push(e);
                }
            });

            delete event.currentTarget;

            // 去除count为0的事件记录对象
            needRmove.forEach(e => {
                let id = evesArr.indexOf(e);
                (id > -1) && evesArr.splice(id, 1);
            });

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
    class XEvent {
        constructor(opt) {
            this.type = opt.type;
            this.target = opt.target;
            this.bubble = true;
            this.cancel = false;
            this.keys = [];
        }
    }

    // get 可直接获取的正则
    // const GET_REG = /^_.+|^parent$|^index$|^length$|^object$/;
    const GET_REG = /^_.+|^index$|^length$|^object$/;
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
            if (typeof key === "symbol" || /^_.+/.test(key)) {
                return Reflect.set(target, key, value, receiver);
            }

            if (SET_NO_REG.test(key)) {
                console.warn(`you can't set this key in XData => `, key);
                return false;
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

            Object.defineProperties(this, {
                [XDATASELF]: {
                    get: () => this
                },
                [PROXYTHIS]: {
                    value: proxyThis
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
            let _this = this[XDATASELF];

            if (getType(key) === "string") {
                let oldVal = _this[key];

                if (value === oldVal) {
                    // 一样还瞎折腾干嘛
                    return;
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

        /**
         * 转换为普通 object 对象
         * @property {Object} object
         */
        get object() {
            let obj = {};

            let isPureArray = true;

            // 遍历合并数组，并判断是否有非数字
            Object.keys(this).forEach(k => {
                let val = this[k];

                if (val instanceof XData) {
                    val = val.object;
                }

                obj[k] = val;
                if (/\D/.test(k)) {
                    isPureArray = false;
                }
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
                keys.forEach(k => {
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

                Object.keys(this).forEach(k => {
                    let val = this[k];

                    if (val instanceof XData) {
                        let isAgree = expr(val);

                        isAgree && (arr.push(val));

                        // 深入查找是否有符合的
                        let meetChilds = val.seek(expr);

                        arr = [...arr, ...meetChilds];
                    }
                });

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
         * @param {Boolean} ImmeOpt 是否即可触发callback
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
                callback = expr;
                expr = "";
            }

            // 根据参数调整类型
            let watchType;

            if (expr == "") {
                watchType = "watchSelf";
            } else if (/\[.+\]/.test(expr)) {
                watchType = "seekData";
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
                expr
            };

            targetHostObj.add(cacheObj);

            let updateMethod;

            switch (watchType) {
                case "watchSelf":
                    // 监听自身
                    updateMethod = e => {
                        cacheObj.trends.push(e.trend);

                        nextTick(() => {
                            callback.call(this, {
                                trends: Array.from(cacheObj.trends)
                            }, this);

                            cacheObj.trends.length = 0;
                        }, cacheObj);
                    };

                    if (ImmeOpt === true) {
                        callback.call(this, {
                            trends: []
                        }, this);
                    }
                    break;
                case "watchKey":
                    // 监听key
                    updateMethod = e => {
                        if (e.keys[0] == expr) {
                            cacheObj.trends.push(e.trend);

                            nextTick(() => {
                                let val = this[expr];

                                callback.call(this, {
                                    expr,
                                    val,
                                    trends: Array.from(cacheObj.trends)
                                }, val);

                                cacheObj.trends.length = 0;
                            }, cacheObj);
                        }
                    };

                    if (ImmeOpt === true) {
                        callback.call(this, {
                            expr,
                            val: this[expr],
                            trends: []
                        }, this[expr]);
                    }
                    break;
                case "seekData":
                    let oldVals = this.seek(expr);
                    updateMethod = e => {
                        nextTick(() => {
                            let tars = this.seek(expr);
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
                            !isEqual && callback.call(this, {
                                expr,
                                old: oldVals,
                                val: tars
                            }, tars);

                            oldVals = tars;
                        }, cacheObj);
                    };

                    if (ImmeOpt === true) {
                        callback.call(this, {
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
                    this.off("update", cacheObj.updateMethod);
                    targetHostObj.delete(cacheObj);
                    (!targetHostObj.size) && (getXDataProp(this, WATCHHOST).delete(expr));
                }
            }

            return this;
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
                args
            } = trend;

            if (!mid) {
                throw {
                    text: "Illegal trend data"
                };
            }

            if (getXDataProp(this, MODIFYIDS).includes(mid)) {
                return false;
            }

            // 获取相应目标，并运行方法
            let target = this.getTarget(keys);
            target._modifyId = mid;
            target[name](...args);
            target._modifyId = null;

            return true;
        }
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
                let {
                    modify: {
                        name,
                        args,
                        mid
                    },
                    keys
                } = cloneObject(xevent);

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
            let keyOne = this.keys[0];

            if (isUndefined(keyOne) && (this.name === "setData" || this.name === "remove")) {
                keyOne = this.args[0];
            }

            return keyOne;
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
                        xdata.setData(this.object);
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

                    // 返回值，都是被删除的数据，内部数据清空并回收
                    let returnVal = arrayFnFunc.apply(_this, newArgs);

                    // 重置index
                    _this.forEach((e, i) => {
                        if (e instanceof XData) {
                            e.index = i;
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

                    emitUpdate(_this, methodName, args);

                    return returnVal;
                }
            });
        }
    });

    Object.defineProperty(XData.prototype, "sort", {
        /**
         * 对数组进行排序操作
         * @param {Function|Array} arg 排序参数
         */
        value(arg) {
            let args = [arg];
            let _this = this[XDATASELF];
            let oldThis = Array.from(_this);
            if (isFunction(arg)) {
                Array.prototype.sort.call(_this, arg);

                // 重置index
                // 记录重新调整的顺序
                _this.forEach((e, i) => {
                    if (e instanceof XData) {
                        e.index = i;
                    }
                });
                let orders = oldThis.map(e => e.index);
                args = [orders];
                oldThis = null;
            } else if (arg instanceof Array) {
                arg.forEach((aid, id) => {
                    let tarData = _this[aid] = oldThis[id];
                    tarData.index = aid;
                });
            }

            emitUpdate(_this, "sort", args);

            return this;
        }
    });




    class XhearElement extends XData {
        constructor(ele) {
            super({});
            delete this.parent;
            delete this.index;
            ele.__xhear__ = this;
            Object.defineProperties(this, {
                tag: {
                    enumerable: true,
                    value: ele.tagName.toLowerCase()
                },
                ele: {
                    value: ele
                }
            });
        }

        get parent() {
            return (this.ele.parentNode === document) ? null : createXhearElement(this.ele.parentNode);
        }

        get index() {
            let {
                ele
            } = this;
            return Array.from(ele.parentNode.children).indexOf(ele);
        }

        // setData(key, value) {
        //     debugger
        // }

        getData(key) {
            let target;

            if (!/\D/.test(key)) {
                // 纯数字，直接获取children
                target = this.ele.children[key];
                target = createXhearElement(target);
            } else {
                target = this[key];
            }

            if (target instanceof XData) {
                target = target[PROXYTHIS];
            }

            return target;
        }
    }

    const createXhearElement = ele => (ele.__xhear__ || new XhearElement(ele));

    // 全局用$
    let $ = (expr) => {
        let ele;
        switch (getType(expr)) {
            case "string":
                ele = document.querySelector(expr);
                break;
            default:
                if (expr instanceof Element) {
                    ele = expr;
                }
        }

        return createXhearElement(ele)[PROXYTHIS];
    }

    // 添加默认样式
    let mStyle = document.createElement('style');
    mStyle.innerHTML = "[xv-ele]{display:none;}";
    document.head.appendChild(mStyle);

    // 初始化控件
    nextTick(() => {
        Array.from(document.querySelectorAll('[xv-ele]')).forEach(e => {
            renderEle(e);
        });
    });

    glo.$ = $;

})(window);