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
    let n_expr = expr.replace(/'/g, "\\'")
    n_expr = n_expr.replace(/"/g, '\\"')

    return new Function("$event", `
with(this){
    try{
        return ${expr}
    }catch(e){
        let errObj = {
            expr:'${n_expr}',
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
            defaults.detached && defaults.detached.call(createXhearProxy(this));
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

const renderEle = (ele, defaults) => {
    // 初始化元素
    let xhearEle = createXhearEle(ele);

    // 存储promise队列
    let renderTasks = [];

    // 合并 proto
    defaults.proto && xhearEle.extend(defaults.proto);

    let { temp } = defaults;
    let sroot;

    if (temp) {
        // 添加shadow root
        sroot = ele.attachShadow({ mode: "open" });

        // 去除无用的代码（注释代码）
        temp = temp.replace(/<!--.+?-->/g, "");

        // 准换自定义字符串数据
        var textDataArr = temp.match(/{{.+?}}/g);
        textDataArr && textDataArr.forEach((e) => {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                temp = temp.replace(e, `<xv-span xvkey="${key[1].trim()}"></xv-span>`);
            }
        });

        // 填充默认内容
        sroot.innerHTML = temp;

        // xv-if 条件转换
        queAllToArray(sroot, `[xv-if]`).forEach(e => {
            // xv-if 不能和 $ 配合使用
            if (e.getAttribute("$")) {
                console.error({
                    target: e,
                    desc: "xv-if cannot be used with $element"
                });
                return;
            }

            // 添加定位text
            var textnode = document.createTextNode("");
            e.parentNode.insertBefore(textnode, e);

            // 是否存在
            let targetEle = e;

            embedWatch({
                target: xhearEle,
                expr: e.getAttribute("xv-if"),
                callback(val) {
                    if (val) {
                        // 不存在的情况下添加一份
                        if (!targetEle) {
                            targetEle = e.cloneNode();
                            textnode.parentNode.insertBefore(targetEle, textnode);
                        }
                    } else {
                        // 不能存在就删除
                        targetEle.parentNode.removeChild(targetEle);
                        targetEle = null;
                    }
                }
            });
        });

        // 设置其他 xv-tar
        // queAllToArray(sroot, `[xv-tar]`).forEach(tar => {
        //     let tarKey = tar.getAttribute('xv-tar');
        //     Object.defineProperty(xhearEle, "$" + tarKey, {
        //         get: () => createXhearProxy(tar)
        //     });
        // });

        // 转换 xv-span 元素
        queAllToArray(sroot, `xv-span`).forEach(e => {
            // 替换xv-span
            var textnode = document.createTextNode("");
            e.parentNode.insertBefore(textnode, e);
            e.parentNode.removeChild(e);

            // 函数绑定
            embedWatch({
                target: xhearEle,
                expr: e.getAttribute('xvkey'),
                callback(val) {
                    textnode.textContent = val;
                }
            });
        });

        // xv-show 条件转换
        queAllToArray(sroot, `[xv-show]`).forEach(e => {
            embedWatch({
                target: xhearEle,
                expr: e.getAttribute('xv-show'),
                callback(val) {
                    if (val) {
                        e.style.display = "";
                    } else {
                        e.style.display = "none";
                    }
                }
            });
        });

        // :attribute对子元素属性修正方法
        queAllToArray(sroot, "*").forEach(ele => {
            let attrbs = Array.from(ele.attributes);
            let attrOriExpr = '';
            attrbs.forEach(obj => {
                let {
                    name, value
                } = obj;
                let prop = value;
                name = attrToProp(name);

                if (name === "$") {
                    Object.defineProperty(xhearEle, "$" + value, {
                        get: () => createXhearProxy(ele)
                    });
                    return;
                }

                // 判断prop是否函数表达式
                const isExpr = isFunctionExpr(prop);

                // 属性绑定
                let colonExecs = /^:(.+)/.exec(name);
                if (colonExecs) {
                    let attr = colonExecs[1];

                    // 判断是否双向绑定
                    let isEachBinding = /^#(.+)/.exec(attr);
                    if (isEachBinding) {
                        attr = isEachBinding[1];
                        isEachBinding = !!isEachBinding;

                        // 函数表达式不能用于双向绑定
                        if (isExpr) {
                            throw {
                                desc: "Function expressions cannot be used for sync binding",
                            };
                        }
                    }

                    if (!isExpr) {
                        // 属性监听
                        let watchCall;
                        if (ele.xvele) {
                            watchCall = (e, val) => {
                                if (val instanceof XhearEle) {
                                    val = val.object;
                                }
                                createXhearEle(ele).setData(attr, val);
                            }

                            if (isEachBinding) {
                                // 双向绑定
                                createXhearEle(ele).watch(attr, (e, val) => {
                                    xhearEle.setData(prop, val);
                                });
                            }
                        } else {
                            watchCall = (e, val) => {
                                if (val === undefined || val === null) {
                                    ele.removeAttribute(attr);
                                } else {
                                    ele.setAttribute(attr, val);
                                }
                            };
                        }

                        xhearEle.watch(prop, watchCall)
                    } else {
                        let func = exprToFunc(prop);

                        // 表达式
                        xhearEle.watch(e => {
                            let val = func.call(xhearEle[PROXYTHIS]);

                            if (ele.xvele) {
                                if (val instanceof XhearEle) {
                                    val = val.object;
                                }
                                createXhearEle(ele).setData(attr, val);
                            } else {
                                if (val === undefined || val === null) {
                                    ele.removeAttribute(attr);
                                } else {
                                    ele.setAttribute(attr, val);
                                }
                            }
                        });
                    }

                    // 删除绑定表达属性
                    ele.removeAttribute(colonExecs[0]);
                    attrOriExpr += `${name}=${value},`;
                }

                if (attrOriExpr) {
                    attrOriExpr = attrOriExpr.slice(0, -1);
                    ele.setAttribute('xv-binding-expr', attrOriExpr);
                }

                // 事件绑定
                let atExecs = /^@(.+)/.exec(name);
                if (atExecs) {
                    // 参数分解
                    let [eventName, ...opts] = atExecs[1].split(".") || "";

                    let functionName = "on";
                    if (opts.includes("once")) {
                        functionName = "one";
                    }

                    // 函数表达式的话提前生成函数，属性的话直接绑定
                    let func;
                    if (isExpr) {
                        func = exprToFunc(prop);
                    } else {
                        func = xhearEle[prop];
                    }

                    // 绑定事件
                    createXhearEle(ele)[functionName](eventName, (event, data) => {
                        if (opts.includes("prevent")) {
                            event.preventDefault();
                        }

                        if (opts.includes("stop")) {
                            event.bubble = false;
                        }

                        func.call(xhearEle[PROXYTHIS], event, data);
                    });
                }
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

                                        let tarData = xhearEle.getData(modelKey);
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
                                xhearEle.watch(modelKey, (e, val) => {
                                    ele.checked = val;
                                });
                                ele.addEventListener("change", e => {
                                    let { checked } = ele;
                                    xhearEle.setData(modelKey, checked);
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
                                        xhearEle.setData(modelKey, radioEle.value);
                                    }
                                });
                            });
                            return;
                    }
                // 其他input 类型继续往下走
                case "textarea":
                    xhearEle.watch(modelKey, (e, val) => {
                        ele.value = val;
                    });
                    ele.addEventListener("input", e => {
                        xhearEle.setData(modelKey, ele.value);
                    });
                    break;
                case "select":
                    xhearEle.watch(modelKey, (e, val) => {
                        ele.value = val;
                    });
                    ele.addEventListener("change", e => {
                        xhearEle.setData(modelKey, ele.value);
                    });
                    break;
                default:
                    // 自定义组件
                    if (ele.xvele) {
                        let cEle = ele.__xhear__;
                        cEle.watch("value", (e, val) => {
                            xhearEle.setData(modelKey, val);
                        });
                        xhearEle.watch(modelKey, (e, val) => {
                            cEle.setData("value", val);
                        });
                    } else {
                        console.warn(`can't xv-model with thie element => `, ele);
                    }
            }
        });
        xvModelJump.clear();
        xvModelJump = null;
    }

    // watch事件绑定
    xhearEle.watch(defaults.watch);

    // 要设置的数据
    let rData = Object.assign({}, defaults.data);

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