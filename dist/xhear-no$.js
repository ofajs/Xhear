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

// 填充 value tag
const appendInData = (data, callback) => {
    // 获取tag
    let {
        tag
    } = data;

    // 获取深复制，删除tag、数字和length
    let cData = {};
    Object.keys(data).forEach(k => {
        if (/\D/.test(k)) {
            cData[k] = data[k];
        }
    });
    delete cData.tag;
    delete cData.length;

    // 生成元素
    let xEle = $(`<${tag} xv-ele xv-rid="${data._id}"></${tag}>`);

    // 合并数据
    assign(xEle, cData);

    // 执行callback
    callback(xEle);

    // 递归添加子元素
    Array.from(data).forEach(data => {
        appendInData(data, (cEle) => {
            xEle.append(cEle);
        });
    });
}

// 重新填充元素
const resetInData = (xhearEle, childsData) => {
    xhearEle.hide();

    // 新添加
    xhearEle.empty();

    // 添加进元素
    childsData.forEach(data => {
        appendInData(data, xEle => {
            // 首个填入
            xhearEle.append(xEle);
        });
    });

    xhearEle.show();
}

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
    let xhearOriObj = new regData.XHear({});
    let xhearObj = new Proxy(xhearOriObj, XDataHandler);
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

    // 创建渲染器
    xhearEle.watch("render", (childsData, e) => {
        if (e.type === "new") {
            resetInData(xhearEle, childsData);
            return;
        }
        // 后续修改操作，就没有必要全部渲染一遍了
        // 针对性渲染

        // 获取目标对象、key和值
        let {
            trend
        } = e;
        let [target, keyName] = $.detrend(xhearEle, trend);
        let value = target[keyName];

        if (trend.type == "array-method") {
            // 先处理特殊的
            switch (trend.methodName) {
                case 'copyWithin':
                case 'fill':
                case 'reverse':
                case 'sort':
                    // 重新填充数据
                    resetInData(xhearEle, childsData);
                    return;
            }

            // 三个基本要素
            let index, removeCount, newDatas;

            // 获取目标元素
            let tarDataEle = xhearEle.find(`[xv-rid="${value._id}"]`);

            switch (trend.methodName) {
                case "splice":
                    // 先获取要删减的数量
                    [index, removeCount, ...newDatas] = trend.args;
                    break;
                case 'shift':
                    index = 0;
                    removeCount = 1;
                    newDatas = [];
                    break;
                case 'unshfit':
                    index = 0;
                    removeCount = 0;
                    newDatas = trend.args;
                    break;
                case 'push':
                    index = tarDataEle.children().length;
                    removeCount = 0;
                    newDatas = trend.args;
                    break;
                case 'pop':
                    index = tarDataEle.children().length;
                    removeCount = 1;
                    newDatas = [];
                    break;
            };
            // 走splice通用流程
            // 最后的id
            let lastRemoveId = index + removeCount;

            // 根据数据删除
            (removeCount > 0) && tarDataEle.children().each((i, e) => {
                if (i >= index && i < lastRemoveId) {
                    $(e).remove();
                }
            });

            // 获取相应id的元素
            let indexEle = tarDataEle.children().eq(index);

            // 后置数据添加
            newDatas.forEach(data => {
                appendInData(data, (xEle) => {
                    if (0 in indexEle) {
                        // before
                        indexEle.before(xEle);
                    } else {
                        // append
                        tarDataEle.append(xEle);
                    }
                });
            });
        } else {
            if (/\D/.test(keyName)) {
                // 改变属性值
                // 获取元素
                let targetEle = xhearEle.find(`[xv-rid="${target._id}"]`);

                // 修改值
                targetEle[keyName] = value;
            } else {
                // 替换旧元素
                let {
                    oldId
                } = trend;

                if (oldId) {
                    // 获取元素
                    let oldEle = xhearEle.find(`[xv-rid="${oldId}"]`);

                    // 向后添加元素
                    appendInData(value, (xEle) => {
                        oldEle.after(xEle);
                    });

                    // 删除旧元素
                    oldEle.remove();
                }
            }
        }

    });

    // 设置keys
    // 将value和render添加进key里
    let exkeys = Object.keys(rData);
    exkeys.includes('value') || (exkeys.push('value'));
    exkeys.includes('render') || (exkeys.push('render'));
    xhearOriObj._exkeys = exkeys;

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

    defineProperty(ele, 'value', {
        get() {
            return xhearObj.value;
        },
        set(d) {
            xhearObj.value = d;
        }
    });

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
const trendClone = trend => {
    let newTrend = deepClone(trend);
    if (trend.args) {
        newTrend.args = trend.args.slice();
    }
    return newTrend;
}
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
                // 不需要保留trend的参数，所以直接深复制
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
                        this.entrend(deepClone(e.trend));
                    }
                }
                func2 = e => {
                    if (options.includes(e.key)) {
                        target.entrend(deepClone(e.trend));
                    }
                }
                break;
            case "string":
                func1 = e => {
                    if (e.key === options) {
                        this.entrend(deepClone(e.trend));
                    }
                }
                func2 = e => {
                    if (e.key === options) {
                        target.entrend(deepClone(e.trend));
                    }
                }
                break;
            default:
                // undefined
                func1 = e => this.entrend(deepClone(e.trend));
                func2 = e => target.entrend(deepClone(e.trend));
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
        emitChange(host, hostkey, tar, tar, "update", trendClone(trend));
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

    $.xdata = obj => createXData(obj);
    $.detrend = detrend;

    // function

// 原型对象
let XHearFn = Object.create(shearInitPrototype);

// 设置svRender
XHearFn.svRender = !0;

// 合并数据
// assign(XHearFn, XDataFn);
for (let k in XDataProto) {
    defineProperty(XHearFn, k, {
        value: XDataProto[k]
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
        // 是否渲染value
        // renderValue: 0,
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
        XData.apply(this, args);
    }

    let inXHearFn = XHearFn;

    // 判断是否有公用方法
    if (proto) {
        inXHearFn = create(XHearFn);
        for (let k in proto) {
            let {
                get,
                set
            } = Object.getOwnPropertyDescriptor(proto, k);

            if (get || set) {
                defineProperty(inXHearFn, k, {
                    set,
                    get
                });
            } else {
                inXHearFn[k] = proto[k];
            }

        }
        // assign(inXHearFn, proto);
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