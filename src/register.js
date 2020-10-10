// 注册数据
const regDatabase = new Map();

const RUNARRAY = Symbol("runArray");

// 渲染结束标记
const RENDEREND = Symbol("renderend"), RENDEREND_RESOLVE = Symbol("renderend_resove"), RENDEREND_REJECT = Symbol("renderend_reject");

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
const embedWatch = ({ target, callback, expr }) => {
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
        textnode, par
    };
}

// 组件for绑定复制并绑定元素
const createForComp = (ele, e) => {
    let new_ele = ele.cloneNode(true);

    // 数据覆盖
    let p_ele = createXhearProxy(new_ele);

    e.sync(p_ele, null, true);

    // Object.keys(e).forEach(k => {
    //     if (p_ele[CANSETKEYS].has(k)) {
    //         p_ele[k] = e[k];
    //     }
    // });

    // p_ele.sync(e);

    return { new_ele };
}

// 渲染shadow dom 的内容
// syncData 即刻同步数据
const renderTemp = ({ sroot, proxyEle, syncData = false }) => {
    // 处理用寄存对象
    const processObj = new Map();
    const addProcess = (expr, func) => {
        let arr = processObj.get(expr.trim());
        if (!arr) {
            arr = [];
            processObj.set(expr, arr);
        }

        arr.push({
            change: func
        })
    }

    // 已经遍历过的元素
    let runnedForEle = new Set();

    // 对for进行渲染
    queAllToArray(sroot, "[xv-for]").forEach(e => {
        let childsFor = Array.from(e.querySelectorAll('[xv-for]'));
        if (childsFor.length) {
            // 循环内不允许在套二次循环，出现难调的垃圾代码
            throw {
                desc: "xv-for can not inside xv-for element",
                target: e,
                insideTargets: childsFor
            };
            childsFor.forEach(e2 => runnedForEle.add(e2));
        }
        if (runnedForEle.has(e)) {
            // 属于子节点的for不运行
            return;
        }

        // 拆分key和value
        let xvfor = e.getAttribute('xv-for');
        let item_expr, key_expr, target_expr;

        const ele = e.cloneNode(true);

        // 添加标识
        const forId = getRandomId();
        ele.setAttribute("for-id", forId);

        ele.removeAttribute("xv-for");

        // 定位元素
        let { textnode, par } = postionNode(e);

        let xvforSplit = xvfor.split("in");
        if (!xvforSplit) {
            throw {
                desc: "xv-for value expression error",
                value: xvfor
            };
        }

        let [beforeExpr, targetExpr] = xvforSplit;

        // 获取相应值
        target_expr = targetExpr.trim();

        item_expr = beforeExpr.trim();
        if (item_expr.includes("(")) {
            [item_expr, key_expr] = item_expr.replace(/[\(\))]/g, "").split(",");
        }

        addProcess(target_expr, (vals, trends) => {
            // 确定是重新设置值
            let isSetArr = trends.find(e => e.name == "setData" && !trends.keys.length && e.args && e.args[0] === target_expr);

            // 影响顺序
            let isSortArr = trends.find(e => e.name !== "setData");

            if (trends.length === 0 || isSetArr || isSortArr) {
                // 清除旧的数据
                createXhearEle(par).all(`[for-id="${forId}"]`).forEach(e => {
                    e.remove();
                });

                // 重新渲染数组元素
                let fragment = document.createDocumentFragment();

                vals.forEach((e, i) => {
                    // 复制元素并重新渲染值
                    let c_ele = ele.cloneNode(true);

                    let create_opt = {
                        [item_expr]: {
                            get() {
                                return e;
                            }
                        }
                    };

                    if (key_expr) {
                        create_opt[key_expr] = {
                            get() {
                                return i;
                            }
                        };
                    }

                    // 制作循环上专用的对象
                    let p_obj = Object.create(proxyEle, create_opt);

                    c_ele._forObj = p_obj;

                    renderTemp({
                        sroot: c_ele,
                        proxyEle: p_obj,
                        syncData: true
                    });

                    fragment.appendChild(c_ele);
                });

                par.insertBefore(fragment, textnode);
            } else if (isSortArr) {
                // diff修正
            }
        });
    });

    // xv-comp-for 组件渲染
    // comp-for 是防止 xv-for内多重循环垃圾代码的产生，强迫开发者封装多重组件
    queAllToArray(sroot, '[xv-comp-for]').forEach(ele => {
        let { textnode, par } = postionNode(ele);
        ele.removeAttribute("xv-ele");

        // 添加标识
        const forId = getRandomId();
        ele.setAttribute("for-id", forId);

        // 前一份数据记录
        let old_val_ids = [];
        // for循环上的子元素
        const forChilds = [];
        const childsIds = [];

        addProcess(ele.getAttribute("xv-comp-for"), val => {
            // 获取当前id数组
            let val_ids = val.map(e => e.xid);

            if (JSON.stringify(val_ids) === JSON.stringify(old_val_ids)) {
                // 没有改动
                return;
            }

            // 空状态直接重写数据
            if (old_val_ids.length === 0) {
                val.forEach(e => {
                    // 直接生成绑定数据的组件
                    let { new_ele } = createForComp(ele, e);

                    // 添加元素
                    par.insertBefore(new_ele, textnode);
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
                            par.insertBefore(o_ele, forChilds[index]);
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
                        let { new_ele } = createForComp(ele, e);

                        if (index > forChilds.length - 1) {
                            // 末尾添加
                            par.insertBefore(new_ele, textnode);
                            childsIds.push(e.xid);
                            forChilds.push(new_ele);
                        } else {
                            // 中间插入
                            par.insertBefore(new_ele, forChilds[index]);
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

    // xv-if判断
    // 与作者理念不符， 5.2之后不允许使用if，请改用xv-show
    // queAllToArray(sroot, "[xv-if]").forEach(e => {
    //     debugger
    // });

    // xv-show
    queAllToArray(sroot, "[xv-show]").forEach(e => {
        addProcess(e.getAttribute("xv-show"), val => {
            if (val) {
                e.style.display = "";
            } else {
                e.style.display = "none";
            }
        });
    });

    // 文本渲染
    queAllToArray(sroot, "xv-span").forEach(e => {
        // 定位元素
        let { textnode, par } = postionNode(e);

        let expr = e.getAttribute('xvkey');

        addProcess(expr, val => {
            textnode.textContent = val;
        });
    });

    // 事件修正
    queAllToArray(sroot, `[xv-on]`).forEach(e => {
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
    let bindEles = queAllToArray(sroot, `[xv-bind]`);
    if (!(sroot instanceof DocumentFragment) && createXhearEle(sroot).is("[xv-bind]")) {
        bindEles.unshift(sroot);
    }

    bindEles.forEach(ele => {
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
    queAllToArray(sroot, `[xv-model]`).forEach(ele => {
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
                        let allChecks = queAllToArray(sroot, `input[type="checkbox"][xv-model="${modelKey}"]`);

                        // 查看是单个数量还是多个数量
                        if (allChecks.length > 1) {
                            allChecks.forEach(checkbox => {
                                checkbox.addEventListener('change', e => {
                                    let { value, checked } = e.target;

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
                                let { checked } = ele;
                                proxyEle.setData(modelKey, checked);
                            });
                        }
                        return;
                    case "radio":
                        let allRadios = queAllToArray(sroot, `input[type="radio"][xv-model="${modelKey}"]`);

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

    const canSetKey = proxyEle[CANSETKEYS];

    // 根据寄存对象监听值
    for (let [expr, calls] of processObj) {
        if (canSetKey.has(expr)) {
            proxyEle.watch(expr, (e, val) => {
                calls.forEach(d => d.change(val, e.trends));
            }, syncData);
        } else {
            // 其余的使用函数的方式获取
            let f = exprToFunc(expr);
            let old_val;

            proxyEle.watch(e => {
                let val = f.call(proxyEle);

                if (val === old_val || (val instanceof XData && val.string === old_val)) {
                    return;
                }

                let { trends } = e;
                calls.forEach(d => d.change(val, trends));

                if (val instanceof XData) {
                    old_val = val.string;
                } else {
                    old_val = val;
                }
            }, syncData);

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

    let { temp } = defaults;
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
        sroot = ele.attachShadow({ mode: "open" });

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

        // 重新中转内部特殊属性
        queAllToArray(sroot, "*").forEach(ele => {
            let attrbs = Array.from(ele.attributes);

            // 结束后要去除的属性
            let attrsRemoveKeys = new Set();

            // 事件绑定数据
            let bindEvent = {};

            // 属性绑定数据
            let bindAttr = {};

            attrbs.forEach(obj => {
                let {
                    name, value
                } = obj;
                name = attrToProp(name);

                // 重定向目标
                if (name === "$") {
                    // ele.setAttribute("xv-target", value);
                    Object.defineProperty(xhearEle, "$" + value, {
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

        renderTemp({
            sroot,
            proxyEle: xhearEle[PROXYTHIS],
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