((glo) => {
    // COMMON
    // 随机字符串
    const RANDOMID = "_" + Math.random().toString(32).substr(2);
    const SWATCH = RANDOMID + "_watchs";
    const SWATCHORI = RANDOMID + "_watchs_ori";
    const SVKEY = "_svkey" + RANDOMID;

    // base
    // 基础tag记录器
    let tagDatabase = {};

    const assign = Object.assign;
    const create = Object.create;
    const defineProperty = Object.defineProperty;
    const emptyFun = () => {};

    // 获取watch数组的方法
    const getWatchObj = (d, k, wname = SWATCH) => {
        return d[wname][k] || (d[wname][k] = []);
    };

    // 内部用的watch方法
    const oriWatch = (d, k, func) => {
        let tars = getWatchObj(d, k, SWATCHORI);
        tars.push(func);
    };

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
                return reObj;
            };
        } else {
            return arr => {
                let reObj = create(shearInitPrototype);
                for (let len = arr.length, i = 0; i < len; i++) {
                    reObj.push(arr[i]);
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

    // Shear class 的原型对象
    let ShearFn = assign(create(shearInitPrototype), {
        // 设置数据变化
        set(key, val) {
            if (key in this) {
                console.warn('the value exists');
                return;
            }

            // 值寄存点
            let originValue;

            defineProperty(this, key, {
                enumerable: true,
                get() {
                    return originValue;
                },
                set(val) {
                    let before_val = originValue;
                    originValue = val;

                    // 触发修改函数
                    let tars = getWatchObj(this, key);
                    let tars2 = getWatchObj(this, key, SWATCHORI);
                    tars.concat(tars2).forEach((e) => {
                        e(val, before_val);
                    });
                }
            });

            // 设置
            this[key] = val;
        },
        // 监听数值变化
        watch(k, func) {
            let tars = getWatchObj(this, k);
            tars.push(func);
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
        svRender: 2
    });

    // function
    const hasAttr = (e, attrName) => {
        if (!e.getAttribute) {
            return 0;
        }
        let attr = e.getAttribute(attrName);
        if (attr !== null && attr !== undefined) {
            return 1;
        }
    };

    const each = (arr, func) => {
        arr.forEach(func);
    };

    const getTagData = (ele) => {
        let tagname = ele.tagName.toLowerCase();
        return tagDatabase[tagname];
    }

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

            let isRenderOK = 0;

            // 主体元素
            let $ele = _$(ele);

            // 获取子元素
            let childs = Array.from(ele.childNodes);

            // 填充模板元素
            ele.innerHTML = tagdata.code;

            // 生成元素
            let shearData = new tagdata.Shear();

            //挂载数据
            ele._svData = shearData;

            // 先转换 sv-span 元素
            _$('sv-span', ele).each((i, e) => {
                // 替换sv-span
                var textnode = document.createTextNode("");
                e.parentNode.insertBefore(textnode, e);
                e.parentNode.removeChild(e);

                // 文本数据绑定
                var svkey = e.getAttribute(SVKEY);
                oriWatch(shearData, svkey, (val) => {
                    textnode.textContent = val;
                });
            });

            // 写入 $content
            let $content = _$('[sv-content]', ele);
            if (0 in $content) {
                defineProperty(shearData, '$content', {
                    enumerable: true,
                    get() {
                        return _$('[sv-content]', ele);
                    }
                });
                // 把东西还原回content
                $content.append(childs);

                // 设置父节点
                $content.prop('svParent', ele);
            }

            // 写入其他定义节点
            _$('[sv-tar]', ele).each((i, e) => {
                let eName = _$(e).attr('sv-tar');
                defineProperty(shearData, '$' + eName, {
                    enumerable: true,
                    get() {
                        return _$(e);
                    }
                });
            });

            // 等下需要设置的data
            let rData = {};

            // 基础数据
            assign(rData, tagdata.data);

            // attrs 上的数据
            tagdata.attrs.forEach(kName => {
                // 获取属性值并设置
                let attrVal = $ele.attr(kName);
                rData[kName] = attrVal;

                // 绑定值
                oriWatch(shearData, kName, (val) => {
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
                oriWatch(shearData, kName, (val) => {
                    tar.value = val;
                });

                // 监听改动
                $tar.on('input', () => {
                    shearData[kName] = tar.value;
                });
            });

            // watch监听
            let watchObj = tagdata.watch;
            if (watchObj) {
                for (let kName in watchObj) {
                    // 绑定值
                    oriWatch(shearData, kName, (...args) => {
                        let fun = () => watchObj[kName].apply(createShearObject(ele), args);
                        if (isRenderOK) {
                            fun();
                        } else {
                            nextTick(fun);
                        }
                        fun = null;
                    });
                }
            }

            // 设置 rData
            for (let k in rData) {
                shearData.set(k, rData[k]);
            }

            // 判断是否有value值绑定
            let val = tagdata.val;
            if (val) {
                defineProperty(ele, "value", {
                    get() {
                        return val.get && val.get.call(createShearObject(ele));
                    },
                    set(d) {
                        return val.set && val.set.call(createShearObject(ele), d);
                    }
                });
            }

            // 判断是否监听子节点变动
            if (tagdata.childChange && $content[0]) {
                let observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        let { addedNodes, removedNodes } = mutation;
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
                shearData._obs = observer;
            }

            // 设置已经渲染
            $ele.removeAttr('sv-ele').attr('sv-render', 1);
            ele.svRender = 1;

            // 触发渲染完成后的事件
            tagdata.rendered && tagdata.rendered(createShearObject(ele));

            // 如果是在document上，直接触发 attached 事件
            if (ele.getRootNode() == document) {
                tagdata.attached && tagdata.attached(createShearObject(ele));
            }

            // 设置渲染完成
            isRenderOK = 1;
        }
    }
    const register = (options) => {
        let defaults = {
            // 注册的元素名
            tag: "",
            // 注册元素的内容
            temp: "",
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
            // 原型链上的数据
            proto: {},
            // 直接监听属性变动对象
            // watch: {},
            // 渲染后触发的事件
            // rendered: emptyFun,
            // 添加进document执行的callback
            // attached: emptyFun,
            // 删除后执行的callback
            // detached: emptyFun,
            // 子节点被修改后出发的callback
            // sv-content内的一代元素的删除或添加
            childChange: emptyFun
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
        code_ele.find('*').attr('sv-shadow', "");
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
    const shear = {
        register
    };

    // init
    glo.shear = shear;

    // 替换旧的主体 
    glo.$ = function(...args) {
        let reObj = _$(...args);

        // 自己是不是sv-ele
        reObj.each((i, e) => {
            if (hasAttr(e, 'sv-ele')) {
                renderEle(e);
            }
        });

        // 查找有没有 sv-ele
        reObj.find('[sv-ele]').each((i, e) => {
            renderEle(e);
        });

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

        // 修正其他节点操控的方法
    assign(shearInitPrototype, {
        asd() {
            console.log('asdasd');
        },
        // append() {
            
        // }
    });

    // ready
    // 页面进入之后，进行一次渲染操作
    _$(() => {
        // 初始渲染一次
        _$('[sv-ele]').each((i, e) => {
            renderEle(e);
        });

        // 对sv元素进行操作
        const svDomFunc = (ele, fName, otherFunc) => {
            let tagdata = getTagData(ele);
            tagdata[fName] && tagdata[fName](createShearObject(ele));
            otherFunc && otherFunc(ele, tagdata);
        };

        // 触发元素事件函数
        const domModifyFunc = (fName, eArr, otherFunc) => {
            if (eArr && 0 in eArr) {
                each(Array.from(eArr), (ele) => {
                    // 判断自身是否sv-ele
                    if (ele.svRender) {
                        svDomFunc(ele, fName, otherFunc);
                    }

                    // 判断子元素是否有 sv-render
                    _$('[sv-render]', ele).each((i, e) => {
                        svDomFunc(e, fName, otherFunc);
                    });
                });
            }
        };

        // attached detached 监听
        var observer = new MutationObserver((mutations) => {
            mutations.forEach((e) => {
                // 改动监听
                domModifyFunc('attached', e.addedNodes);
                domModifyFunc('detached', e.removedNodes, (ele) => {
                    // 防止内存不回收
                    // 清除svParent
                    _$('[sv-content]', ele).each((i, e) => {
                        delete e.svParent;
                    });

                    // 清空observer属性
                    let { _svData } = ele;
                    if (_svData) {
                        _svData._obs && _svData._obs.disconnect();
                        delete _svData._obs;
                        delete ele._svData;
                    }
                });
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