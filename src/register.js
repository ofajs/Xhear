// 注册数据
const regDatabase = new Map();

const RUNARRAY = Symbol("runArray");

const register = (opts) => {
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
        // 不冒泡的数据
        unBubble: [],
        // 默认数据会向上更新
        update: true,
        // 原型链上的方法
        // proto: {},
        // 初始化完成后触发的事件
        // inited() {},
        // 添加进document执行的callback
        // attached() {},
        // 删除后执行的callback
        // detached() {}
    };
    Object.assign(defaults, opts);

    // 复制数据
    let attrs = defaults.attrs = defaults.attrs.map(val => propToAttr(val));
    defaults.props = defaults.props.map(val => propToAttr(val));
    defaults.unBubble = defaults.unBubble.map(val => propToAttr(val));
    defaults.data = cloneObject(defaults.data);
    defaults.watch = Object.assign({}, defaults.watch);

    // 转换tag
    let tag = defaults.tag = propToAttr(defaults.tag);

    if (defaults.temp) {
        let {
            temp
        } = defaults;

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

        defaults.temp = temp;
    }

    // 注册自定义元素
    let XhearElement = class extends HTMLElement {
        constructor() {
            super();
            renderEle(this, defaults);
            defaults.inited && defaults.inited.call(this);

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
            defaults.attached && defaults.attached.call(this);
        }

        disconnectedCallback() {
            if (this[RUNARRAY]) {
                return;
            }
            defaults.detached && defaults.detached.call(this);
        }

        attributeChangedCallback(name, oldValue, newValue) {
            let xEle = this.__xhear__;
            if (newValue != xEle[name]) {
                xEle[name] = newValue;
            }
        }

        static get observedAttributes() {
            return attrs;
        }
    }

    Object.assign(defaults, {
        XhearElement
    });

    // 设置映射tag数据
    regDatabase.set(defaults.tag, defaults);

    customElements.define(tag, XhearElement);
}

const queAllToArray = (target, expr) => {
    let tars = target.querySelectorAll(expr);
    return tars ? Array.from(tars) : [];
}

const renderEle = (ele, defaults) => {
    // 初始化元素
    let xhearEle = createXhearEle(ele);

    // 合并 proto
    let {
        proto
    } = defaults;
    if (proto) {
        Object.keys(proto).forEach(k => {
            // 获取描述
            let {
                get,
                set,
                value
            } = Object.getOwnPropertyDescriptor(proto, k);

            if (value) {
                Object.defineProperty(xhearEle, k, {
                    value
                });
            } else {
                Object.defineProperty(xhearEle, k, {
                    get,
                    set
                });
            }
        });
    }

    // 设置值
    Object.defineProperty(ele, "xvele", {
        value: true
    });
    Object.defineProperty(xhearEle, "xvele", {
        value: true
    });

    // 添加shadow root
    let sroot = ele.attachShadow({ mode: "open" });

    // 填充默认内容
    sroot.innerHTML = defaults.temp;

    // 设置其他 xv-tar
    queAllToArray(sroot, `[xv-tar]`).forEach(tar => {
        // Array.from(sroot.querySelectorAll(`[xv-tar]`)).forEach(tar => {
        let tarKey = tar.getAttribute('xv-tar');
        Object.defineProperty(xhearEle, "$" + tarKey, {
            value: createXhearEle(tar)
        });
    });

    // 转换 xv-span 元素
    queAllToArray(sroot, `xv-span`).forEach(e => {
        // 替换xv-span
        var textnode = document.createTextNode("");
        e.parentNode.insertBefore(textnode, e);
        e.parentNode.removeChild(e);

        // 文本数据绑定
        var xvkey = e.getAttribute('xvkey');

        // 先设置值，后监听
        xhearEle.watch(xvkey, e =>
            textnode.textContent = xhearEle[xvkey]
        );
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
                        break;
                    case "radio":
                        let allRadios = queAllToArray(sroot, `input[type="radio"][xv-model="${modelKey}"]`);

                        let rid = getRandomId();

                        allRadios.forEach(radioEle => {
                            radioEle.setAttribute("name", `radio_${rid}_${modelKey}`);
                            radioEle.addEventListener("change", e => {
                                if (radioEle.checked) {
                                    xhearEle.setData(modelKey, radioEle.value);
                                }
                            });
                        });
                        break;
                }
                break;
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

    // watch事件绑定
    xhearEle.watch(defaults.watch);

    // 要设置的数据
    let rData = Object.assign({}, defaults.data);

    // attrs 上的数据
    defaults.attrs.forEach(attrName => {
        // 获取属性值并设置
        let attrVal = ele.getAttribute(attrName);
        if (!isUndefined(attrVal) && attrVal != null) {
            rData[attrName] = attrVal;
        }

        // 绑定值
        xhearEle.watch(attrName, d => {
            // 绑定值
            ele.setAttribute(attrName, d.val);
        });
    });

    // props 上的数据
    defaults.props.forEach(attrName => {
        let attrVal = ele.getAttribute(attrName);
        (!isUndefined(attrVal) && attrVal != null) && (rData[attrName] = attrVal);
    });

    // 添加_exkey
    let canSetKey = Object.keys(rData);
    canSetKey.push(...defaults.attrs);
    canSetKey.push(...defaults.props);
    canSetKey.push(...Object.keys(defaults.watch));
    canSetKey = new Set(canSetKey);
    Object.defineProperty(xhearEle, CANSETKEYS, {
        value: canSetKey
    });

    // 合并数据后设置
    canSetKey.forEach(k => {
        let val = rData[k];

        if (!isUndefined(val)) {
            // xhearEle[k] = val;
            xhearEle.setData(k, val);
        }
    });
}