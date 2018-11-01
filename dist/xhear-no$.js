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
        xvData._pausedEmit = 1;
        e.push(ele);
        delete xvData._pausedEmit;
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
    const getXEleByData = (data, tagMap) => {
        // 获取tag
        let {
            tag
        } = data;

        if (tagMap && tagMap[tag]) {
            tag = tagMap[tag];
        }

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
        let xEle = $(`<${tag} xv-ele xv-render-ele xv-rid="${data._id}"></${tag}>`);

        // 合并数据
        assign(xEle, cData);

        // 递归添加子元素
        Array.from(data).forEach(data => {
            xEle.append(getXEleByData(data, tagMap));
        });

        return xEle;
    }

    // 重新填充元素
    const resetInData = (xhearEle, childsData, tagMap) => {
        xhearEle.hide();

        // 新添加
        xhearEle.empty();

        // 添加进元素
        childsData.forEach(data => {
            xhearEle.append(getXEleByData(data, tagMap));
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
            // 获取目标对象、key和值
            let {
                trend
            } = e;

            if (e.type === "new" || (trend && !trend.methodName && trend.keys.length === 1)) {
                resetInData(xhearEle, childsData, regData.renderMap);
                return;
            }
            // 后续修改操作，就没有必要全部渲染一遍了
            // 针对性渲染
            let {
                target,
                key,
                value
            } = detrend(xhearEle, trend);

            // 获取目标元素
            let tarDataEle;

            if (trend.keys.length == 1 && trend.keys[0] == "render") {
                tarDataEle = xhearEle;
            } else {
                tarDataEle = xhearEle.find(`[xv-rid="${target._id}"]`);
            }

            if (trend.type == "array-method") {
                // 先处理特殊的
                switch (trend.methodName) {
                    case 'fill':
                    case 'reverse':
                    case 'sort':
                        // 重新填充数据
                        resetInData(tarDataEle, target, regData.renderMap);
                        return;
                }

                // 三个基本要素
                let index, removeCount, newDatas;

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
                        index = tarDataEle.children('[xv-render-ele]').length;
                        removeCount = 0;
                        newDatas = trend.args;
                        break;
                    case 'pop':
                        index = tarDataEle.children('[xv-render-ele]').length;
                        removeCount = 1;
                        newDatas = [];
                        break;
                };
                // 走splice通用流程
                // 最后的id
                let lastRemoveId = parseInt(index) + parseInt(removeCount);

                // 根据数据删除
                (removeCount > 0) && tarDataEle.children('[xv-render-ele]').each((i, e) => {
                    if (i >= index && i < lastRemoveId) {
                        $(e).remove();
                    }
                });

                // 获取相应id的元素
                let indexEle = tarDataEle.children('[xv-render-ele]').eq(index);

                // 后置数据添加
                newDatas.forEach(data => {
                    let xEle = getXEleByData(data, regData.renderMap);

                    if (0 in indexEle) {
                        // before
                        indexEle.before(xEle);
                    } else {
                        // append
                        tarDataEle.append(xEle);
                    }
                });
            } else {
                if (/\D/.test(key)) {
                    // 改变属性值
                    // 获取元素
                    let targetEle = xhearEle.find(`[xv-rid="${target._id}"]`);

                    // 修改值
                    targetEle[key] = value;
                } else {
                    // 替换旧元素
                    let {
                        oldVal
                    } = trend;

                    let oldId = oldVal._id;

                    if (oldId) {
                        // 获取元素
                        let oldEle = xhearEle.find(`[xv-rid="${oldId}"]`);

                        // 向后添加元素
                        oldEle.after(getXEleByData(value, regData.renderMap));

                        // 删除旧元素
                        oldEle.remove();
                    } else {
                        // 直接替换数组，而不是通过push添加的
                        // 直接向后添加元素
                        let xEle = getXEleByData(value, regData.renderMap);

                        // 在render数组下的数据
                        if (target._host._id === xhearEle._id) {
                            xhearEle.append(xEle);
                        } else {
                            let parEle = xhearEle.find(`[xv-rid="${target._id}"]`);
                            parEle.append(getXEleByData(value, regData.renderMap));
                        }
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
    // 数据entrend id记录
    const XDATATRENDIDS = "_trend_" + getRandomId();
    // 获取xdata元数据的方法名
    const GETXDATA = "_getxdata_" + getRandomId();
    // 数据绑定记录
    const XDATASYNCS = "_syncs_" + getRandomId();
    // listen 记录
    const LISTEN = "_listen_" + getRandomId();

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

    // 克隆对象
    let deepClone = obj => obj instanceof Object ? JSON.parse(JSON.stringify(obj)) : obj;
    // 保留_id克隆对象
    let keepIdClone = obj => {
        let objType = getType(obj);
        let redata = deepClone(obj);
        switch (objType) {
            case "array":
                redata = [];
                obj.forEach(e => {
                    redata.push(keepIdClone(e));
                });
            case "object":
                if (obj._id) {
                    defineProperty(redata, "_id", {
                        value: obj._id
                    });
                }
                break;
        }
        return redata;
    };
    // trend克隆器
    // 节约keepIdClone的性能
    const trendClone = trend => {
        let newTrend = deepClone(trend);
        // args保留_id
        if (trend.args) {
            newTrend.args = trend.args.slice();
        }
        // returnValue 保留_id
        if (trend.returnValue) {
            defineProperty(newTrend, "returnValue", {
                value: trend.returnValue
            });
            // newTrend.returnValue = keepIdClone(trend.returnValue);
        }
        // oldVal保留
        if (trend.oldVal !== undefined) {
            defineProperty(newTrend, "oldVal", {
                value: trend.oldVal
            });
        }
        // 保留 add 和 remove
        trend.add && defineProperty(newTrend, "add", {
            value: trend.add
        });
        trend.remove && defineProperty(newTrend, "remove", {
            value: trend.remove
        });

        return newTrend;
    }

    // business function
    const isXData = obj => obj instanceof XData;

    // 清除xdata的临时数据
    const clearXData = tar => {
        // 清除内部绑定的函数
        // 清除 listen
        tar[LISTEN].forEach(e => {
            tar.unlisten(e.callback);
        });

        // 清除 sync
        tar[XDATASYNCS].forEach(e => {
            tar.unsync(e.opp, e.options);
        });

        // 清除 watch
        let xdataEvents = tar[XDATAEVENTS];
        for (let k in xdataEvents) {
            delete xdataEvents[k];
        }
    }

    // 获取事件寄宿对象
    const getEventObj = (tar, eventName) => tar[XDATAEVENTS][eventName] || (tar[XDATAEVENTS][eventName] = []);

    // 绑定事件
    const onXDataEvent = (tar, eventName, callback) => getEventObj(tar, eventName).push(callback);

    // 注销事件
    const unXDataEvent = (tar, eventName, callback) => {
        let eveArr = getEventObj(tar, eventName);
        let id = eveArr.indexOf(callback);
        eveArr.splice(id, 1);
    };

    // 触发事件
    const emitXDataEvent = (tar, eventName, args) => {
        let eveArr = getEventObj(tar, eventName);

        // 遍历事件对象
        eveArr.forEach(callback => {
            callback.apply(tar, args);
        });
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

    // 解析 trend data 到最终对象
    let detrend = (tar, trendData) => {
        let key;

        // 数组last id
        let lastId = trendData.keys.length - 1;
        trendData.keys.forEach((tKey, i) => {
            if (i < lastId) {
                tar = tar[tKey];
            }
            key = tKey;
        });

        let reObj = {
                type: trendData.type,
                add: trendData.add,
                remove: trendData.remove
            },
            value = tar[key];

        switch (trendData.type) {
            case "new":
            case "update":
            case "delete":
                assign(reObj, {
                    target: tar,
                    key,
                    value: (lastId >= 0) ? value : undefined
                });
                (trendData.oldVal !== undefined) && (reObj.oldVal = trendData.oldVal);
                break;
            case "sort":
                assign(reObj, {
                    target: (lastId >= 0) ? value : tar,
                    sort: trendData.sort
                });
                break;
            case "array-method":
                assign(reObj, {
                    target: (lastId >= 0) ? value : tar,
                    args: trendData.args,
                    methodName: trendData.methodName,
                    returnValue: trendData.returnValue
                });
        }

        return reObj;
    }

    // 不触发emitChange运行xdata的方法
    const runXDataMethodNoEmit = (xdata, callback) => {
        xdata._pausedEmit = 1;
        callback();
        delete xdata._pausedEmit;
    }

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
            if (isXData(val)) {
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

    // 触发冒泡事件
    const emitChange = (options) => {
        let {
            target,
            key,
            value,
            oldVal,
            type,
            trendData
        } = options;

        // 判断没有禁止触发
        if (target._pausedEmit) {
            return;
        }

        // 深克隆的 trendData
        let cloneTrendData = trendClone(trendData);

        if (key !== undefined) {
            // 属性数据变动
            // 添加key
            cloneTrendData.keys.unshift(key);

            // 触发事件
            // watch处理
            emitXDataEvent(target, "watch-" + key, [value, {
                oldVal,
                type,
                trend: cloneTrendData
            }]);
            emitXDataEvent(target, "watch-", [{
                key,
                val: value,
                type,
                oldVal,
                trend: cloneTrendData
            }]);
        } else {
            // 自身对象变动
            // 运行数组的方法才会跑到这里
            let watchOptions = {
                type,
                trend: cloneTrendData
            };

            switch (trendData.type) {
                case "sort":
                    assign(watchOptions, {
                        sort: cloneTrendData.sort
                    });
                    break;
                case "array-method":
                    assign(watchOptions, {
                        args: cloneTrendData.args,
                        methodName: cloneTrendData.methodName,
                        returnValue: cloneTrendData.returnValue
                    });
                    break;
            }
            // 触发事件
            // watch处理
            emitXDataEvent(target, "watch-", [watchOptions]);
        }

        let {
            _host,
            _hostkey
        } = target;

        // 冒泡
        if (_host) {
            emitChange({
                target: _host,
                key: _hostkey,
                value: target,
                oldVal: target,
                type: "update",
                trendData: cloneTrendData
            });
        }
    }

    // 数组原型对象
    let arrayFn = Array.prototype;

    // 修改数据的函数
    const setXData = (options) => {
        // 获取参数
        let {
            xdata,
            key,
            value,
            // proxy对象
            receiver,
            // 设置数据的状态类型
            type,
            // 设置动作的唯一id
            tid,
            // 排序数据
            sort,
            // 是否已经运行过
            // isRunned,
            // 参数数组
            args,
            // 数组方法名
            methodName
        } = options;

        // 修正tid
        tid = tid || getRandomId();

        if (xdata[XDATATRENDIDS].includes(tid)) {
            return;
        }

        // 添加tid
        trendClear(xdata, tid);

        // 更新类型
        type = type || (xdata.hasOwnProperty(key) ? "update" : "new");

        // trend数据
        let trendData = {
            tid,
            type,
            keys: []
        };

        defineProperties(trendData, {
            // 新增的
            add: {
                value: []
            },
            // 移除的
            remove: {
                value: []
            }
        });

        // emitChange options
        let emitOptions = {
            target: receiver,
            key,
            type,
            trendData
        };

        // 返回的值
        let returnValue = true;

        // 根据类型更新
        switch (type) {
            case "new":
            case "update":
                // 获取旧的值
                var oldVal = xdata[key];

                // 有改动才会向下走哈
                // 数字和字符串相等也不能通行
                if (oldVal == value) {
                    return;
                }

                // 如果旧的值是对象，就要转换字符串
                if (isXData(oldVal)) {
                    if (oldVal.string === JSON.stringify(value)) {
                        return;
                    }
                }

                // 生成新的值
                let newVal = createXData(value, receiver, key);
                if (xdata._exkeys && xdata._exkeys.includes(key)) {
                    // 只修改准入值
                    xdata[key] = newVal;
                } else {
                    Reflect.set(xdata, key, newVal, receiver);
                }

                // 设置 val 和 oldVal
                trendData.val = value;
                defineProperty(trendData, "oldVal", {
                    value: oldVal
                });

                // 修正 trend 的 add 和 remove
                isXData(oldVal) && (trendData.remove.push(oldVal));
                isXData(newVal) && trendData.add.push(newVal);

                // 设置当前值和旧值
                assign(emitOptions, {
                    value: xdata[key],
                    oldVal
                });
                break;
            case "delete":
                // 获取旧的值
                var oldVal = xdata[key];

                // 修正 trend 的 remove
                isXData(oldVal) && (trendData.remove.push(oldVal));

                // 直接删除数据
                delete xdata[key];

                assign(emitOptions, {
                    oldVal
                });
                break;
            case "sort":
                // 判断没有排序过
                // 排序处理
                (!options.isRunned) && runXDataMethodNoEmit(xdata, () => {
                    // 克隆数组对象
                    let cloneArr = xdata.slice();

                    sort.forEach((e, i) => {
                        receiver[e] = cloneArr[i];
                    });
                });

                // 数组记录
                trendData.sort = sort;
                break;
            case "array-method":
                // 数组方法运行
                runXDataMethodNoEmit(xdata, () => {
                    // fill就是全没了
                    let backupData;
                    if (methodName === "fill") {
                        backupData = receiver.slice();
                    }

                    // 获取 returnValue
                    returnValue = arrayFn[methodName].apply(receiver, args);

                    // 设置 returnValue
                    defineProperty(trendData, "returnValue", {
                        value: returnValue
                    });

                    // 根据方法不同修正 add remove
                    switch (methodName) {
                        case "splice":
                            // 添加remove
                            returnValue.forEach(e => {
                                isXData(e) && (trendData.remove.push(e));
                            });
                            // 获取数据
                            let [, , ...data] = args;
                            data.forEach(e => {
                                let tarData = receiver.seek(e._id);
                                tarData && trendData.add.push(tarData);
                            });
                            break;
                        case "pop":
                        case "shift":
                            // 添加remove
                            isXData(returnValue) && trendData.remove.push(returnValue);
                            break;
                        case "unshift":
                        case "push":
                            args.forEach(e => {
                                let tarData = receiver.seek(e._id);
                                tarData && trendData.add.push(tarData);
                            });
                            break;
                        case "fill":
                            // 全都删了，只能提前记录
                            backupData.forEach(e => {
                                isXData(e) && (trendData.remove.push(e));
                            });
                            receiver.forEach(e => {
                                isXData(e) && (trendData.add.push(e));
                            });
                            break;
                    }
                });
                assign(trendData, {
                    args,
                    methodName
                });
                break;
        }

        // 触发事件
        emitChange(emitOptions);

        return returnValue;
    }

    // handler
    const XDataHandler = {
        set(xdata, key, value, receiver) {
            if (!/^_.+/.test(key)) {
                // 设置数据
                setXData({
                    xdata,
                    key,
                    value,
                    receiver
                });
                return true;
            }
            return Reflect.set(xdata, key, value, receiver);
        },
        deleteProperty(xdata, key) {
            if (!/^_.+/.test(key)) {
                // 删除数据
                setXData({
                    xdata,
                    key,
                    receiver: xdata,
                    type: "delete"
                });
                return true;
            }
            return Reflect.deleteProperty(xdata, key);
        }
    };

    // class
    function XData(obj, host, key) {
        defineProperties(this, {
            // 唯一id
            _id: {
                value: getRandomId()
                // value: obj._id || getRandomId()
            },
            // 事件寄宿对象
            [XDATAEVENTS]: {
                value: {}
            },
            // entrend id 记录
            [XDATATRENDIDS]: {
                value: []
            },
            // 数据绑定记录
            [XDATASYNCS]: {
                value: []
            },
            // 获取xdata源对象
            [GETXDATA]: {
                get: () => this
            },
            // listen 记录
            [LISTEN]: {
                value: []
            },
            // 是否开启trend清洁
            _trendClear: {
                writable: true,
                value: 0
            }
        });

        // 设置obj的id
        if (!obj.hasOwnProperty("_id")) {
            defineProperty(obj, '_id', {
                value: this._id
            });
        }

        // 判断是否有host
        if (host) {
            defineProperties(this, {
                // 父层对象
                _host: {
                    writable: true,
                    value: host
                },
                _hostkey: {
                    writable: true,
                    value: key
                }
            });
        }

        // 获取关键key数组
        let keys = Object.keys(obj);
        if (getType(obj) === "array") {
            !keys.includes('length') && keys.push('length');
        }

        let proxyThis = new Proxy(this, XDataHandler);

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
                // 设置属性
                this[k] = createXData(value, proxyThis, k);
            }
        });

        return proxyThis;
    }

    // xdata的原型
    let XDataFn = Object.create(arrayFn);
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
        },
        "root": {
            get() {
                let tempHost = this._host,
                    root;
                while (tempHost) {
                    root = tempHost;
                    tempHost = tempHost._host;
                }
                return root;
            }
        },
        // 从根目录上的属性专递key
        "keylist": {
            get() {
                let tar = this;
                let reArr = [];
                while (tar._host) {
                    reArr.unshift(tar._hostkey);
                    tar = tar._host;
                }
                return reArr;
            }
        }
    });

    // 原型链上的方法
    let XDataProto = {
        // trend入口修改内部数据的方法
        entrend(trendData) {
            // 解析出最终要修改的对象
            let {
                target,
                key,
                value,
                sort,
                args,
                methodName
            } = detrend(this, trendData);

            // 设置数据的选项
            let setXDataOptions = {
                xdata: target[GETXDATA],
                receiver: target,
                type: trendData.type,
                tid: trendData.tid
            };

            switch (trendData.type) {
                case "new":
                case "update":
                case "delete":
                    // 普通的更新数据
                    assign(setXDataOptions, {
                        key,
                        value: trendData.val
                    });
                    break;
                case "sort":
                    // value才是真正的target
                    // 进行顺序设置
                    assign(setXDataOptions, {
                        // 顺序数据
                        sort
                    });
                    break;
                case "array-method":
                    // value才是真正的target
                    // 数组方法型的更新
                    assign(setXDataOptions, {
                        // 数组方法名
                        methodName,
                        // 运行数组方法参数数组
                        args
                    });
            }

            // 更新
            setXData(setXDataOptions);

        },
        // 解析trend数据
        detrend(trendData) {
            return detrend(this, trendData);
        },
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
            if (!expr) {
                return;
            }
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
        // listen(expr, callback, reduceTime = 10) {
        listen(prop, expr, callback, reduceTime = 10) {
            // 主体watch监听函数
            let watchFunc;

            // 修正参数
            let propType = getType(prop);
            if (propType.search('function') > -1) {
                // 函数
                callback = prop;
                prop = null;
                expr = null;
            } else if (propType === "string" || propType == "number") {
                // 判断是expr还是prop
                if (/\[.+\]/.test(prop)) {
                    callback = expr;
                    expr = prop;
                    prop = null;
                } else {
                    // prop就位
                    let exprType = getType(expr);
                    if (exprType.search('function') > -1) {
                        callback = expr;
                        expr = null;
                    }
                }
            }

            let timer;

            // 判断是否有expr，存在的话先记录一次id
            let backupData;
            // 新增和删除的
            let addArr = [],
                removeArr = [];
            if (expr) {
                if (prop) {
                    let tar = this[prop];
                    isXData(tar) && (backupData = JSON.stringify(tar.seek(expr).map(e => e._id)));
                } else {
                    backupData = JSON.stringify(this.seek(expr).map(e => e._id));
                }
            }

            // 主体监听函数
            this.watch(watchFunc = (e) => {
                if (expr) {
                    let tempData, tempId;

                    // prop存在且不等的情况，就不跑了
                    if (prop) {
                        // 重新获取 tar[prop]
                        let tar = this[prop];
                        // 不是相应key就返回
                        if (prop != e.trend.keys[0] || !isXData(tar)) {
                            return;
                        }

                        // 查找数据
                        tempData = tar.seek(expr);
                        tempId = tempData.map(e => e._id);

                    } else {
                        tempData = this.seek(expr);
                        tempId = tempData.map(e => e._id);
                    }

                    let b_data = JSON.stringify(tempId);
                    if (b_data !== backupData) {
                        clearTimeout(timer);
                        timer = setTimeout(() => {
                            callback(tempData);
                        }, reduceTime);
                        backupData = b_data;
                    }
                } else {
                    // prop存在且不等的情况，就不跑了
                    if (prop && prop != e.trend.keys[0]) {
                        return;
                    }

                    // 清除计时器
                    clearTimeout(timer);

                    // 新家新增和删除列表
                    addArr.push(...e.trend.add);
                    removeArr.push(...e.trend.remove);

                    // 设置计时器
                    timer = setTimeout(() => {
                        callback({
                            // 新增的
                            add: addArr,
                            // 删除的
                            remove: removeArr
                        });

                        // 数组清空
                        addArr = [];
                        removeArr = [];
                    }, reduceTime);
                }
            });

            this[LISTEN].push({
                // prop,
                // expr,
                callback,
                watchFunc
            });
            return this;
        },
        // 取消监听数据变动
        unlisten(callback) {
            let index;
            this[LISTEN].forEach((o, i) => {
                if (o.callback === callback) {
                    let {
                        watchFunc
                    } = o;
                    index = i;
                    this.unwatch(watchFunc);
                }
            });
            this[LISTEN].splice(index, 1);
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
                if (!/\D/.test(keyName)) {
                    // 删除数组内相应index的数据
                    let reData = this.splice(keyName, 1)[0];

                    if (isXData(reData)) {
                        reData._host = null;
                        clearXData(reData);
                    }
                } else {
                    let tar = this[keyName];
                    delete this[keyName];

                    if (isXData(tar)) {
                        clearXData(tar);
                    }
                }
            } else {
                if (this._host) {
                    this._host.clear(this._hostkey);
                } else {
                    // 没有父层，就清除自己的所有绑定数据
                    clearXData(this);
                }
            }
        },
        // 重置数据
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
        },
        // 克隆对象，为了更好理解，还是做成方法获取
        clone() {
            return createXData(this.object);
        },
        // 排序方法
        // 需要特别处理，因为参数可能是函数
        // 函数会有变数，不能带函数作为参数，故直接传送排序后的顺序
        sort(...args) {
            // 记录id顺序
            let ids = this.map(e => e._id);
            let xdata = this[GETXDATA];

            // 执行默认方法
            let reValue;
            runXDataMethodNoEmit(xdata, () => {
                reValue = arrayFn.sort.apply(this, args);
            });

            // 记录新顺序
            let new_ids = this.map(e => e._id);

            // 记录顺序置换
            let sort = [];
            ids.forEach((e, index) => {
                let newIndex = new_ids.indexOf(e);
                sort[index] = newIndex;
            });

            // 进行顺序设置
            setXData({
                xdata: xdata,
                receiver: this,
                type: "sort",
                // 顺序数据
                sort,
                // 已经排序过
                isRunned: 1
            });

            return reValue;
        },
        // 禁用copyWithin，这个方法会破坏XData结构
        copyWithin() {
            throw "can't use copyWithin";
        }
    };

    // 设置 XDataFn
    Object.keys(XDataProto).forEach(k => {
        defineProperty(XDataFn, k, {
            value: XDataProto[k]
        });
    });

    ['splice', 'shift', 'unshfit', 'push', 'pop', 'fill', 'reverse'].forEach(methodName => {
        // 重构数组方法
        XDataFn[methodName] && defineProperty(XDataFn, methodName, {
            value(...args) {
                // 数组方法
                return setXData({
                    xdata: this[GETXDATA],
                    receiver: this,
                    type: "array-method",
                    methodName,
                    args
                });
            }
        });
    });

    // 原型链衔接
    XData.prototype = XDataFn;

    // main 
    const createXData = (obj, host, key) => {
        if (isXData(obj)) {
            obj._host = host;
            obj._hostkey = key;
            return obj;
        }
        switch (getType(obj)) {
            case "array":
            case "object":
                return new XData(obj, host, key);
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
            // render tag 映射
            // renderMap:{},
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
                0 in e.childNodes && (_$(e).before(e.childNodes).remove());
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