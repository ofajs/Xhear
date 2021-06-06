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

    if (defs.temp) {
        defs.temp = transTemp(defs.temp);
    }

    // 注册原生组件
    const XhearElement = class extends HTMLElement {
        constructor(...args) {
            super(...args);

            const xele = createXEle(this);

            // 修正cansetkey并合并数据
            xEleInitData(defs, xele);

            if (defs.temp) {
                // 添加shadow root
                const sroot = this.attachShadow({ mode: "open" });

                sroot.innerHTML = defs.temp;

                renderTemp({
                    host: xele,
                    xdata: xele,
                    content: sroot
                });
            }
        }

        connectedCallback() {
            console.log("connectedCallback => ", this);
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
            console.log("disconnectedCallback => ", this);
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
    }

    customElements.define(defs.tag, XhearElement);
}

// 修正cansetkeys并合并数据
const xEleInitData = (defs, xele) => {
    const { attrs, data, watch, proto } = defs;

    const keys = [...Object.keys(attrs), ...Object.keys(data), ...Object.keys(watch)];

    const protoDesp = Object.getOwnPropertyDescriptors(proto);
    Object.keys(protoDesp).forEach(keyName => {
        let { set } = protoDesp[keyName];

        if (set) {
            keys.push(keyName);
        }
    });

    keys.forEach(k => xele[CANSETKEYS].add(k));

    const xself = xele[XDATASELF];

    // 合并proto
    extend(xself, proto);

    // 合并数据
    Object.assign(xself, data, attrs);
}

// 将temp转化为可渲染的模板
const transTemp = (temp) => {
    // 去除无用的代码（注释代码）
    temp = temp.replace(/<!--.+?-->/g, "");

    // 自定义字符串转换
    var textDataArr = temp.match(/{{.+?}}/g);
    textDataArr && textDataArr.forEach((e) => {
        var key = /{{(.+?)}}/.exec(e);
        if (key) {
            temp = temp.replace(e, `<x-span xvkey="${key[1].trim()}"></x-span>`);
        }
    });

    // 再转换
    const tsTemp = document.createElement("template");
    tsTemp.innerHTML = temp;

    Array.from(tsTemp.content.querySelectorAll("*")).forEach(ele => {
        // 绑定属性
        const bindAttrs = {};
        // 绑定事件
        const bindEvent = {};

        let removeKeys = [];
        Array.from(ele.attributes).forEach(attrObj => {
            let { name, value } = attrObj;

            // 属性绑定
            let attrExecs = /^:(.+)/.exec(name);
            if (attrExecs) {
                bindAttrs[attrExecs[1]] = value;
                removeKeys.push(name);
                return;
            }

            // 事件绑定
            let eventExecs = /^@(.+)/.exec(name);
            if (eventExecs) {
                bindEvent[eventExecs[1]] = {
                    name: value
                };
                removeKeys.push(name);
                return;
            }
        });

        !isEmptyObj(bindAttrs) && ele.setAttribute("x-bind", JSON.stringify(bindAttrs));
        !isEmptyObj(bindEvent) && ele.setAttribute("x-on", JSON.stringify(bindEvent));
        removeKeys.forEach(name => ele.removeAttribute(name));
    });

    // 修正 x-if 元素
    wrapIfTemp(tsTemp);

    // 返回最终结果
    return tsTemp.innerHTML;
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