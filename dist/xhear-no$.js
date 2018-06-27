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


// business fucntion 

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

    // 获取tagname
    let tagname = ele.tagName.toLowerCase();

    // 从库中获取注册数据
    let regData = tagDatabase[tagname];

    // 判断是否存在注册数据
    if (!regData) {
        console.warn('no exist' + tagname, ele);
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

    // 转换 sv-span 元素
    _$(`sv-span[xv-shadow="${renderId}"]`, ele).each((i, e) => {
        // 替换sv-span
        var textnode = document.createTextNode("");
        e.parentNode.insertBefore(textnode, e);
        e.parentNode.removeChild(e);

        // 文本数据绑定
        var svkey = e.getAttribute('svkey');

        xhearObj.watch(svkey, d => {
            textnode.textContent = d;
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
        $tar.on('change input', (e) => {
            xhearObj[kName] = tar.value;
        });
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
        xhearObj.watch('value', val => {
            ele.value = val;
        });

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

        // 生成实例
        reObj = createShear$(reObj);

        return reObj;
    };
    $.prototype = $fn;
    assign($, {
        init() {

        }
    }, _$);

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

let XDataFnDefineObj = {};
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
        // 渲染完节点触发的时间（数据还没绑定）
        render() {},
        // 初始化完成后触发的事件
        inited() {},
        // 添加进document执行的callback
        attached() {},
        // 删除后执行的callback
        detached() {}
    };

    assign(defaults, options);

    let {
        proto,
        temp,
        tag
    } = defaults;

    // 生成新的数据对象
    function XHear() {
        XData.call(this);
    }

    // 原型对象
    let XHearFn = Object.create($fn);

    // 合并数据
    assign(XHearFn, XDataFn);

    // 判断是否有公用方法
    if (proto) {
        XHearFn = create(XHearFn);
        assign(XHearFn, proto);
    }

    // 赋值原型对象
    XHear.prototype = XHearFn;

    // 去除无用的代码（注释代码）
    temp = temp.replace(/<!--.+?-->/g, "");

    //准换自定义字符串数据
    var textDataArr = temp.match(/{{.+?}}/g);
    textDataArr && textDataArr.forEach((e) => {
        var key = /{{(.+?)}}/.exec(e);
        if (key) {
            temp = temp.replace(e, `<sv-span svkey="${key[1].trim()}"></sv-span>`);
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

    // init
    const xhear = {
        register
    };

    glo.xhear = xhear;

    glo.$ = $;

})(window);