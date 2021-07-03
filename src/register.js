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
            _this.setAttribute(key, xele[key]);
        });
        delete _this.__set_attr;
    });

    // watch函数触发
    let d_watch = defs.watch;
    if (!isEmptyObj(d_watch)) {
        // Object.keys(d_watch).forEach(key => d_watch[key].call(xele, xele[key]));
        xele.watchKey(d_watch, true);
        // let vals = {};
        // xele.watchTick(f = (e) => {
        //     Object.keys(d_watch).forEach(k => {
        //         let func = d_watch[k];

        //         let val = xele[k];

        //         if (val === vals[k]) {
        //             return;
        //         }
        //         vals[k] = val;

        //         func.call(xele, val);
        //     });
        // });

        // // 先运行一次
        // f();
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
        const d = transTemp(defs.temp);
        defs.temp = d.html;
        temps = d.temps;
    }

    // 生成新的XEle class
    const CustomXEle = class extends XEle {
        constructor(ele) {
            super(ele);
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
const transTemp = (temp) => {
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

    Array.from(tsTemp.content.querySelectorAll("*")).forEach(ele => {
        // 绑定属性
        const bindAttrs = {};
        const bindProps = {};
        const bindSync = {};
        // 绑定事件
        const bindEvent = {};
        // 填充
        const bindFill = [];
        const bindItem = {};

        // if判断
        let bindIf = "";

        let removeKeys = [];
        Array.from(ele.attributes).forEach(attrObj => {
            let { name, value } = attrObj;

            // if判断
            const ifExecs = /^if:/.exec(name);
            if (ifExecs) {
                bindIf = value;
                removeKeys.push(name);
                return;
            }

            // 属性绑定
            const attrExecs = /^attr:(.+)/.exec(name);
            if (attrExecs) {
                bindAttrs[attrExecs[1]] = value;
                removeKeys.push(name);
                return;
            }

            const propExecs = /^:(.+)/.exec(name);
            if (propExecs) {
                bindProps[propExecs[1]] = value;
                removeKeys.push(name);
                return;
            }

            const syncExecs = /^sync:(.+)/.exec(name);
            if (syncExecs) {
                bindSync[syncExecs[1]] = value;
                removeKeys.push(name);
                return;
            }

            // 填充绑定
            const fillExecs = /^fill:(.+)/.exec(name);
            if (fillExecs) {
                bindFill.push(fillExecs[1], value);
                removeKeys.push(name);
                return;
            }

            const itemExecs = /^item:(.+)/.exec(name);
            if (itemExecs) {
                bindItem[itemExecs[1]] = value;
                removeKeys.push(name);
                return;
            }

            // 事件绑定
            const eventExecs = /^@(.+)/.exec(name) || /^on:(.+)/.exec(name);
            if (eventExecs) {
                bindEvent[eventExecs[1]] = {
                    name: value
                };
                removeKeys.push(name);
                return;
            }
        });

        bindIf && (ele.setAttribute("x-if", bindIf));
        !isEmptyObj(bindAttrs) && ele.setAttribute("x-attr", JSON.stringify(bindAttrs));
        !isEmptyObj(bindProps) && ele.setAttribute("x-prop", JSON.stringify(bindProps));
        !isEmptyObj(bindSync) && ele.setAttribute("x-sync", JSON.stringify(bindSync));
        bindFill.length && ele.setAttribute("x-fill", JSON.stringify(bindFill));
        !isEmptyObj(bindItem) && ele.setAttribute("x-item", JSON.stringify(bindItem));
        !isEmptyObj(bindEvent) && ele.setAttribute("x-on", JSON.stringify(bindEvent));
        removeKeys.forEach(name => ele.removeAttribute(name));
    });

    // 将 template 内的页进行转换
    Array.from(tsTemp.content.querySelectorAll("template")).forEach(e => {
        e.innerHTML = transTemp(e.innerHTML).html;
    });

    // 修正 x-if 元素
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

    // 返回最终结果
    return {
        temps,
        html: tsTemp.innerHTML
    };
}

// 给 x-if 元素包裹 template
const wrapIfTemp = (tempEle) => {
    let iEles = tempEle.content.querySelectorAll("[x-if]");

    iEles.forEach(ele => {
        if (ele.tagName.toLowerCase() == "template") {
            return;
        }

        let ifTempEle = document.createElement("template");
        ifTempEle.setAttribute("x-if", ele.getAttribute("x-if"));
        ele.removeAttribute("x-if");

        ele.parentNode.insertBefore(ifTempEle, ele);
        ifTempEle.content.appendChild(ele);
    });

    // 内部 template 也进行包裹
    Array.from(tempEle.content.querySelectorAll("template")).forEach(wrapIfTemp);
}