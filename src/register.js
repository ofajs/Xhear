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
        // 直接监听属性变动对象
        watch: {},
        // 合并到原型链上的方法
        proto: {},
        // 被创建的时候触发的callback
        // created() { },
        // 初次渲染完成后触发的事件
        // ready() {},
        // 添加进document执行的callback
        // attached() {},
        // 从document删除后执行callback
        // detached() {},
        // 容器元素发生变动
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

        // 强制刷新视图
        forceUpdate() { }
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

            // cansetKeys.forEach(e => xele[CANSETKEYS].add(e));
            Object.assign(xele, defs.data, defs.attrs);

            defs.created && defs.created.call(xele);

            if (defs.temp) {
                // 添加shadow root
                const sroot = this.attachShadow({ mode: "open" });

                sroot.innerHTML = defs.temp;

                // 渲染元素
                renderTemp({
                    host: xele,
                    xdata: xele,
                    content: sroot,
                    temps
                });

                defs.ready && defs.ready.call(xele);
            }
        }

        connectedCallback() {
            // console.log("connectedCallback => ", this);
            this.__x_connected = true;
            if (defs.attached && !this.__x_runned_connected) {
                nexTick(() => {
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
                nexTick(() => {
                    if (!this.__x_connected && !this.__x_runnded_disconnected) {
                        this.__x_runnded_disconnected = true;
                        defs.detached.call(createXEle(this));
                    }
                });
            }
        }


        attributeChangedCallback(name, oldValue, newValue) {
            xele[attrToProp(name)] = newValue;
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


        let removeKeys = [];
        Array.from(ele.attributes).forEach(attrObj => {
            let { name, value } = attrObj;

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

            // if判断
            

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