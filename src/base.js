((glo) => {
    "use strict";
    // base
    // 基础tag记录器
    let tagDatabase = {};

    const assign = Object.assign;
    const create = Object.create;
    const defineProperty = Object.defineProperty;
    const emptyFun = () => {};

    // function
    let isUndefined = val => val === undefined;
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

    // start
    // 获取旧的主体
    let _$ = glo.$;

    // 主体原型链
    let $fn = _$.fn;

    let shearInitPrototype = create($fn);

    // 生成普通继承的$实例
    const createShear$ = (() => {
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

    // 生成专用shear对象
    const createShearObject = (ele) => {
        let obj = ele._svData;
        let e = create(obj);
        e.push(ele);
        return e;
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
    const getWatchObj = (d, k, wname = SWATCH) => {
        return d[wname][k] || (d[wname][k] = []);
    };

    // 内部用的watch方法
    const oriWatch = (d, k, func) => {
        let tars = getWatchObj(d, k, SWATCHORI);
        tars.push(func);
    };

    // 触发修改事件
    const emitChange = (sObj, key, val) => {
        let beforeValue = sObj[key];
        // 触发修改函数
        let tars = getWatchObj(sObj, key);
        let tars2 = getWatchObj(sObj, key, SWATCHORI);
        tars.concat(tars2).forEach(e => {
            e(val, beforeValue);
        });
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
                    // 触发修改函数
                    emitChange(_this, key, val);

                    // 改变值
                    originValue = val;
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
        svRender: !0
    });

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

            // 生成元素
            let shearObject = new tagdata.Shear();

            //挂载数据
            ele._svData = shearObject;

            // 先转换 sv-span 元素
            _$('sv-span', ele).each((i, e) => {
                // 替换sv-span
                var textnode = document.createTextNode("");
                e.parentNode.insertBefore(textnode, e);
                e.parentNode.removeChild(e);

                // 文本数据绑定
                var svkey = e.getAttribute(SVKEY);
                oriWatch(shearObject, svkey, (val) => {
                    textnode.textContent = val;
                });
            });

            // 写入 $content
            let $content = _$('[sv-content]', ele);
            delete $content.prevObject;
            if ($content[0]) {
                defineProperty(shearObject, '$content', {
                    enumerable: true,
                    get() {
                        if (!$content[0]._svData) {
                            return createShear$($content);
                        } else {
                            return createShearObject($content[0]);
                        }
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
                    shearObject._obs = observer;
                }
            }

            // 写入其他定义节点
            _$('[sv-tar]', ele).each((i, e) => {
                let eName = _$(e).attr('sv-tar');
                defineProperty(shearObject, '$' + eName, {
                    enumerable: true,
                    get() {
                        if (!e._svData) {
                            return createShear$([e]);
                        } else {
                            return createShearObject(e);
                        }
                    }
                });
            });

            // 私有数据对象
            // let pri = {};
            // assign(pri, tagdata.pri);
            // let innerShearObject = createShearObject(ele);
            // innerShearObject.pri = pri;
            // let createInnerShearObject = () => innerShearObject;
            // let createInnerShearObject = () => {
            //     let obj = createShearObject(ele);
            //     obj.pri = pri;
            //     return obj;
            // }

            // 私有属性
            let innerShearObject = createShearObject(ele);
            if (tagdata.pri) {
                assign(innerShearObject, tagdata.pri);
            }

            // 等下需要设置的data
            let rData = {};

            // 基础数据
            assign(rData, tagdata.data);

            // attrs 上的数据
            tagdata.attrs.forEach(kName => {
                // 获取属性值并设置
                let attrVal = $ele.attr(kName);
                if (!isUndefined(attrVal)) {
                    rData[kName] = attrVal;
                }

                // 绑定值
                oriWatch(shearObject, kName, (val) => {
                    $ele.attr(kName, val);
                });
            });

            // props 上的数据
            tagdata.props.forEach(kName => {
                let attrVal = $ele.attr(kName);
                rData[kName] = attrVal;
            });

            // 绑定sv-module
            _$('[sv-module]', ele).each((i, tar) => {
                let $tar = _$(tar);
                let kName = $tar.attr('sv-module');

                // 绑定值
                oriWatch(shearObject, kName, (val) => {
                    tar.value = val;
                });

                // 监听改动
                $tar.on('input', () => {
                    shearObject[kName] = tar.value;
                });
            });

            // watch监听
            let needWatchObj = tagdata.watch;
            if (needWatchObj) {
                for (let kName in needWatchObj) {
                    // 绑定值
                    oriWatch(shearObject, kName, (...args) => needWatchObj[kName].apply(createInnerShearObject(), args));
                    // oriWatch(shearObject, kName, (...args) => needWatchObj[kName].apply(createInnerShearObject(), args));
                }
            }

            // 判断是否有value值绑定
            let val = tagdata.val;
            if (val) {
                let dObj = {};
                val.get && (dObj.get = () => val.get.call(createInnerShearObject()));
                val.set && (dObj.set = d => val.set.call(createInnerShearObject(), d));
                defineProperty(ele, 'value', dObj);
            }

            // 生成renderId
            let renderId = getRandomId();

            // 设置已经渲染
            $ele.removeAttr('sv-ele').attr('sv-render', renderId);
            $ele.find(`[sv-shadow="t"]`).attr('sv-shadow', renderId);

            // 渲染节点完成
            tagdata.render && tagdata.render(createInnerShearObject(), rData);

            // 设置 rData
            shearObject.set(rData);

            // 是否有自定义字段数据
            let {
                computed
            } = tagdata;
            if (computed) {
                for (let key in computed) {
                    let tar = computed[key];
                    let tarType = getType(tar);

                    // 专门方法
                    let getFunc, setFunc;

                    if (tarType == "function") {
                        getFunc = tar;
                    } else {
                        getFunc = tar.get;
                        setFunc = tar.set;
                    }
                    let dObj = {
                        enumerable: true
                    };
                    getFunc && (dObj.get = () => getFunc.call(createInnerShearObject()));
                    setFunc && (dObj.set = d => {
                        // 获取当前值
                        let val = setFunc.call(createInnerShearObject(), d);

                        if (getFunc) {
                            d = shearObject[key];
                        }

                        // 触发修改函数
                        emitChange(shearObject, key, d);

                        return val;
                    });

                    defineProperty(shearObject, key, dObj);

                    // 先触发一次渲染
                    emitChange(shearObject, key, shearObject[key]);
                }
            }

            // 初始化完成
            tagdata.inited && tagdata.inited(createInnerShearObject());

            // 如果是在document上，直接触发 attached 事件
            if (ele.getRootNode() === document && tagdata.attached && !ele[ATTACHED_KEY]) {
                tagdata.attached(createInnerShearObject())
                ele[ATTACHED_KEY] = 1;
            }

            // 渲染依赖sv-ele
            _$('[sv-ele]', ele).each((i, e) => {
                renderEle(e);
            });
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
        let code_ele = _$(`<div>${code}</div>`);
        code_ele.find('*').attr('sv-shadow', "t");
        code = code_ele.html();

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

        // 判断只有一个的情况下，返回shear对象
        let _svData = (reObj.length == 1) && (reObj[0]._svData);
        if (_svData) {
            // 初始化当前对象
            reObj = createShearObject(reObj[0])
        } else {
            reObj = createShear$(reObj);
        }

        return reObj;
    };
    assign($, _$);
    $.prototype = $.fn = $fn;

    //<!--operation-->

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
                    _svData._obs && _svData._obs.disconnect();
                    delete _svData._obs;
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
                            // 补漏没渲染的
                            each(Array.from(ele.querySelectorAll('[sv-ele]')), e => {
                                renderEle(e);
                            });

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
    _$('head').append('<style>[sv-ele]{display:none}[sv-render]{display:block}</style>');
})(window);