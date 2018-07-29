// ----jQueryCode----
((glo) => {
    "use strict";

    // start
    // 获取旧的主体
    let _$ = glo.$;

    // 原来的原型链
    let $fn = _$.fn;

    // 基础tag记录器
    let tagDatabase = {};

    // debugger
    glo.tagDatabase = tagDatabase;

    const {
        assign,
        create,
        defineProperty,
        defineProperties
    } = Object;

    // function
    let isUndefined = val => val === undefined;
    let isRealValue = val => val !== undefined && val !== null;
    const hasAttr = (e, attrName) => {
        if (!e.getAttribute) {
            return !!0;
        }
        let attr = e.getAttribute(attrName);
        if (attr !== null && attr !== undefined) {
            return !!1;
        }
    };

    // 获取类型
    let objectToString = Object.prototype.toString;
    const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');

    const each = (arr, func) => Array.from(arr).forEach(func);

    // 获取随机id
    const getRandomId = () => Math.random().toString(32).substr(2);

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

    // COMMON
    // 随机字符串
    const RANDOMID = "_" + getRandomId();
    const SWATCH = RANDOMID + "_watchs";
    const SWATCHGET = SWATCH + "_get";
    const OBSERVERKEYS = RANDOMID + "_observer";
    const XHEAROBJKEY = getRandomId() + "_xhearobj";
    const ATTACHED_KEY = getRandomId() + "_attached";
    const SHADOW_DESCRIPT_CANNOTUSE = 'shadow element can\'t use ';
    // const XDATA_DATAOBJ = getRandomId() + "xdatas";


    // business fucntion 
    const getTagData = (ele) => {
        let tagname = ele.tagName.toLowerCase();
        return tagDatabase[tagname];
    }

    // 生成专用shear对象
    const createShearObject = (ele) => {
        let xvData = ele[XHEAROBJKEY];
        let e = create(xvData);
        e.push(ele);
        return e;
    }

    // 生成普通继承的$实例
    const inCreate$ = arr => {
        let reObj = create(shearInitPrototype);
        reObj.splice(-1, 0, ...arr);
        if (arr.prevObject) {
            reObj.prevObject = arr.prevObject;
        }
        return reObj;
    }

    // 通用实例生成方法
    const createShear$ = arr => {
        if (arr.length == 1 && arr[0][XHEAROBJKEY]) {
            return createShearObject(arr[0]);
        }
        return inCreate$(arr);
    }

    // 渲染所有的sv-ele元素
    const renderAllSvEle = (jqObj) => {
        // 自己是不是sv-ele
        if (jqObj.is('[xv-ele]')) {
            jqObj.each((i, e) => {
                renderEle(e);
            });
        }

        // 查找有没有 sv-ele
        _$('[xv-ele]', Array.from(jqObj)).each((i, e) => {
            renderEle(e);
        });
    }

    // 新jq实例原型对象
    let shearInitPrototype = create($fn);

    // 元素自定义组件id
    let rid = 100;

    const renderEle = (ele) => {
        if (!hasAttr(ele, 'xv-ele')) {
            return;
        }

        // 从库中获取注册数据
        let regData = getTagData(ele);

        // 判断是否存在注册数据
        if (!regData) {
            console.warn('no exist tag', ele);
            return;
        }
        let $ele = _$(ele);

        // 获取子元素
        let childs = Array.from(ele.childNodes);

        // 填充代码
        ele.innerHTML = regData.temp;

        // 生成renderId
        let renderId = ++rid;

        // 初始化对象
        let xhearOriObj = new regData.XHear();
        xhearOriObj._canEmitWatch = 1;
        // xhearOriObj._exkeys = [];
        let xhearObj = new Proxy(xhearOriObj, XObjectHandler);
        ele[XHEAROBJKEY] = xhearObj;

        let xhearEle = createShearObject(ele);

        // 设置渲染id
        $ele.removeAttr('xv-ele').attr('xv-render', renderId);
        $ele.find(`*`).attr('xv-shadow', renderId);

        // 渲染依赖sx-ele
        _$(`[xv-ele][xv-shadow="${renderId}"]`, ele).each((i, e) => {
            renderEle(e);
        });

        // 转换 xv-span 元素
        _$(`xv-span[xv-shadow="${renderId}"]`, ele).each((i, e) => {
            // 替换xv-span
            var textnode = document.createTextNode("");
            e.parentNode.insertBefore(textnode, e);
            e.parentNode.removeChild(e);

            // 文本数据绑定
            var svkey = e.getAttribute('svkey');

            xhearObj.watch(svkey, d => {
                textnode.textContent = d;
            });
        });

        // 放回内容
        let xvContentEle = _$(`[xv-content][xv-shadow="${renderId}"]`, ele);
        if (0 in xvContentEle) {
            // 定义$content属性
            defineProperty(xhearObj, '$content', {
                enumerable: true,
                get() {
                    return createShear$(xvContentEle);
                }
            });

            // 添加svParent
            xvContentEle.prop('svParent', ele);

            // 添加子元素
            xvContentEle.append(childs);

            // 判断是否监听子节点变动
            if (regData.childChange) {
                let observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        let {
                            addedNodes,
                            removedNodes
                        } = mutation;
                        let obsEvent = {};
                        (0 in addedNodes) && (obsEvent.addedNodes = Array.from(addedNodes));
                        (0 in removedNodes) && (obsEvent.removedNodes = Array.from(removedNodes));
                        regData.childChange(createShearObject(ele), obsEvent);
                    });
                });

                // 监听节点
                observer.observe(xvContentEle[0], {
                    attributes: false,
                    childList: true,
                    characterData: false,
                    subtree: false,
                });

                // 设置监听属性
                xhearObj.__obs = observer;
            }
        }

        // 写入其他定义节点
        _$(`[xv-tar][xv-shadow="${renderId}"]`, ele).each((i, e) => {
            let eName = _$(e).attr('xv-tar');
            defineProperty(xhearObj, '$' + eName, {
                enumerable: true,
                get() {
                    return createShear$([e]);
                }
            });
        });

        // 等下需要设置的data
        let rData = assign({}, regData.data);

        // attrs 上的数据
        regData.attrs.forEach(kName => {
            // 获取属性值并设置
            let attrVal = $ele.attr(kName);
            if (isRealValue(attrVal)) {
                rData[kName] = attrVal;
            }

            // 绑定值
            xhearObj.watch(kName, d => {
                // 绑定值
                $ele.attr(kName, d);
            });
        });

        // props 上的数据
        regData.props.forEach(kName => {
            let attrVal = $ele.attr(kName);
            isRealValue(attrVal) && (rData[kName] = attrVal);
        });


        // 绑定xv-module
        _$(`[xv-module][xv-shadow="${renderId}"]`, ele).each((i, tar) => {
            let $tar = _$(tar);
            let kName = $tar.attr('xv-module');

            // 绑定值
            xhearObj.watch(kName, val => {
                tar.value = val;
            });

            // 监听改动
            if (tar[XHEAROBJKEY]) {
                tar[XHEAROBJKEY].watch("value", val => {
                    // kName;
                    // tar;
                    xhearObj[kName] = val;
                });
            } else {
                $tar.on('change input', (e) => {
                    xhearObj[kName] = tar.value;
                });
            }
        });

        // 设置渲染完成
        $ele.removeAttr('xv-ele').attr('xv-render', renderId);

        // 补充rData
        let watchData = regData.watch;
        if (watchData) {
            for (let k in watchData) {
                if (!(k in rData)) {
                    rData[k] = undefined;
                }
            }
        }

        // 设置keys
        xhearOriObj._exkeys = Object.keys(rData);

        // watch监听
        if (watchData) {
            for (let k in watchData) {
                let tar = watchData[k];

                // 两个callback
                let getCallback, setCallback;

                switch (getType(tar)) {
                    case "function":
                        setCallback = tar;
                        break;
                    case "object":
                        getCallback = tar.get;
                        setCallback = tar.set;
                        break;
                }

                getCallback && watchGetter(xhearObj, k, getCallback.bind(xhearEle));
                setCallback && xhearObj.watch(k, setCallback.bind(xhearEle));
            }
        }

        // 存在 value key
        if ('value' in rData) {
            defineProperty(ele, 'value', {
                get() {
                    return xhearObj.value;
                },
                set(d) {
                    xhearObj.value = d;
                }
            });
        }

        // 先铺设数据
        // xhearObj.set();
        // each(Object.keys(rData), k => {
        //     xhearObj[k] = undefined;
        // });

        // 设置数据
        for (let k in rData) {
            isRealValue(rData[k]) && (xhearObj[k] = rData[k]);
        }

        // 触发callback
        regData.inited && regData.inited.call(ele, xhearEle);

        // attached callback
        if (regData.attached && ele.getRootNode() === document && !ele[ATTACHED_KEY]) {
            regData.attached.call(ele, xhearEle);
            ele[ATTACHED_KEY] = 1;
        }
    }

    // 还原给外部的$
    let $ = function (...args) {
        let reObj = _$(...args);
        let [arg1, arg2] = args;

        // 优化操作，不用每次都查找节点
        // 判断传进来的参数是不是字符串
        if ((getType(arg1) == "string" && arg1.search('<') > -1) || arg1 instanceof Element) {
            renderAllSvEle(reObj);
        }

        // 去除 shadow 元素
        let arg2_svShadow;
        if (arg2) {
            if (arg2.getAttribute) {
                arg2_svShadow = arg2.getAttribute('xv-shadow');
            } else if (arg2.attr) {
                arg2_svShadow = arg2.attr('xv-shadow');
            }
        }
        if (arg2_svShadow) {
            reObj = filterShadow(reObj, arg2_svShadow);
        } else {
            reObj = filterShadow(reObj);
        }

        // 生成实例
        reObj = createShear$(reObj);

        return reObj;
    };
    $.prototype = $fn;
    assign($, {
        init: (...args) => createShear$(args)
    }, _$);

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

    const seekByProp = (tarObj, value, prop = "_id") => {
        let reobj = [];

        if (isXData(tarObj)) {
            // 查询是否相等
            if (value && tarObj[prop] == value) {
                reobj.push(tarObj);
            } else if (!value && tarObj.hasOwnProperty(prop)) {
                reobj.push(tarObj);
            }

            // 同时查询内部
            let tObjs = seekData(tarObj, value, prop);
            reobj.splice(0, 0, ...tObjs);
        }

        return reobj;
    }

    // 查找对象
    const seekData = (data, value, prop = "_id") => {
        let reobj = [];
        if (data instanceof XObject) {
            if (prop == "_id") {
                for (let k in data) {
                    reobj = seekByProp(data[k], value, prop);
                    if (0 in reobj) {
                        break;
                    }
                }
            } else {
                for (let k in data) {
                    let temp = seekByProp(data[k], value, prop);
                    reobj.splice(reobj.length, 0, ...temp);
                }
            }
        } else if (data instanceof XArray) {
            if (prop == "_id") {
                data.some(tar => {
                    reobj = seekByProp(tar, value, prop);
                    if (0 in reobj) {
                        return true;
                    }
                });
            } else {
                data.forEach(tar => {
                    let temp = seekByProp(tar, value, prop);
                    reobj.splice(reobj.length, 0, ...temp);
                });
            }
        }

        return reobj;
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
        },
        // 查找相应prop的数据对象
        seek(prop) {
            let reData;
            let propMatch = prop.match(/\[.+?\]/g);
            if (propMatch) {
                // 临时函数
                let temFunc = (i, tempArr) => {
                    // 替换成当前数组
                    if (i === 0) {
                        reData = tempArr;
                    } else {
                        // 替换数组
                        let newArr = [];

                        // 取并集
                        tempArr.forEach(e => {
                            if (reData.indexOf(e) > -1) {
                                newArr.push(e);
                            }
                        });

                        // 替换
                        reData = newArr;
                    }
                }

                propMatch.forEach((e, i) => {
                    if (e.search('=') > -1) {
                        let props = e.match(/\[(.+?)=(.+?)\]/);
                        let key = props[1],
                            value = props[2];
                        let tempArr = seekByProp(this, value, key);

                        temFunc(i, tempArr);
                    } else {
                        let key = e.replace('[', "").replace(']', "").replace('=', "");
                        let tempArr = seekByProp(this, undefined, key);

                        temFunc(i, tempArr);
                    }
                });

                temFunc = null;
            } else {
                reData = seekByProp(this, prop)[0];
            }
            return reData;
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

    // function

    // 原型对象
    let XHearFn = Object.create(shearInitPrototype);

    // 设置svRender
    XHearFn.svRender = !0;

    // 合并数据
    // assign(XHearFn, XDataFn);
    for (let k in XObjectFn) {
        defineProperty(XHearFn, k, {
            value: XObjectFn[k]
        });
    }

    defineProperty(XHearFn, 'set', {
        value(key, value) {
            let id = this._exkeys.indexOf(key);
            if (id === -1) {
                this._exkeys.push(key);
            }
            this[key] = value;
        }
    });

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

        let {
            proto,
            props,
            temp,
            tag
        } = defaults;

        // 添加value定值
        props.push('value');

        // 生成新的数据对象
        let XHear = function (...args) {
            XObject.apply(this, args);
        }

        let inXHearFn = XHearFn;

        // 判断是否有公用方法
        if (proto) {
            inXHearFn = create(XHearFn);
            assign(inXHearFn, proto);
        }

        // 赋值原型对象
        XHear.prototype = inXHearFn;

        // 去除无用的代码（注释代码）
        temp = temp.replace(/<!--.+?-->/g, "");

        //准换自定义字符串数据
        var textDataArr = temp.match(/{{.+?}}/g);
        textDataArr && textDataArr.forEach((e) => {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                temp = temp.replace(e, `<xv-span svkey="${key[1].trim()}"></xv-span>`);
            }
        });

        // 加入tag数据库
        tagDatabase[tag] = assign({}, defaults, {
            XHear,
            temp
        })

        // 渲染已存在tag
        _$(defaults.tag + '[xv-ele]').each((i, e) => {
            renderEle(e);
        });
    }

    $.register = register;

    const filterShadow = ($eles, exShadowId) => {
        // 去除 shadow 元素
        let hasShadow = 0,
            newArr = [],
            {
                prevObject
            } = $eles;

        if (exShadowId) {
            $eles.each((i, e) => {
                if (hasAttr(e, 'xv-shadow') && e.getAttribute('xv-shadow') == exShadowId) {
                    newArr.push(e);
                    hasShadow = 1;
                }
            });
        } else {
            $eles.each((i, e) => {
                if (hasAttr(e, 'xv-shadow')) {
                    hasShadow = 1;
                } else {
                    newArr.push(e);
                }
            });
        }

        if (hasShadow) {
            $eles = _$(newArr);
            // 还原prevObject
            if (prevObject) {
                $eles.prevObject = prevObject;
            }
        }

        return $eles;
    }

    // 覆盖还原 xv-ele 数据
    const matchCloneData = (tarEle, referEle) => {
        // 生成当前元素
        let tagname = tarEle[0].tagName.toLowerCase();

        // 映射data
        let tarData = tagDatabase[tagname];

        // 获取关键key
        let keyArr = new Set([...Object.keys(tarData.data), ...tarData.props, ...tarData.attrs]);

        // 还原数据
        each(keyArr, (e) => {
            tarEle[e] = referEle[e];
        });
    }

    // 还原克隆xv-ele元素成html模式
    // 用的都是$fn.find
    const reduceCloneSvEle = (elem) => {
        let renderId = elem.attr('xv-render');

        if (renderId) {
            // 清除所有非 xv-content 的 xv-shadow 元素
            elem.find(`[xv-shadow="${renderId}"]:not([xv-content])`).remove();

            // 将剩余的 xv-content 还原回上一级去
            elem.find(`[xv-shadow="${renderId}"][xv-content]`).each((i, e) => {
                // 获取子元素数组
                _$(e).before(e.childNodes).remove();
            });
        }

        // 判断是否有子xv-ele元素，并还原
        let childsSvEle = elem.find('[xv-render]');
        childsSvEle.each((i, e) => {
            reduceCloneSvEle(_$(e));
        });
    };

    // 修正content的xv-shadow属性
    const fixShadowContent = (_this, content) => {
        // 获取content类型
        let contentType = getType(content);

        // 如果自己是影子元素
        if (_this.is('[xv-shadow]')) {
            // 获取shadowId
            let svid = _this.attr('xv-shadow');
            if ((contentType == "string" && content.search('<') > -1)) {
                let contentEle = _$(content)
                contentEle.attr('xv-shadow', svid);
                contentEle.find('*').attr('xv-shadow', svid);
                content = "";
                each(contentEle, (e) => {
                    content += e.outerHTML;
                });
            } else
            if (contentType instanceof Element) {
                _$(content).attr('xv-shadow', svid);
            } else if (content instanceof $) {
                _$(Array.from(content)).attr('xv-shadow', svid);
            }
        }
        return content;
    }

    // 筛选出自身对象
    const fixSelfToContent = (_this) => {
        if (_this.is('[xv-render]')) {
            _this = _this.map((i, e) => {
                let re = e;
                let xvData = e[XHEAROBJKEY];
                while (xvData && xvData.$content) {
                    re = xvData.$content[0];
                    xvData = re.xvData;
                }
                return re;
            });
        }
        return _this;
    };

    // 修正其他节点操控的方法
    assign(shearInitPrototype, {
        add(...args) {
            let obj = args[0];
            if (obj instanceof glo.$ && obj.is('xv-shadow')) {
                throw SHADOW_DESCRIPT_CANNOTUSE + 'add';
            }
            return $fn.add.apply(this, args);
        },
        attr(...args) {
            let [aName, aValue] = args;
            if (aValue && this.is('[xv-render]')) {
                this.each((i, e) => {
                    let tagdata = getTagData(e);
                    if (tagdata) {
                        // 查找attr内是否有他自己
                        if (tagdata.attrs.indexOf(aName) > -1) {
                            e[XHEAROBJKEY][aName] = aValue;
                            return;
                        }
                    }
                    $fn.attr.apply(_$(e), args);
                });
                return this;
            } else {
                return $fn.attr.apply(this, args);
            }
        },
        clone(...args) {
            if (this.is('[xv-shadow]')) {
                throw SHADOW_DESCRIPT_CANNOTUSE + 'clone';
            }
            if (this.svRender) {
                // 获取原先的html
                // shearInitPrototype.html
                let b_html = this.html();

                // 将所有 xv-render 变成 xv-ele
                let temDiv = _$(`<div>${b_html}</div>`);
                // $fn.find
                temDiv.find('[xv-render]').each((i, e) => {
                    _$(e).removeAttr('xv-render').attr('xv-ele', "");
                });
                b_html = temDiv.html();

                // 生成当前元素
                let tagname = this[0].tagName.toLowerCase();

                // 生成克隆元素
                let cloneEle = this[0].cloneNode();
                _$(cloneEle).removeAttr('xv-render').attr('xv-ele', "").html(b_html);
                renderEle(cloneEle);
                let tar = createShearObject(cloneEle);

                // 还原数据
                matchCloneData(tar, this);

                // 判断content是否还有xv-ele，渲染内部
                let bRenderEles = _$('[xv-render]:not([xv-shadow])', this);
                if (0 in bRenderEles) {
                    let aRenderEles = _$('[xv-render]:not([xv-shadow])', tar);
                    // 确认数量匹配
                    if (aRenderEles.length == bRenderEles.length) {
                        aRenderEles.each((i, e) => {
                            // 获取对方
                            let referEle = bRenderEles[i];

                            // 确认tag匹配
                            if (referEle.tagName !== e.tagName) {
                                console.warn('cloned xv-ele data does not match');
                                return false;
                            }

                            // 通过匹配
                            matchCloneData(createShearObject(e), createShearObject(referEle));
                        });
                    }
                }

                return tar;
            } else {
                let isSvRender = this.is('[xv-render]');
                let hasSvRender = 0 in this.find('[xv-render]');
                if (isSvRender || hasSvRender) {
                    // 抽出来
                    let tar = _$(Array.from(this));

                    // 直接克隆一份
                    let cloneEle = tar.clone(...args);

                    // 还原克隆元素内的svele
                    reduceCloneSvEle(cloneEle);

                    // 重新渲染克隆元素
                    cloneEle.find('[xv-render]').removeAttr('xv-render').attr('xv-ele', "");
                    renderAllSvEle(cloneEle);

                    tar.each((i, e) => {
                        if (hasAttr(e, 'xv-render')) {
                            cloneEle[i] = createShearObject(e).clone()[0];
                        }
                    });

                    // 还原克隆方法
                    let cloneFun = (expr) => {
                        let cloneSvRenderEle = cloneEle.find(expr);
                        if (0 in cloneSvRenderEle) {
                            let oriSvRenderEle = tar.find(expr);

                            if (cloneSvRenderEle.length == oriSvRenderEle.length) {
                                // 逐个克隆还原回去
                                oriSvRenderEle.each((i, e) => {
                                    matchCloneData(createShearObject(cloneSvRenderEle[i]), createShearObject(e));
                                });
                            }
                        }
                    };

                    // 还原克隆svele
                    cloneFun('[xv-render]:not([xv-shadow])');
                    cloneFun('[xv-render][xv-shadow]');

                    this.prevObject && (cloneEle.prevObject = this);

                    return createShear$(cloneEle);
                } else {
                    $fn.clone.apply(this, args);
                }
            }
        },
        empty() {
            $fn.empty.call(fixSelfToContent(this));
            return this;
        },
        parent(expr) {
            let rearr = this.map((i, e) => {
                let re = e.parentNode;
                while (re.svParent) {
                    re = re.svParent;
                }
                return re;
            });
            let reobj = createShear$(Array.from(new Set(rearr)));
            if (expr) {
                reobj = reobj.filter(expr);
            }
            return reobj;
        },
        // parents需要重做
        parents(expr) {
            let rearr = [];
            this.each((i, e) => {
                let par = e.parentNode;
                while (par && par !== document) {
                    while (par.svParent) {
                        par = par.svParent;
                    }
                    rearr.push(par);
                    par = par.parentNode;
                }
            });
            let reobj = createShear$(Array.from(new Set(rearr)));
            if (expr) {
                reobj = reobj.filter(expr);
            }
            return reobj;
        },
        parentsUntil(expr) {
            let rearr = [];

            this.each((i, e) => {
                let par = e.parentNode;
                while (par && par !== document) {
                    while (par.svParent) {
                        par = par.svParent;
                    }
                    if (expr && _$(par).is(expr)) {
                        break;
                    }
                    rearr.push(par);
                    par = par.parentNode;
                }
            });

            return createShear$(new Set(rearr));
        },
        // unwrap需要重做
        unwrap() {
            let pNode = _$(this).parent();
            if (pNode.is('[xv-content]')) {
                pNode.each((i, e) => {
                    let {
                        svParent
                    } = e;
                    if (svParent) {
                        svParent = _$(svParent);
                    } else {
                        svParent = _$(e);
                    }
                    let childs = e.childNodes;
                    each(childs, (e_child) => {
                        svParent.before(e_child);
                    });
                    svParent.remove();
                });
            } else {
                $fn.unwrap.call(this);
            }
            return this;
        },
        // 查找所有元素（包含影子元素）
        findReal(...args) {
            return createShear$($fn.find.apply(this, args));
        },
        // 只查找自己的影子元素
        findShadow(...args) {
            let reObj = $fn.find.apply(this, args);
            reObj = filterShadow(reObj, this.attr('xv-render'));
            return createShear$(reObj);
        }
    });

    // 修正影子content
    each(['after', 'before', 'wrap', 'wrapAll', 'replaceWith'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (content) {
            // 继承旧的方法
            oldFunc.call(this, fixShadowContent(this, content));

            renderAllSvEle(this.parent());

            // 返回对象
            return this;
        });
    });

    // 紧跟after before wrap 步伐
    each(['insertAfter', 'insertBefore', 'replaceAll'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (content) {
            // 影子元素不能做这个操作
            if (this.is('[xv-shadow]')) {
                throw SHADOW_DESCRIPT_CANNOTUSE + kName;
            }

            // 继承旧的方法
            oldFunc.call(fixShadowContent(_$(content), this), content);

            // 返回对象
            return this;
        });
    });

    // 修正影子content，引向$content
    each(['append', 'prepend', 'wrapInner'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (content) {

            // 继承旧的方法
            oldFunc.call(fixSelfToContent(this), fixShadowContent(this, content));

            renderAllSvEle(this);

            return this;
        });
    });

    // 紧跟append 和 prepend 步伐
    each(['appendTo', 'prependTo'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (content) {
            // 影子元素不能做这个操作
            if (this.is('[xv-shadow]')) {
                throw SHADOW_DESCRIPT_CANNOTUSE + kName;
            }

            let $con = _$(content);

            if ($con.is('[xv-shadow]')) {
                fixShadowContent($con, this);
            }

            // 继承旧的方法
            oldFunc.call(this, fixSelfToContent($con));

            return this;
        });
    });

    // 超找子元素型方法
    // 引向$content，影子过滤，修正成svele
    each(['find', 'children'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (expr) {
            let reObj = oldFunc.call(fixSelfToContent(this), expr);

            let svData = (reObj.length == 1) && reObj[0][XHEAROBJKEY];

            if (svData) {
                reObj = createShearObject(reObj[0]);
            } else {
                if (this.is('[xv-shadow]')) {
                    reObj = filterShadow(reObj, this.attr('xv-shadow'));
                } else {
                    // 如果前一级不是xv-shaodw，就去除查找后的带xv-shadow
                    reObj = filterShadow(reObj);
                }
                reObj = createShear$(reObj);
            }

            return reObj;
        });
    });

    // 筛选型方法
    // 修正成svele （筛选型方法）
    each(['eq', 'first', 'last', 'filter', 'has', 'not', 'slice', 'next', 'nextAll', 'nextUntil', 'prev', 'prevAll', 'prevUntil', 'siblings'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (...args) {
            let reObj = $fn[kName].apply(this, args);
            reObj = createShear$(reObj);
            return reObj;
        });
    });

    // html text
    each(['html', 'text'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (content) {
            // 需要返回的对象
            let reObj = this;

            // 为了获取html来的
            if (isUndefined(content)) {
                let elem = _$(reObj[0]);

                // 判断是否存在 shear控件
                // $fn.find
                if (0 in elem.find('[xv-shadow]')) {
                    // 先复制一个出来
                    let cloneElem = _$(elem[0].cloneNode(true));

                    // 还原元素
                    reduceCloneSvEle(cloneElem);

                    // 返回
                    return oldFunc.call(cloneElem);
                } else {
                    return oldFunc.call(elem);
                }
            } else {
                // 直接继承
                if (kName !== 'text') {
                    content = fixShadowContent(this, content);
                }

                reObj = oldFunc.call(fixSelfToContent(this), content);
                // reObj = oldFunc.call(fixSelfToContent(this));

                renderAllSvEle(this);

                // 返回对象
                return reObj;
            }
        });
    });

    (() => {
        // 判断有没有pushStack
        let {
            pushStack
        } = $fn;
        if (pushStack) {
            shearInitPrototype.pushStack = function (...args) {
                return createShear$(pushStack.apply(this, args));
            }
        }
    })();

    // init
    const xhear = {
        register
    };

    glo.xhear = xhear;

    glo.$ = $;

    // ready
    // 页面进入之后，进行一次渲染操作
    _$(() => {
        const attachedFun = (ele) => {
            if (ele[ATTACHED_KEY]) {
                return;
            }
            let tagdata = getTagData(ele);
            tagdata.attached && tagdata.attached.call(ele, createShearObject(ele));
            ele[ATTACHED_KEY] = 1;
        }

        const detachedFunc = (ele) => {
            // 确认是移出 document 的元素
            if (ele.getRootNode() != document) {
                let tagdata = getTagData(ele);
                tagdata.detached && tagdata.detached.call(ele, createShearObject(ele));

                // 防止内存不回收
                // 清除svParent
                _$('[xv-content]', ele).each((i, e) => {
                    delete e.svParent;
                });

                // 清空observer属性
                let xvData = ele[XHEAROBJKEY];

                if (xvData) {
                    xvData.__obs && xvData.__obs.disconnect();
                    delete xvData.__obs;
                    delete ele[XHEAROBJKEY];
                }
            }
        }

        // attached detached 监听
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((e) => {
                let {
                    addedNodes,
                    removedNodes
                } = e;

                // 监听新增元素
                if (addedNodes && 0 in addedNodes) {
                    each(addedNodes, (ele) => {
                        if (ele[XHEAROBJKEY]) {
                            attachedFun(ele);
                        }

                        if (ele instanceof Element) {
                            // 触发已渲染的attached
                            each(ele.querySelectorAll('[xv-render]'), e => {
                                attachedFun(e);
                            });
                        }
                    });
                }

                // 监听去除元素
                if (removedNodes && 0 in removedNodes) {
                    each(removedNodes, (ele) => {
                        if (ele[XHEAROBJKEY]) {
                            detachedFunc(ele);
                        }

                        _$('[xv-render]', ele).each((i, e) => {
                            detachedFunc(e);
                        });
                    });
                }
            });
        });
        observer.observe(document.body, {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true,
        });

        // 初始渲染一次
        _$('[xv-ele]').each((i, e) => {
            renderEle(e);
        });
    });

    // 初始css
    _$('head').append('<style>[xv-ele]{display:none}</style>');

})(window);