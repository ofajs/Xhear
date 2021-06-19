// 最基础对象功能
const XEleHandler = {
    get(target, key, receiver) {
        if (typeof key === 'string' && !/\D/.test(key)) {
            return createXEle(target.ele.children[key]);
        }
        return Reflect.get(target, key, receiver);
    },
    ownKeys(target) {
        let keys = Reflect.ownKeys(target);
        let len = target.ele.children.length;
        for (let i = 0; i < len; i++) {
            keys.push(String(i));
        }
        return keys;
    },
    getOwnPropertyDescriptor(target, key) {
        if (typeof key === 'string' && !/\D/.test(key)) {
            return {
                enumerable: true,
                configurable: true,
            }
        }
        return Reflect.getOwnPropertyDescriptor(target, key);
    }
};

const EVENTS = Symbol("events");
const xSetData = XData.prototype.setData;

// 可直接设置的Key
const xEleDefaultSetKeys = ["text", "html", "show", "style"];
const CANSETKEYS = Symbol("cansetkeys");

class XEle extends XData {
    constructor(ele) {
        super(Object.assign({}, XEleHandler));
        // super(XEleHandler);

        const self = this[XDATASELF];

        self.tag = ele.tagName ? ele.tagName.toLowerCase() : ''

        defineProperties(self, {
            ele: {
                get: () => ele
            },
            [EVENTS]: {
                writable: true,
                value: ""
            },
            // 允许被设置的key值
            // [CANSETKEYS]: {
            //     value: new Set(xEleDefaultSetKeys)
            // }
        });

        delete self.length;

        if (self.tag == "input") {
            renderInput(self);
        }
    }

    setData(key, value) {
        if (!this[CANSETKEYS] || this[CANSETKEYS].has(key)) {
            return xSetData.call(this, key, value);
        }
    }

    get root() {
        return createXEle(this.ele.getRootNode());
    }

    get host() {
        let root = this.ele.getRootNode();
        let { host } = root;
        return host ? createXEle(host) : null;
    }

    get shadow() {
        return createXEle(this.ele.shadowRoot);
    }

    get parent() {
        let { parentNode } = this.ele;
        return (!parentNode || parentNode === document) ? null : createXEle(parentNode);
    }

    get index() {
        let { parentNode } = this.ele;

        if (!parentNode) {
            return null;
        }

        return Array.prototype.indexOf.call(parentNode.children, this.ele);
    }

    get length() {
        return this.ele.children.length;
    }

    get text() {
        return this.ele.textContent;
    }

    set text(val) {
        this.ele.textContent = val;
    }

    get html() {
        return this.ele.innerHTML;
    }

    set html(val) {
        this.ele.innerHTML = val;
    }

    get class() {
        return this.ele.classList;
    }

    get data() {
        return this.ele.dataset;
    }

    get css() {
        return getComputedStyle(this.ele);
    }

    get style() {
        return this.ele.style;
    }

    set style(d) {
        if (getType(d) == "string") {
            this.ele.style = d;
            return;
        }

        let {
            style
        } = this;

        // 覆盖旧的样式
        let hasKeys = Array.from(style);
        let nextKeys = Object.keys(d);

        // 清空不用设置的key
        hasKeys.forEach(k => {
            if (!nextKeys.includes(k)) {
                style[k] = "";
            }
        });

        Object.assign(style, d);
    }

    get show() {
        return this.ele.style.display !== "none";
    }

    set show(val) {
        if (val) {
            this.ele.style.display = "";
        } else {
            this.ele.style.display = "none";
        }
    }

    get position() {
        return {
            top: this.ele.offsetTop,
            left: this.ele.offsetLeft
        };
    }

    get offset() {
        let reobj = {
            top: 0,
            left: 0
        };

        let tar = this.ele;
        while (tar && tar !== document) {
            reobj.top += tar.offsetTop;
            reobj.left += tar.offsetLeft;
            tar = tar.offsetParent
        }
        return reobj;
    }

    get width() {
        return parseInt(getComputedStyle(this.ele).width);
    }

    get height() {
        return parseInt(getComputedStyle(this.ele).height);
    }

    get innerWidth() {
        return this.ele.clientWidth;
    }

    get innerHeight() {
        return this.ele.clientHeight;
    }

    get offsetWidth() {
        return this.ele.offsetWidth;
    }

    get offsetHeight() {
        return this.ele.offsetHeight;
    }

    get outerWidth() {
        let computedStyle = getComputedStyle(this.ele);
        return this.ele.offsetWidth + parseInt(computedStyle['margin-left']) + parseInt(computedStyle['margin-right']);
    }

    get outerHeight() {
        let computedStyle = getComputedStyle(this.ele);
        return this.ele.offsetHeight + parseInt(computedStyle['margin-top']) + parseInt(computedStyle['margin-bottom']);
    }

    get next() {
        const nextEle = this.ele.nextElementSibling;
        return nextEle ? createXEle(nextEle) : null;
    }

    get prev() {
        const prevEle = this.ele.previousElementSibling;
        return prevEle ? createXEle(prevEle) : null;
    }

    $(expr) {
        const target = this.ele.querySelector(expr);
        return target ? createXEle(target) : null;
    }

    all(expr) {
        return Array.from(this.ele.children).map(e => {
            return createXEle(e);
        })
    }

    is(expr) {
        return meetsEle(this.ele, expr)
    }

    attr(...args) {
        let [key, value] = args;

        let { ele } = this;

        if (args.length == 1) {
            if (key instanceof Object) {
                Object.keys(key).forEach(k => {
                    ele.setAttribute(k, key[k]);
                });
            }
            return ele.getAttribute(key);
        }

        ele.setAttribute(key, value);
    }

    siblings(expr) {
        // 获取相邻元素
        let parChilds = Array.from(this.parent.ele.children);

        // 删除自身
        let tarId = parChilds.indexOf(this.ele);
        parChilds.splice(tarId, 1);

        // 删除不符合规定的
        if (expr) {
            parChilds = parChilds.filter(e => {
                if (meetsEle(e, expr)) {
                    return true;
                }
            });
        }

        return parChilds.map(e => createXEle(e));
    }

    parents(expr, until) {
        let pars = [];
        let tempTar = this.parent;

        if (!expr) {
            while (tempTar) {
                pars.push(tempTar);
                tempTar = tempTar.parent;
            }
        } else {
            if (getType(expr) == "string") {
                while (tempTar && tempTar) {
                    if (meetsEle(tempTar.ele, expr)) {
                        pars.push(tempTar);
                    }
                    tempTar = tempTar.parent;
                }
            }
        }

        if (until) {
            if (until instanceof XEle) {
                let newPars = [];
                pars.some(e => {
                    if (e === until) {
                        return true;
                    }
                    newPars.push(e);
                });
                pars = newPars;
            } else if (getType(until) == "string") {
                let newPars = [];
                pars.some(e => {
                    if (e.is(until)) {
                        return true;
                    }
                    newPars.push(e);
                });
                pars = newPars;
            }
        }

        return pars;
    }

    clone() {
        let cloneEle = createXEle(this.ele.cloneNode(true));

        // 数据重新设置
        Object.keys(this).forEach(key => {
            if (key !== "tag") {
                cloneEle[key] = this[key];
            }
        });

        return cloneEle;
    }
}

// 允许被设置的key值
defineProperties(XEle.prototype, {
    [CANSETKEYS]: {
        // writable: true,
        value: new Set(xEleDefaultSetKeys)
    }
});

// input元素有专用的渲染字段
const renderInput = (xele) => {
    let type = xele.attr("type") || "text";
    const { ele } = xele;

    let d_opts = {
        type: {
            enumerable: true,
            get: () => type
        },
        name: {
            enumerable: true,
            get: () => ele.name
        },
        value: {
            enumerable: true,
            get() {
                return ele.value;
            },
            set(val) {
                ele.value = val;
            }
        },
        disabled: {
            enumerable: true,
            get() {
                return ele.disabled;
            },
            set(val) {
                ele.disabled = val;
            }
        },
        [CANSETKEYS]: {
            value: new Set(["value", "disabled", ...xEleDefaultSetKeys])
        }
    };

    // 根据类型进行设置
    switch (type) {
        case "radio":
        case "checkbox":
            Object.assign(d_opts, {
                checked: {
                    enumerable: true,
                    get() {
                        return ele.checked;
                    },
                    set(val) {
                        ele.checked = val;
                    }
                },
                name: {
                    enumerable: true,
                    get() {
                        return ele.name;
                    }
                }
            });

            xele.on("change", e => {
                emitUpdate(xele, {
                    xid: xele.xid,
                    name: "setData",
                    args: ["checked", ele.checked]
                });
            });

            d_opts[CANSETKEYS].value.add("checked");
            break;
        case "file":
            Object.assign(d_opts, {
                accept: {
                    enumerable: true,
                    get() {
                        return ele.accept;
                    }
                }
            });
            break;
        case "text":
        default:
            xele.on("input", e => {
                // 改动冒泡
                emitUpdate(xele, {
                    xid: xele.xid,
                    name: "setData",
                    args: ["value", ele.value]
                });
            });
            break;
    }

    defineProperties(xele, d_opts);
}