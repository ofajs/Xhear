// 所有注册的组件
const Components = {};

// 渲染元素
const renderXEle = ({ xele, defs, temps, _this }) => {
    Object.assign(xele, defs.data, defs.attrs);

    defs.created && defs.created.call(xele);

    if (defs.temp) {
        // 添加shadow root
        const sroot = _this.attachShadow({ mode: "open" });

        sroot.innerHTML = defs.temp;

        // 渲染元素
        renderTemp({
            host: xele,
            xdata: xele,
            content: sroot,
            temps
        });
    }

    defs.ready && defs.ready.call(xele);

    // attrs监听
    !isEmptyObj(defs.attrs) && xele.watchTick(e => {
        _this.__set_attr = 1;
        Object.keys(defs.attrs).forEach(key => {
            _this.setAttribute(propToAttr(key), xele[key]);
        });
        delete _this.__set_attr;
    });

    // watch函数触发
    let d_watch = defs.watch;
    if (!isEmptyObj(d_watch)) {
        xele.watchKey(d_watch, true);
    }
}

// 注册组件的主要逻辑
const register = (opts) => {
    const defs = {
        // 注册的组件名
        tag: "",
        // 正文内容字符串
        temp: "",
        // 和attributes绑定的keys
        attrs: {},
        // 默认数据
        data: {},
        // 根据属性直接设置值
        watch: {},
        // 合并到原型链上的方法
        proto: {},
        // // 组件被创建时触发的函数（数据初始化完成）
        // created() { },
        // // 组件数据初始化完成后触发的函数（初次渲染完毕）
        // ready() { },
        // // 被添加到document触发的函数
        // attached() { },
        // // 被移出document触发的函数
        // detached() { },
        // // 容器元素发生改变
        // slotchange() { }
    };

    Object.assign(defs, opts);

    let temps;

    if (defs.temp) {
        const d = transTemp(defs.temp, defs.tag);
        defs.temp = d.html;
        temps = d.temps;
    }

    // 生成新的XEle class
    let className = attrToProp(opts.tag);
    className = className[0].toUpperCase() + className.slice(1)
    const CustomXEle = Components[className] = class extends XEle {
        constructor(ele) {
            super(ele);

            ele.isCustom = true;
        }

        // // 强制刷新视图
        // forceUpdate() { }
        // 回收元素内所有的数据（防止垃圾回收失败）
        revoke() {
            Object.values(this).forEach(child => {
                if (!(child instanceof XEle) && isxdata(child)) {
                    clearXDataOwner(child, this[XDATASELF]);
                }
            });

            removeElementBind(this.shadow.ele);
        }
    }

    // 扩展原型
    extend(CustomXEle.prototype, defs.proto);

    const cansetKeys = getCansetKeys(defs);

    // 扩展CANSETKEYS
    defineProperties(CustomXEle.prototype, {
        [CANSETKEYS]: {
            writable: true,
            value: new Set([...xEleDefaultSetKeys, ...cansetKeys])
        }
    });

    // 注册原生组件
    const XhearElement = class extends HTMLElement {
        constructor(...args) {
            super(...args);

            let old_xele = this.__xEle__;
            if (old_xele) {
                console.warn({
                    target: old_xele,
                    desc: "please re-instantiate the object"
                });
            }

            this.__xEle__ = new CustomXEle(this);

            const xele = createXEle(this);

            renderXEle({
                xele, defs, temps,
                _this: this
            });
        }

        connectedCallback() {
            // console.log("connectedCallback => ", this);
            this.__x_connected = true;
            if (defs.attached && !this.__x_runned_connected) {
                nextTick(() => {
                    if (this.__x_connected && !this.__x_runned_connected) {
                        this.__x_runned_connected = true;
                        defs.attached.call(createXEle(this));
                    }
                });
            }
        }

        // adoptedCallback() {
        //     console.log("adoptedCallback => ", this);
        // }

        disconnectedCallback() {
            // console.log("disconnectedCallback => ", this);
            this.__x_connected = false;
            if (defs.detached && !this.__x_runnded_disconnected) {
                nextTick(() => {
                    if (!this.__x_connected && !this.__x_runnded_disconnected) {
                        this.__x_runnded_disconnected = true;
                        defs.detached.call(createXEle(this));
                    }
                });
            }
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (this.__set_attr) return;

            createXEle(this)[attrToProp(name)] = newValue;
        }

        static get observedAttributes() {
            return Object.keys(defs.attrs).map(e => propToAttr(e));
        }
    }

    customElements.define(defs.tag, XhearElement);
}

// 根据 defaults 获取可设置的keys
const getCansetKeys = (defs) => {
    const { attrs, data, watch, proto } = defs;

    const keys = [...Object.keys(attrs), ...Object.keys(data), ...Object.keys(watch)];

    const protoDesp = Object.getOwnPropertyDescriptors(proto);
    Object.keys(protoDesp).forEach(keyName => {
        let { set } = protoDesp[keyName];

        if (set) {
            keys.push(keyName);
        }
    });

    return keys;
}

// 将temp转化为可渲染的模板
const transTemp = (temp, regTagName) => {
    // 去除注释代码
    temp = temp.replace(/<!--.+?-->/g, "");

    // 自定义字符串转换
    var textDataArr = temp.match(/{{.+?}}/g);
    textDataArr && textDataArr.forEach((e) => {
        var key = /{{(.+?)}}/.exec(e);
        if (key) {
            // temp = temp.replace(e, `<span :text="${key[1]}"></span>`);
            temp = temp.replace(e, `<x-span prop="${encodeURI(key[1])}"></x-span>`);
        }
    });

    // 再转换
    const tsTemp = document.createElement("template");
    tsTemp.innerHTML = temp;

    // 原生元素上修正 temp:xxx模板
    let addTemps = [], removeRegEles = [];

    Array.from(tsTemp.content.querySelectorAll("*")).forEach(ele => {
        // 绑定对象
        const bindData = {};

        // 需要被删除的属性
        const needRemoveAttrs = [];

        Array.from(ele.attributes).forEach(attrObj => {
            let { name, value } = attrObj;

            // 模板抽离
            let tempMatch = /^temp:(.+)/.exec(name);
            if (tempMatch) {
                let [, tempName] = tempMatch;
                let tempEle = document.createElement("template");
                tempEle.setAttribute('name', tempName);
                ele.removeAttribute(name);
                tempEle.innerHTML = ele.outerHTML;
                addTemps.push(tempEle);
                removeRegEles.push(ele);
                return true;
            }

            // 指令
            let command;
            // 目标
            let target;

            if (/^#/.test(name)) {
                command = "cmd";
                target = name.replace(/^#/, "");
            } else if (/^@/.test(name)) {
                command = "on";
                target = name.replace(/^@/, "");
            } else if (name.includes(":")) {
                // 带有指令分隔符的，进行之类修正
                let m_arr = name.split(":");

                if (m_arr.length == 2) {
                    // 模板正确，进行赋值
                    command = m_arr[0];
                    target = m_arr[1];

                    if (command === "") {
                        // 属性绑定修正
                        command = "prop";
                    }
                } else {
                    // 绑定标识出错
                    throw {
                        desc: "template binding mark error",
                        target: ele,
                        expr: name
                    };
                }
            }

            if (command) {
                let data = bindData[command] || (bindData[command] = {});
                if (command == "on") {
                    data[target] = {
                        name: value
                    };
                } else if (target) {
                    data[target] = value;
                }
                needRemoveAttrs.push(name);
            }
        });

        if (needRemoveAttrs.length) {
            // ele.setAttribute("bind-data", JSON.stringify(bindData));
            // ele.setAttribute('bind-keys', Object.keys(bindData).join(" "));

            // 原属性还原
            Object.keys(bindData).forEach(bName => {
                let data = bindData[bName];
                if (bName == "cmd") {
                    Object.keys(data).forEach(dName => {
                        ele.setAttribute(`x-cmd-${dName}`, data[dName]);
                    });
                } else {
                    ele.setAttribute(`x-${bName}`, JSON.stringify(data));
                }
            });

            needRemoveAttrs.forEach(name => ele.removeAttribute(name));
        }
    });

    if (addTemps.length) {
        addTemps.forEach(ele => {
            tsTemp.content.appendChild(ele);
        });
        removeRegEles.forEach(ele => {
            tsTemp.content.removeChild(ele);
        });
    }

    // 将 template 内的页进行转换
    Array.from(tsTemp.content.querySelectorAll("template")).forEach(e => {
        e.innerHTML = transTemp(e.innerHTML).html;
    });

    // 修正 x-cmd-if 元素
    wrapIfTemp(tsTemp);

    // 获取模板
    let temps = new Map();

    Array.from(tsTemp.content.querySelectorAll(`template[name]`)).forEach(e => {
        temps.set(e.getAttribute("name"), {
            ele: e,
            code: e.content.children[0].outerHTML
        });
        e.parentNode.removeChild(e);
    })

    // 对temp进行检测
    if (temps.size) {
        for (let [key, e] of temps.entries()) {
            const { children } = e.ele.content;
            if (children.length !== 1) {
                throw {
                    name: key,
                    html: e.code,
                    tag: regTagName,
                    desc: "register error, only one element must exist in the template"
                };
            } else {
                if (children[0].getAttribute("x-cmd-if")) {
                    throw {
                        name: key,
                        html: e.code,
                        tag: regTagName,
                        desc: "register error, cannot use if on template first element"
                    };
                }
            }
        }
    }

    // 返回最终结果
    return {
        temps,
        html: tsTemp.innerHTML
    };
}

// 给 x-cmd-if 元素包裹 template
const wrapIfTemp = (tempEle) => {
    let iEles = tempEle.content.querySelectorAll("[x-cmd-if],[x-cmd-else-if],[x-cmd-else],[x-cmd-await],[x-cmd-then],[x-cmd-catch]");

    iEles.forEach(ele => {
        if (ele.tagName.toLowerCase() == "template") {
            return;
        }

        let ifTempEle = document.createElement("template");
        ["x-cmd-if", "x-cmd-else-if", "x-cmd-else", "x-cmd-await", "x-cmd-then", "x-cmd-catch"].forEach(name => {
            let val = ele.getAttribute(name);

            if (val === null) {
                return;
            }

            ifTempEle.setAttribute(name, val);
            ele.removeAttribute(name);
        });

        ele.parentNode.insertBefore(ifTempEle, ele);
        ifTempEle.content.appendChild(ele);
    });

    // 内部 template 也进行包裹
    Array.from(tempEle.content.querySelectorAll("template")).forEach(wrapIfTemp);
}