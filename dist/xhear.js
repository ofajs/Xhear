((glo) => {
    "use strict";
    // base
    // 基础tag记录器
    let tagDatabase = {};

    glo.tagDatabase = tagDatabase;

    const assign = Object.assign;
    const create = Object.create;
    const defineProperty = Object.defineProperty;
    const emptyFun = () => {};

    // function
    let isUndefined = val => val === undefined;
    let isRealValue = val => val !== undefined && val !== null;
    const hasAttr = (e, attrName) => {
        if (!e.getAttribute) {
            return 0;
        }
        let attr = e.getAttribute(attrName);
        if (attr !== null && attr !== undefined) {
            return 1;
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
    const SWATCHORI = RANDOMID + "_watchs_ori";
    const SVKEY = "_svkey" + RANDOMID;
    const ATTACHED_KEY = "_u_attached";
    const SHADOW_DESCRIPT_CANNOTUSE = 'shadow element can\'t use ';

    // observe数组key
    const OBSERVERKEYS = RANDOMID + "OBSERVER";

    // start
    // 获取旧的主体
    let _$ = glo.$;

    // 主体原型链
    let $fn = _$.fn;

    let shearInitPrototype = create($fn);

    // 生成专用shear对象
    const createShearObject = (ele) => {
        let obj = ele._svData;
        let e = create(obj);
        e.push(ele);
        return e;
    }

    // 生成普通继承的$实例
    const inCreate$ = (() => {
        if ($fn.splice) {
            return arr => {
                let reObj = create(shearInitPrototype);
                reObj.splice(-1, 0, ...arr);
                if (arr.prevObject) {
                    reObj.prevObject = arr.prevObject;
                }
                return reObj;
            };
        } else {
            return arr => {
                let reObj = create(shearInitPrototype);
                for (let len = arr.length, i = 0; i < len; i++) {
                    reObj.push(arr[i]);
                }
                if (arr.prevObject) {
                    reObj.prevObject = arr.prevObject;
                }
                return reObj;
            }
        }
    })();

    // 通用实例生成方法
    const createShear$ = arr => {
        if (arr.length == 1 && arr[0]._svData) {
            return createShearObject(arr[0]);
        }
        return inCreate$(arr);
    }

    // 渲染所有的sv-ele元素
    const renderAllSvEle = (jq_obj) => {
        // 自己是不是sv-ele
        jq_obj.each((i, e) => {
            if (hasAttr(e, 'sv-ele')) {
                renderEle(e);
            }
        });

        // 查找有没有 sv-ele
        _$('[sv-ele]', Array.from(jq_obj)).each((i, e) => {
            renderEle(e);
        });
    }

    // 去除所有sv-shadow元素
    const filterShadow = ($eles, exShadowId) => {
        // 去除 shadow 元素
        let hasShadow = 0,
            newArr = [],
            {
                prevObject
            } = $eles;

        if (exShadowId) {
            $eles.each((i, e) => {
                if (hasAttr(e, 'sv-shadow') && e.getAttribute('sv-shadow') == exShadowId) {
                    newArr.push(e);
                    hasShadow = 1;
                }
            });
        } else {
            $eles.each((i, e) => {
                if (hasAttr(e, 'sv-shadow')) {
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

    // 获取标签数据
    const getTagData = (ele) => {
        let tagname = ele.tagName.toLowerCase();
        return tagDatabase[tagname];
    }

    // Shear class function
    // 获取watch数组的方法
    const getWatchObj = (d, k, wname = SWATCH) => d[wname] && (d[wname][k] || (d[wname][k] = []));

    // 内部用的watch方法
    const oriWatch = (d, k, func) => {
        let tars = getWatchObj(d, k, SWATCHORI);
        tars.push(func);
    };

    // 触发修改事件
    // param sObj {object} 主体元素的 svData
    // param key {string} 要改动的值名
    // param val {all} 通过正常getter后的改动的值
    // param oldVal {all} 没变动前的值
    // param oriVal {all} 没用通过getter的设置值
    const emitChange = (sObj, key, val, oldVal, oriVal) => {
        // 触发修改函数
        let tars = getWatchObj(sObj, key);
        each(tars, e => {
            e(val, oldVal, oriVal);
        });

        let tars2 = getWatchObj(sObj, key, SWATCHORI);
        if (tars2) {
            each(tars2, e => {
                e(val, oldVal, oriVal);
            });
        }

        let obsArr = sObj[OBSERVERKEYS];
        if (obsArr) {
            each(obsArr, fun => fun({
                name: key,
                type: "update",
                oldVal,
                val,
                oriVal
            }));
        }
    }

    // Shear class 的原型对象
    let ShearFn = assign(create(shearInitPrototype), {
        // 设置数据变化
        set(key, val) {
            if (getType(key) == "object") {
                if (!val) {
                    for (let i in key) {
                        this.set(i, key[i]);
                    }
                }
                return;
            }
            let _this = this;
            if (0 in _this && _this[0]._svData) {
                _this = _this[0]._svData;
            }
            if (key in _this) {
                console.warn('the value exists => ', key);
                return;
            }

            // 值寄存点
            let originValue;

            defineProperty(_this, key, {
                enumerable: true,
                get() {
                    return originValue;
                },
                set(val) {
                    let oldVal = originValue;

                    // 改变值
                    originValue = val;

                    // 触发修改函数
                    emitChange(_this, key, val, oldVal, val);

                    return val;
                }
            });

            // 设置
            _this[key] = val;
        },
        // 监听数值变化
        watch(k, func) {
            if (getType(k) == "string") {
                let tars = getWatchObj(this, k);
                tars.push(func);
            } else {
                for (let i in k) {
                    this.watch(i, k[i]);
                }
            }
        },
        // 取消监听数值变化
        unwatch(k, func) {
            if (k) {
                let tars = getWatchObj(this, k);
                if (func) {
                    // 查找到函数就去掉
                    let id = tars.indexOf(func);
                    tars.splice(id, 1);
                } else {
                    tars.length = 0;
                }
            }
        },
        // 查找所有元素（包含影子元素）
        findReal(...args) {
            return createShear$($fn.find.apply(this, args));
        },
        // 只查找自己的影子元素
        findShadow(...args) {
            let reObj = $fn.find.apply(this, args);
            reObj = filterShadow(reObj, this.attr('sv-render'));
            return createShear$(reObj);
        },
        svRender: !0
    });

    // 设置数据
const setRData = (data, k, innerShearObject) => {
    switch (k) {
        case "val":
            innerShearObject.val(data);
            break;
        default:
            innerShearObject[k] = data;
    }
}

// 获取 defineObject 的 参数对象
// param computedObj getter setter 对象
// param key 绑定属性名
// param innerShearObject 内部用 shear元素对象
// param shearProtoObj shear元素对象的一级原型对象
const getDefineOptions = (computedObj, key, innerShearObject, shearProtoObj) => {
    let computedObjType = getType(computedObj);

    // 专门方法
    let getFunc = () => undefined,
        setFunc;

    if (computedObjType == "function") {
        getFunc = computedObj;
    } else {
        getFunc = computedObj.get;
        setFunc = computedObj.set;
    }

    let dObj = {
        enumerable: true,
        get: () => getFunc.call(innerShearObject)
    };
    setFunc && (dObj.set = d => {
        // 获取之前的值
        let oldVal = (key == "val") ? innerShearObject.val() : innerShearObject[key];

        // 获取当前值
        let reObj = setFunc.call(innerShearObject, d);

        let val = d;

        // 重新get获取数据
        if (getFunc && key !== "val") {
            val = shearProtoObj[key];
        }

        // 触发修改函数
        emitChange(shearProtoObj, key, val, oldVal, d);

        return reObj;
    });

    return dObj;
}

// 元素自定义组件id
let rid = 100;

// 渲染 sv元素
const renderEle = (ele) => {
    // 判断是否属于sv-ele元素
    if (hasAttr(ele, 'sv-ele')) {
        // 获取 tag data
        let tagdata = getTagData(ele);

        if (!tagdata) {
            console.warn('this element is not defined', ele);
            return;
        }

        // 主体元素
        let $ele = _$(ele);

        // 获取子元素
        let childs = Array.from(ele.childNodes);

        // 填充模板元素
        ele.innerHTML = tagdata.code;

        // 生成renderId
        let renderId = ++rid;

        // 设置渲染id
        $ele.removeAttr('sv-ele').attr('sv-render', renderId);
        $ele.find(`*`).attr('sv-shadow', renderId);

        // 渲染依赖sv-ele
        _$(`[sv-ele][sv-shadow="${renderId}"]`, ele).each((i, e) => {
            renderEle(e);
        });

        // 生成元素
        let shearProtoObj = new tagdata.Shear();

        //挂载数据
        ele._svData = shearProtoObj;

        // 先转换 sv-span 元素
        _$(`sv-span[sv-shadow="${renderId}"]`, ele).each((i, e) => {
            // 替换sv-span
            var textnode = document.createTextNode("");
            e.parentNode.insertBefore(textnode, e);
            e.parentNode.removeChild(e);

            // 文本数据绑定
            var svkey = e.getAttribute(SVKEY);
            oriWatch(shearProtoObj, svkey, (val) => {
                textnode.textContent = val;
            });
        });

        // 写入 $content
        let $content = _$(`[sv-content][sv-shadow="${renderId}"]`, ele);
        delete $content.prevObject;
        if ($content[0]) {
            defineProperty(shearProtoObj, '$content', {
                enumerable: true,
                get() {
                    return createShear$($content);
                }
            });
            // 把东西还原回content
            $content.append(childs);

            // 设置父节点
            $content.prop('svParent', ele);

            // 判断是否监听子节点变动
            if (tagdata.childChange) {
                let observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        let {
                            addedNodes,
                            removedNodes
                        } = mutation;
                        let obsEvent = {};
                        (0 in addedNodes) && (obsEvent.addedNodes = Array.from(addedNodes));
                        (0 in removedNodes) && (obsEvent.removedNodes = Array.from(removedNodes));
                        tagdata.childChange(createShearObject(ele), obsEvent);
                    });
                });

                // 监听节点
                observer.observe($content[0], {
                    attributes: false,
                    childList: true,
                    characterData: false,
                    subtree: false,
                });

                // 设置监听属性
                shearProtoObj.__obs = observer;
            }
        }

        // 写入其他定义节点
        _$(`[sv-tar][sv-shadow="${renderId}"]`, ele).each((i, e) => {
            let eName = _$(e).attr('sv-tar');
            defineProperty(shearProtoObj, '$' + eName, {
                enumerable: true,
                get() {
                    return createShear$([e]);
                }
            });
        });

        // 私有属性
        let innerShearObject = createShearObject(ele);
        let priObj = tagdata.pri;
        if (priObj) {
            for (let k in priObj) {
                innerShearObject["_" + k] = priObj[k];
            }
        }

        // 等下需要设置的data
        let rData = {};

        // 基础数据
        assign(rData, tagdata.data);

        // attrs 上的数据
        tagdata.attrs.forEach(kName => {
            // 获取属性值并设置
            let attrVal = $ele.attr(kName);
            if (isRealValue(attrVal)) {
                rData[kName] = attrVal;
            }

            // 绑定值
            oriWatch(shearProtoObj, kName, (value) => {
                $ele.attr(kName, value);
            });
        });

        // props 上的数据
        tagdata.props.forEach(kName => {
            let attrVal = $ele.attr(kName);
            isRealValue(attrVal) && (rData[kName] = attrVal);
        });

        // 绑定sv-module
        _$(`[sv-module][sv-shadow="${renderId}"]`, ele).each((i, tar) => {
            let $tar = _$(tar);
            let kName = $tar.attr('sv-module');

            // 绑定值
            oriWatch(shearProtoObj, kName, (val) => {
                tar.value = val;
            });

            // 监听改动
            // if (tar._svData) {
            //     $.init(tar).watch('val', (d) => {
            //         (kName == "val") ? $ele.val(d): (shearProtoObj[kName] = d);
            //     });
            // } else {
                $tar.on('change', (e) => {
                    (kName == "val") ? $ele.val(tar.value): (shearProtoObj[kName] = tar.value);
                });
            // }

            if (tar.tagName.toLowerCase() == 'select') {
                rData[kName] = tar.value;
            }

        });

        let valInfoData = tagdata.val;

        // 若有val，补充 get set
        if (0 in _$(`[sv-module="val"][sv-shadow="${renderId}"]`, ele) && !valInfoData) {
            let tempVal = "";
            valInfoData = {
                get: () => tempVal,
                set: val => tempVal = val
            };
        }

        // 判断是否有value值绑定
        if (valInfoData) {
            let defineOptions = getDefineOptions(valInfoData, 'val', innerShearObject, shearProtoObj);
            defineProperty(ele, 'value', defineOptions);
        }

        // 禁止val事件向上冒泡
        $ele.on('change input', e => {
            if (e.target !== ele) {
                e.stopImmediatePropagation();
            }
        });

        let computed = assign({}, tagdata.computed);
        let computedKey = Object.keys(computed);

        // 设置rData其他的 computed
        for (let k in rData) {
            if (!computed[k] && k !== "val") {
                let data;
                computed[k] = {
                    get() {
                        return data;
                    },
                    set(val) {
                        data = val;
                    }
                };
            }
        }

        // 设置computed
        for (let key in computed) {
            // 定义方法
            let defineOptions = getDefineOptions(computed[key], key, innerShearObject, shearProtoObj);

            defineProperty(shearProtoObj, key, defineOptions);
        }

        // 渲染完成方法
        tagdata.render && tagdata.render(innerShearObject, rData);

        // 设置值
        for (let k in rData) {
            if (computedKey.indexOf(k) > -1) {
                continue;
            }
            setRData(rData[k], k, innerShearObject);
        }
        each(computedKey, k => {
            let data = rData[k];
            isRealValue(data) && setRData(data, k, innerShearObject);
        });

        // 初始化完成
        tagdata.inited && tagdata.inited(innerShearObject);

        // 如果是在document上，直接触发 attached 事件
        if (ele.getRootNode() === document && tagdata.attached && !ele[ATTACHED_KEY]) {
            tagdata.attached(innerShearObject);
            ele[ATTACHED_KEY] = 1;
        }
    }
}

    const register = (options) => {
        let defaults = {
            // 注册的元素名
            tag: "",
            // 注册元素的内容
            temp: "<div sv-content></div>",
            // 动态绑定 attribute 的数据属性名
            attrs: [],
            // 初始获取 attribute 填充数据的属性名
            // 跟 attrs 不同，是一次性获取，模拟原生dom的方式
            props: [],
            // 绑定 value 的属性名（直接绑定value）
            // val: {
            //     get() {},
            //     set() {}
            // },
            // 自带数据
            data: {},
            // 混合到实例中的值
            // computed: {},
            // 原型链上的数据
            proto: {},
            // 私有数据对象，外部实例化是拿不到的
            pri: {},
            // 渲染完节点触发的时间（数据还没绑定）
            // render(){},
            // 直接监听属性变动对象
            // watch: {},
            // 初始化完成后触发的事件
            // inited: emptyFun,
            // 添加进document执行的callback
            // attached: emptyFun,
            // 删除后执行的callback
            // detached: emptyFun,
            // 子节点被修改后出发的callback
            // sv-content内的一代元素的删除或添加
            // childChange: emptyFun,
        };
        // 合并选项
        assign(defaults, options);

        defaults.props.push('val');

        // 专属class
        function Shear(sdata = {}) {
            // 外部用的watch
            defineProperty(this, SWATCH, {
                value: {}
            });
            // 内部用的watch
            defineProperty(this, SWATCHORI, {
                value: {}
            });
        }
        Shear.prototype = assign(create(ShearFn), defaults.proto);

        // 转换 {{}} 数据span
        let code = defaults.temp;

        // 去除无用的代码（注释代码）
        code = code.replace(/<!--.+?-->/g, "");

        //准换自定义字符串数据
        var textDataArr = code.match(/{{.+?}}/g);
        textDataArr && textDataArr.forEach((e) => {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                code = code.replace(e, `<sv-span ${SVKEY}="${key[1].trim()}"></sv-span>`);
            }
        });

        // 全部添加shadow
        // let code_ele = _$(`<div>${code}</div>`);
        // code_ele.find('*').attr('sv-shadow', "t");
        // code = code_ele.html();

        // 添加进数据库
        tagDatabase[defaults.tag] = assign({
            // 专属class
            Shear,
            code
        }, defaults);

        // 渲染当前tag
        _$(defaults.tag + '[sv-ele]').each((i, e) => {
            renderEle(e);
        });
    }

    // main
    const xhear = {
        register
    };

    // init
    glo.xhear = xhear;

    // 替换旧的主体 
    glo.$ = function (...args) {
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
                arg2_svShadow = arg2.getAttribute('sv-shadow');
            } else if (arg2.attr) {
                arg2_svShadow = arg2.attr('sv-shadow');
            }
        }
        if (arg2_svShadow) {
            reObj = filterShadow(reObj, arg2_svShadow);
        } else {
            reObj = filterShadow(reObj);
        }

        reObj = createShear$(reObj);

        return reObj;
    };
    assign($, _$);
    assign($, {
        init: ele => createShear$([ele])

    });
    $.prototype = $.fn = $fn;

    // 覆盖还原 sv-ele 数据
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

// 还原克隆sv-ele元素成html模式
// 用的都是$fn.find
const reduceCloneSvEle = (elem) => {
    let renderId = elem.attr('sv-render');

    if (renderId) {
        // 清除所有非 sv-content 的 sv-shadow 元素
        elem.find(`[sv-shadow="${renderId}"]:not([sv-content])`).remove();

        // 将剩余的 sv-content 还原回上一级去
        elem.find(`[sv-shadow="${renderId}"][sv-content]`).each((i, e) => {
            // 获取子元素数组
            _$(e).before(e.childNodes).remove();
        });
    }

    // 判断是否有子sv-ele元素，并还原
    let childsSvEle = elem.find('[sv-render]');
    childsSvEle.each((i, e) => {
        reduceCloneSvEle(_$(e));
    });
};

// 修正content的sv-shadow属性
const fixShadowContent = (_this, content) => {
    // 获取content类型
    let contentType = getType(content);

    // 如果自己是影子元素
    if (_this.is('[sv-shadow]')) {
        // 获取shadowId
        let svid = _this.attr('sv-shadow');
        if ((contentType == "string" && content.search('<') > -1)) {
            let contentEle = _$(content)
            contentEle.attr('sv-shadow', svid);
            contentEle.find('*').attr('sv-shadow', svid);
            content = "";
            each(contentEle, (e) => {
                content += e.outerHTML;
            });
        } else
        if (contentType instanceof Element) {
            _$(content).attr('sv-shadow', svid);
        } else if (content instanceof $) {
            _$(Array.from(content)).attr('sv-shadow', svid);
        }
    }
    return content;
}

// 筛选出自身对象
const fixSelfToContent = (_this) => {
    if (_this.is('[sv-render]')) {
        _this = _this.map((i, e) => {
            let re = e;
            let {
                _svData
            } = e;
            while (_svData && _svData.$content) {
                re = _svData.$content[0];
                _svData = re._svData;
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
        if (obj instanceof glo.$ && obj.is('sv-shadow')) {
            throw SHADOW_DESCRIPT_CANNOTUSE + 'add';
        }
        return $fn.add.apply(this, args);
    },
    attr(...args) {
        let [aName, aValue] = args;
        if (aValue && this.is('[sv-render]')) {
            this.each((i, e) => {
                let tagname = e.tagName.toLowerCase();
                let tagdata = tagDatabase[tagname];
                if (tagdata) {
                    // 查找attr内是否有他自己
                    if (tagdata.attrs.indexOf(aName) > -1) {
                        e._svData[aName] = aValue;
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
        if (this.is('[sv-shadow]')) {
            throw SHADOW_DESCRIPT_CANNOTUSE + 'clone';
        }
        if (this.svRender) {
            // 获取原先的html
            // shearInitPrototype.html
            let b_html = this.html();

            // 将所有 sv-render 变成 sv-ele
            let temDiv = _$(`<div>${b_html}</div>`);
            // $fn.find
            temDiv.find('[sv-render]').each((i, e) => {
                _$(e).removeAttr('sv-render').attr('sv-ele', "");
            });
            b_html = temDiv.html();

            // 生成当前元素
            let tagname = this[0].tagName.toLowerCase();

            // 生成克隆元素
            let cloneEle = this[0].cloneNode();
            _$(cloneEle).removeAttr('sv-render').attr('sv-ele', "").html(b_html);
            renderEle(cloneEle);
            let tar = createShearObject(cloneEle);

            // 还原数据
            matchCloneData(tar, this);

            // 判断content是否还有sv-ele，渲染内部
            let bRenderEles = _$('[sv-render]:not([sv-shadow])', this);
            if (0 in bRenderEles) {
                let aRenderEles = _$('[sv-render]:not([sv-shadow])', tar);
                // 确认数量匹配
                if (aRenderEles.length == bRenderEles.length) {
                    aRenderEles.each((i, e) => {
                        // 获取对方
                        let referEle = bRenderEles[i];

                        // 确认tag匹配
                        if (referEle.tagName !== e.tagName) {
                            console.warn('cloned sv-ele data does not match');
                            return false;
                        }

                        // 通过匹配
                        matchCloneData(createShearObject(e), createShearObject(referEle));
                    });
                }
            }

            return tar;
        } else {
            let isSvRender = this.is('[sv-render]');
            let hasSvRender = 0 in this.find('[sv-render]');
            if (isSvRender || hasSvRender) {
                // 抽出来
                let tar = _$(Array.from(this));

                // 直接克隆一份
                let cloneEle = tar.clone(...args);

                // 还原克隆元素内的svele
                reduceCloneSvEle(cloneEle);

                // 重新渲染克隆元素
                cloneEle.find('[sv-render]').removeAttr('sv-render').attr('sv-ele', "");
                renderAllSvEle(cloneEle);

                tar.each((i, e) => {
                    if (hasAttr(e, 'sv-render')) {
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
                cloneFun('[sv-render]:not([sv-shadow])');
                cloneFun('[sv-render][sv-shadow]');

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
        if (pNode.is('[sv-content]')) {
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
        if (this.is('[sv-shadow]')) {
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
        if (this.is('[sv-shadow]')) {
            throw SHADOW_DESCRIPT_CANNOTUSE + kName;
        }

        let $con = _$(content);

        if ($con.is('[sv-shadow]')) {
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

        let svData = (reObj.length == 1) && reObj[0]._svData;

        if (svData) {
            reObj = createShearObject(reObj[0]);
        } else {
            if (this.is('[sv-shadow]')) {
                reObj = filterShadow(reObj, this.attr('sv-shadow'));
            } else {
                // 如果前一级不是sv-shaodw，就去除查找后的带sv-shadow
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
        // let tar = reObj[0];
        // if (reObj.length === 1 && tar._svData) {
        //     reObj = createShearObject(tar);
        // }
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
            if (0 in elem.find('[sv-shadow]')) {
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

    const bridge = $.bridge = (...args) => {
    // 之前的值得
    let beforeOriVal;

    each(args, (options, i) => {
        let {
            tar,
            key
        } = options;

        if (options instanceof $) {
            tar = options;
            key = 'val';
        }

        tar.watch(key, (val, beforeVal, oriVal) => {
            if (beforeOriVal === oriVal) {
                return;
            }
            beforeOriVal = oriVal;
            each(args, opt => {
                let tar2, key2;

                if (opt instanceof $) {
                    tar2 = opt;
                    key2 = "val"
                } else {
                    tar2 = opt.tar;
                    key2 = opt.key;
                }


                if (tar !== tar2) {
                    if (key2 === "val") {
                        tar2.val(oriVal);
                    } else {
                        tar2[key2] = oriVal;
                    }
                }
            });
            beforeOriVal = undefined;
        });

        if (i == args.length - 1) {
            if (key === "val") {
                tar.val(tar.val());
            } else {
                tar[key] = tar[key];
            }
        }
    });
}

let XData = $.XData = function (obj) {
    defineProperty(this, SWATCH, {
        value: {}
    });
    defineProperty(this, OBSERVERKEYS, {
        value: []
    });
    obj && this.set(obj);
}

Object.defineProperties(XData.prototype, {
    watch: {
        value: ShearFn.watch
    },
    unwatch: {
        value: ShearFn.unwatch
    },
    set: {
        value: ShearFn.set
    },
    cover: {
        value(obj) {
            for (let k in obj) {
                this[k] = obj[k];
            }
            return this;
        }
    },
    // 观察
    observe: {
        value(callback) {
            callback && this[OBSERVERKEYS].push(callback);
            return this;
        }
    },
    // 取消观察
    unobserve: {
        value(callback) {
            if (callback) {
                let arr = this[OBSERVERKEYS];
                let id = arr.indexOf(callback);
                if (id > -1) {
                    arr.splice(id, 1);
                }
            }
            return this;
        }
    },
    // 同步数据
    syncData: {
        value(dataObj, options) {
            switch (getType(options)) {
                case "string":
                    bridge({
                        tar: this,
                        key: options
                    }, {
                        tar: dataObj,
                        key: options
                    });
                    break;
                case "array":
                    each(options, k => {
                        bridge({
                            tar: this,
                            key: k
                        }, {
                            tar: dataObj,
                            key: k
                        });
                    });
                    break;
                case "object":
                    for (let k in options) {
                        bridge({
                            tar: this,
                            key: k
                        }, {
                            tar: dataObj,
                            key: options[k]
                        });
                    }
                    break;
                default:
                    for (let k in this) {
                        if (k in dataObj) {
                            bridge({
                                tar: this,
                                key: k
                            }, {
                                tar: dataObj,
                                key: k
                            });
                        }
                    }
            }
            return this;
        }
    },
    // 中转型绑定数据
    transData: {
        value(myKey, dataObj, dataObjKey, props) {
            // 两个值
            let beforeGetVal, beforeSetVal;

            let {
                beforeGet,
                beforeSet
            } = props;

            let _beforeGet, _beforeSet;

            if (beforeGet || beforeSet) {
                _beforeGet = (val) => beforeGet(val);
                _beforeSet = (val) => beforeSet(val);
            } else if (getType(props) === "object") {
                // 反向props
                let reverseProps = {};
                for (let k in props) {
                    reverseProps[props[k]] = k;
                }
                _beforeGet = (val) => props[val];
                _beforeSet = (val) => reverseProps[val];
            } else {
                return;
            }

            // 转换get
            this.watch(myKey, (val, oldVal, oriVal) => {
                if (oriVal == beforeSetVal) {
                    return;
                }
                beforeGetVal = _beforeGet(val);
                if (dataObj instanceof $ && dataObjKey == "val") {
                    dataObj.val(beforeGetVal);
                } else {
                    dataObj[dataObjKey] = beforeGetVal;
                }
                beforeGetVal = undefined;
            });

            // 转换set
            dataObj.watch(dataObjKey, (val, oldVal, oriVal) => {
                if (oriVal === beforeGetVal) {
                    return;
                }
                beforeSetVal = _beforeSet(val);
                this[myKey] = beforeSetVal;
                beforeSetVal = undefined;
            });

            return this;
        }
    }
});

    // ready
    // 页面进入之后，进行一次渲染操作
    _$(() => {
        // 初始渲染一次
        _$('[sv-ele]').each((i, e) => {
            renderEle(e);
        });

        const attachedFun = (ele) => {
            if (ele[ATTACHED_KEY]) {
                return;
            }
            let tagdata = getTagData(ele);
            tagdata.attached && tagdata.attached(createShearObject(ele));
            ele[ATTACHED_KEY] = 1;
        }

        const detachedFunc = (ele) => {
            // 确认是移出 document 的元素
            if (ele.getRootNode() != document) {
                let tagdata = getTagData(ele);
                tagdata.detached && tagdata.detached(createShearObject(ele));

                // 防止内存不回收
                // 清除svParent
                _$('[sv-content]', ele).each((i, e) => {
                    delete e.svParent;
                });

                // 清空observer属性
                let {
                    _svData
                } = ele;
                if (_svData) {
                    _svData.__obs && _svData.__obs.disconnect();
                    delete _svData.__obs;
                    delete ele._svData;
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
                    each(Array.from(addedNodes), (ele) => {
                        if (ele._svData) {
                            attachedFun(ele);
                        }

                        if (ele instanceof Element) {
                            // 触发已渲染的attached
                            each(Array.from(ele.querySelectorAll('[sv-render]')), e => {
                                attachedFun(e);
                            });
                        }
                    });
                }

                // 监听去除元素
                if (removedNodes && 0 in removedNodes) {
                    each(Array.from(removedNodes), (ele) => {
                        if (ele._svData) {
                            detachedFunc(ele);
                        }

                        _$('[sv-render]', ele).each((i, e) => {
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
    });

    // 添加初始化css
    _$('head').append('<style>[sv-ele]{display:none}</style>');
})(window);