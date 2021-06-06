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
const xEleDefaultSetKeys = ["text", "html", "display", "style"];
const CANSETKEYS = Symbol("cansetkeys");

class XEle extends XData {
    constructor(ele) {
        super(Object.assign({
            tag: ele.tagName.toLowerCase()
        }, XEleHandler));

        const self = this[XDATASELF];

        defineProperties(self, {
            ele: {
                get: () => ele
            },
            [EVENTS]: {
                writable: true,
                value: ""
            },
            // 允许被设置的key值
            [CANSETKEYS]: {
                value: new Set(xEleDefaultSetKeys)
            }
        });

        delete self.length;
    }

    setData(key, value) {
        if (!this[CANSETKEYS] || this[CANSETKEYS].has(key)) {
            return xSetData.call(this, key, value);
        }
    }

    get parent() {
        let { parentNode } = this.ele;
        return (!parentNode || parentNode === document) ? null : createXEle(parentNode);
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

    get display() {
        return getComputedStyle(this.ele)['display'];
    }

    set display(val) {
        this.ele.style['display'] = val;
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

    $(expr) {
        return createXEle(this.ele.querySelector(expr));
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
            if (until instanceof XhearEle) {
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