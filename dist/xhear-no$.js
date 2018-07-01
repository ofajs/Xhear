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

    let xhearObj = new regData.XHear();
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
                xhearObj.value = val;
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
    xhearObj.set(Object.keys(rData));

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

        // 寄放处
        let oriValue = value;

        // 定义函数
        defineProperty(this, key, {
            enumerable: true,
            get() {
                // get操作频繁，比重建数组的each快
                getWatchObj(this, key, SWATCHGET).forEach(callFunc => {
                    callFunc(oriValue);
                });
                return oriValue;
            },
            set(d) {
                let oldVal = oriValue;
                oriValue = d;

                // 防止重复值触发改动
                if (oldVal !== d) {
                    emitChange(this, key, d, oldVal);
                }
            }
        });

        emitChange(this, key, value, undefined, "new");

        // 设置值
        this[key] = value;
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
                throw 'error';
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

    // 原型对象
let XHearFn = Object.create(shearInitPrototype);

// 设置svRender
XHearFn.svRender = !0;

// 合并数据
assign(XHearFn, XDataFn);

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
    let XHear = function () {
        XData.call(this);
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