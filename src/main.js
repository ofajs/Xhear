// 可setData的key
const CANSETKEYS = Symbol("cansetkeys");

// 将 element attribute 横杠转换为大小写模式
const attrToProp = key => {
    // 判断是否有横线
    if (/\-/.test(key)) {
        key = key.replace(/\-[\D]/g, (letter) => letter.substr(1).toUpperCase());
    }
    return key;
}
const propToAttr = key => {
    if (/[A-Z]/.test(key)) {
        key = key.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
    }
    return key;
}

// 可直接设置的Key
const xEleDefaultSetKeys = new Set(["text", "html", "display", "style"]);

// 不可设置的key
const UnSetKeys = new Set(["parent", "index"]);

const XDataSetData = XData.prototype.setData;

class XhearEle extends XData {
    constructor(ele) {
        super({});
        delete this.parent;
        delete this.index;
        Object.defineProperties(ele, {
            __xhear__: {
                value: this
            }
        });
        Object.defineProperties(this, {
            tag: {
                enumerable: true,
                value: ele.tagName.toLowerCase()
            },
            ele: {
                value: ele
            },
            // [CANSETKEYS]: {
            //     value: new Set([])
            // }
        });
    }

    get parent() {
        let { parentNode } = this.ele;
        return (!parentNode || parentNode === document) ? null : createXhearEle(parentNode);
    }

    get class() {
        return this.ele.classList;
    }

    get data() {
        return this.ele.dataset;
    }

    get index() {
        let { ele } = this;
        return Array.from(ele.parentNode.children).indexOf(ele);
    }

    get css() {
        return getComputedStyle(this.ele);
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

    get text() {
        return this.ele.innerText;
    }

    set text(val) {
        this.ele.innerText = val;
    }

    get html() {
        return this.ele.innerHTML;
    }

    set html(val) {
        this.ele.innerHTML = val;
    }

    get display() {
        return getComputedStyle(this.ele)['display'];
    }

    set display(val) {
        this.ele.style['display'] = val;
    }

    get style() {
        return this.ele.style;
    }

    set style(d) {
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

    setData(key, value) {
        if (UnSetKeys.has(key)) {
            console.warn(`can't set this key => `, key);
            return false;
        }

        key = attrToProp(key);

        // 只有在允许列表里才能进行set操作
        let canSetKeys = this[CANSETKEYS];
        if (xEleDefaultSetKeys.has(key)) {
            // 直接设置
            this[XDATASELF][key] = value;
            return true;
        } else if (!/\D/.test(key)) {
            let xele = $(value);

            let targetChild = this.ele.children[key];

            // 这里还欠缺冒泡机制的
            if (targetChild) {
                this.ele.insertBefore(xele.ele, targetChild);
                this.ele.removeChild(targetChild);
            } else {
                this.ele.appendChild(xele.ele);
            }
        } else if (canSetKeys && canSetKeys.has(key)) {
            // 直接走xdata的逻辑
            return XDataSetData.call(this, key, value);
        }

        return false;
    }

    getData(key) {
        key = attrToProp(key);

        let _this = this[XDATASELF];

        let target;

        if (!/\D/.test(key)) {
            // 纯数字，直接获取children
            target = _this.ele.children[key];
            target && (target = createXhearEle(target));
        } else {
            target = _this[key];
        }

        if (target instanceof XData) {
            target = target[PROXYTHIS];
        }

        return target;
    }

    siblings(expr) {
        // 获取父层的所有子元素
        let parChilds = Array.from(this.ele.parentElement.children);

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

        return parChilds.map(e => createXhearEle(e));
    }

    empty() {
        this.splice(0, this.length);
        return this;
    }

    parents(expr) {
        let pars = [];
        let tempTar = this.parent;

        if (!expr) {
            while (tempTar) {
                pars.push(tempTar);
                tempTar = tempTar.parent;
            }
        } else {
            if (getType(expr) == "string") {
                while (tempTar) {
                    if (meetsEle(tempTar.ele, expr)) {
                        pars.push(tempTar);
                    }
                    tempTar = tempTar.parent;
                }
            } else {
                if (expr instanceof XhearEle) {
                    expr = expr.ele;
                }

                // 从属 element
                if (expr instanceof Element) {
                    while (tempTar) {
                        if (tempTar.ele == expr) {
                            return true;
                        }
                        tempTar = tempTar.parent;
                    }
                }

                return false;
            }
        }

        return pars;
    }

    is(expr) {
        return meetsEle(this.ele, expr)
    }

    attr(key, value) {
        if (!isUndefined(value)) {
            if (this.xvRender) {
                let regTagData = regDatabase.get(this.tag);
                if (regTagData.attrs.includes(key)) {
                    this[key] = value;
                }
            } else {
                this.ele.setAttribute(key, value);
            }
        } else if (key instanceof Object) {
            Object.keys(key).forEach(k => {
                this.attr(k, key[k]);
            });
        } else {
            return this.ele.getAttribute(key);
        }
    }

    removeAttr(key) {
        this.ele.removeAttribute(key);
        return this;
    }
}

window.XhearEle = XhearEle;