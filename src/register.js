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

// 中转头部函数
const funcToMain = (self, mainEle, { indexName, item }) => {
    let tbase = regDatabase.get(mainEle.tag);
    if (tbase) {
        let tbase_proto = tbase.proto;
        if (tbase_proto) {
            Object.keys(tbase_proto).forEach(key => {
                let f = tbase_proto[key];

                !isFunction(f) && Object.defineProperty(self, key, {
                    value: f.bind(mainEle)
                });
            });
        }

        if (indexName) {
            Object.defineProperty(self, indexName, {
                get() {
                    return item.index;
                }
            });
        }
    }
}

// 组件for绑定复制并绑定元素
const createForComp = (ele, e, temps, proxyEle) => {
    if (ele.tagName.toLowerCase() == "template") {
        // for循环渲染用的元素
        let tempName = ele.getAttribute("is");

        if (!tempName) {
            throw {
                desc: "the templte missing 'is' attribute",
                ele
            };
        }

        // 获取模板
        let targetTemp = temps.get(tempName);

        let c_ele = targetTemp.content.children[0].cloneNode(true);
        let n_proxyEle = createXhearProxy(c_ele);
        n_proxyEle[CANSETKEYS] = new Set(Object.keys(e));

        // 直接渲染原生元素
        renderTemp({
            sroot: c_ele,
            proxyEle: n_proxyEle,
            temps
        });

        // 索引属性key获取
        let indexName = targetTemp.getAttribute("index-name");
        funcToMain(n_proxyEle[XDATASELF], proxyEle, {
            indexName,
            item: e
        });

        e.sync(n_proxyEle, null, true);

        return {
            new_ele: c_ele
        };
    } else {
        // 自定义组件
        let new_ele = ele.cloneNode(true);

        // 数据覆盖
        let p_ele = createXhearProxy(new_ele);

        e.sync(p_ele, null, true);

        return { new_ele };
    }
}

// 生成fill用数据
// const createFillEle = (ele, e, temps, proxyEle) => {
//     debugger
// }

// 将元素前置并触发事件的方法
const xdInsertBefore = (new_ele, textnode) => {
    let par = textnode.parentNode;

    // 记录旧顺序
    let old_childs = Array.from(par.children);

    par.insertBefore(new_ele, textnode);

    // 触发 updateIndex 事件
    Array.from(par.children).forEach((e, i) => {
        let old_index = old_childs.indexOf(e);

        if (old_index !== -1 && old_index !== i) {
            emitXDataIndex(createXhearProxy(e), i, old_index);
        }
    });
}

// render函数用元素查找（包含自身元素）
const getCanRenderEles = (root, expr) => {
    let arr = queAllToArray(root, expr);
    if (!(root instanceof DocumentFragment) && createXhearEle(root).is(expr)) {
        arr.unshift(root);
    }
    return arr;
}

// 渲染shadow dom 的内容
const renderTemp = ({ sroot, proxyEle, temps }) => {
    // 处理用寄存对象
    const processObj = new Map();
    const addProcess = (expr, func) => {
        let calls = processObj.get(expr.trim());
        if (!calls) {
            calls = [];
            processObj.set(expr, { calls });
        } else {
            calls = calls.calls;
        }

        calls.push({
            change: func
        })
    }

    const canSetKey = proxyEle[CANSETKEYS];

    // 重新中转内部特殊属性
    getCanRenderEles(sroot, "*").forEach(ele => {
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
                Object.defineProperty(proxyEle, "$" + value, {
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

    // xv-for 组件渲染
    // comp-for 是防止 xv-for内多重循环垃圾代码的产生，强迫开发者封装多重组件
    getCanRenderEles(sroot, '[xv-for]').forEach(ele => {
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

        addProcess(ele.getAttribute("xv-for"), val => {
            let has_obj = false;
            // 获取当前id数组
            let val_ids = val.map(e => {
                if (e instanceof Object) {
                    has_obj = true;
                    return e.xid
                }
            });

            if (!has_obj) {
                forChilds.forEach(e => e.parentNode.removeChild(e));
                forChilds.length = 0;
                // 非数组类型都是直接渲染
                val.forEach((e, index) => {
                    // 直接生成绑定数据的组件
                    let d = $.xdata({ item: e, index });
                    let { new_ele } = createForComp(ele, d, temps, proxyEle);

                    // 添加元素
                    xdInsertBefore(new_ele, textnode);
                    forChilds.push(new_ele);
                });
                return;
            }

            if (JSON.stringify(val_ids) === JSON.stringify(old_val_ids)) {
                // 没有改动
                return;
            }

            // 空状态直接重写数据
            if (old_val_ids.length === 0) {
                val.forEach(e => {
                    // 直接生成绑定数据的组件
                    let { new_ele } = createForComp(ele, e, temps, proxyEle);

                    // 添加元素
                    xdInsertBefore(new_ele, textnode);
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
                            xdInsertBefore(o_ele, forChilds[index]);
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
                        let { new_ele } = createForComp(ele, e, temps, proxyEle);

                        if (index > forChilds.length - 1) {
                            // 末尾添加
                            xdInsertBefore(new_ele, textnode);
                            childsIds.push(e.xid);
                            forChilds.push(new_ele);
                        } else {
                            // 中间插入
                            xdInsertBefore(new_ele, forChilds[index]);
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

    // xv-fill，对内部进行填充的循环
    // getCanRenderEles(sroot, "[xv-fill]").forEach(e => {
    //     let fillAttr = e.getAttribute("xv-fill");
    //     let fillContent = e.getAttribute("fill-content");

    //     // 判断是否组件
    //     let isComponent = !/[^a-z\-]/.test(fillContent);

    //     // 旧的数据id
    //     let old_ids = [];

    //     addProcess(fillAttr, val => {
    //         if (isComponent) {
    //             // 组件
    //             // 先填充一匹内容

    //             if (!old_ids.length) {
    //                 // 直接填充
    //                 debugger
    //             }

    //             debugger
    //         } else {
    //             // 模板
    //             // 获取内容
    //             let targetTemp = temps.get(fillContent);

    //             if (targetTemp) {
    //                 let ele = createFillEle();

    //                 debugger
    //             }
    //         }
    //     });
    // });

    // xv-if判断
    // if会重新渲染组件，滥用导致性能差， 5.2之后不允许使用if，请改用xv-show
    // queAllToArray(sroot, "[xv-if]").forEach(e => {
    //     debugger
    // });

    // xv-show
    getCanRenderEles(sroot, "[xv-show]").forEach(e => {
        addProcess(e.getAttribute("xv-show"), val => {
            if (val) {
                e.style.display = "";
            } else {
                e.style.display = "none";
            }
        });
    });

    // 文本渲染
    getCanRenderEles(sroot, "xv-span").forEach(e => {
        // 定位元素
        let { textnode, par } = postionNode(e);

        let expr = e.getAttribute('xvkey');

        addProcess(expr, val => {
            textnode.textContent = val;
        });
    });

    // 事件修正
    getCanRenderEles(sroot, `[xv-on]`).forEach(e => {
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
    getCanRenderEles(sroot, `[xv-bind]`).forEach(ele => {
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
                } else if (!canSetKey.has(expr)) {
                    // 不能双向绑定的值
                    console.error({
                        desc: "the key can't sync bind",
                        key: "attrName",
                        target: ele,
                        host: proxyEle
                    });
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
    getCanRenderEles(sroot, `[xv-model]`).forEach(ele => {
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
                        let allChecks = getCanRenderEles(sroot, `input[type="checkbox"][xv-model="${modelKey}"]`);

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
                        let allRadios = getCanRenderEles(sroot, `input[type="radio"][xv-model="${modelKey}"]`);

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

    // 根据寄存对象监听值
    for (let [expr, d] of processObj) {
        let { calls, target } = d;
        target = target || proxyEle;

        if (canSetKey.has(expr)) {
            target.watch(expr, (e, val) => {
                calls.forEach(d => d.change(val, e.trends));
            });
        } else {
            // 其余的使用函数的方式获取
            let f = exprToFunc(expr);
            let old_val;

            let watchFun;
            target.watch(watchFun = e => {
                let val = f.call(target);

                if (val === old_val || (val instanceof XData && val.string === old_val)) {
                    return;
                }

                if (e) {
                    let { trends } = e;
                    calls.forEach(d => d.change(val, trends));
                }

                if (val instanceof XData) {
                    old_val = val.string;
                } else {
                    old_val = val;
                }
            });

            // 同时监听index变动
            target.on("updateIndex", watchFun)
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

        // if (temp.includes("template")) {
        //     debugger
        // }

        // 查找所有模板
        let temps = new Map();
        let tempEle = Array.from(sroot.querySelectorAll(`template[name]`));
        tempEle.length && tempEle.forEach(e => {
            // 内部清除
            e.parentNode.removeChild(e);

            // 注册元素
            let name = e.getAttribute("name");

            temps.set(name, e);
        });

        renderTemp({
            sroot,
            proxyEle: xhearEle[PROXYTHIS],
            temps
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