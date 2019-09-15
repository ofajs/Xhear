// 可setData的key
const CANSETKEYS = Symbol("cansetkeys");
const ORIEVE = Symbol("orignEvents");

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
const UnSetKeys = new Set(["parent", "index", "slot"]);

const XDataSetData = XData.prototype.setData;

class XhearEle extends XData {
    constructor(ele) {
        super({});
        delete this.parent;
        delete this.index;
        delete this.length;
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
            [ORIEVE]: {
                writable: true,
                // value: new Map()
                value: ""
            }
            // [CANSETKEYS]: {
            //     value: new Set([])
            // }
        });
    }

    get parent() {
        let { parentNode } = this.ele;
        if (parentNode instanceof DocumentFragment) {
            return;
        }
        return (!parentNode || parentNode === document) ? null : createXhearEle(parentNode);
    }

    get index() {
        let { ele } = this;
        return Array.from(ele.parentNode.children).indexOf(ele);
    }

    get length() {
        return this.ele.children.length;
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

        let _this = this[XDATASELF];

        if (/^_.+/.test(key)) {
            Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                value
            })
            return true;
        }

        // 只有在允许列表里才能进行set操作
        let canSetKey = this[CANSETKEYS];
        if (xEleDefaultSetKeys.has(key)) {
            // 直接设置
            _this[key] = value;
            return true;
        } else if ((canSetKey && canSetKey.has(key)) || /^_.+/.test(key)) {
            // 直接走xdata的逻辑
            return XDataSetData.call(_this, key, value);
        } else if (!/\D/.test(key)) {
            let xele = $(value);

            let targetChild = _this.ele.children[key];
            let oldVal = _this.getData(key).object;

            // 这里还欠缺冒泡机制的
            if (targetChild) {
                _this.ele.insertBefore(xele.ele, targetChild);
                _this.ele.removeChild(targetChild);

                // 冒泡设置
                emitUpdate(_this, "setData", [key, value], {
                    oldValue: oldVal
                });
            } else {
                _this.ele.appendChild(xele.ele);
            }
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
            this.ele.setAttribute(key, value);
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

    que(expr) {
        let tar = this.ele.querySelector(expr);
        if (tar) {
            return createXhearEle(tar);
        }
    }

    queAll(expr) {
        return queAllToArray(this.ele, expr).map(tar => createXhearEle(tar));
    }

    queShadow(expr) {
        let { shadowRoot } = this.ele;
        if (shadowRoot) {
            let tar = shadowRoot.querySelector(expr);
            if (tar) {
                return createXhearEle(tar);
            }
        } else {
            throw {
                target: this,
                msg: `it must be a customElement`
            };
        }
    }

    queAllShadow(expr) {
        let { shadowRoot } = this.ele;
        if (shadowRoot) {
            return queAllToArray(shadowRoot, expr).map(tar => createXhearEle(tar));
        } else {
            throw {
                target: this,
                msg: `it must be a customElement`
            };
        }
    }

    // 根据xv-vd生成xdata实例
    viewData() {
        let xdata = createXData({});

        // 获取所有toData元素
        this.queAll('[xv-vd]').forEach(xele => {
            // 获取vd内容
            let vdvalue = xele.attr('xv-vd');

            if (xele.xvele) {
                let syncObj = {};

                if (/ to /.test(vdvalue)) {
                    // 获取分组
                    let vGroup = vdvalue.split(",");
                    vGroup.forEach(g => {
                        // 拆分 to 两边的值
                        let toGroup = g.split("to");
                        if (toGroup.length == 2) {
                            let key = toGroup[0].trim();
                            let toKey = toGroup[1].trim();
                            xdata[toKey] = xele[key];
                            syncObj[toKey] = key;
                        }
                    });
                } else {
                    vdvalue = vdvalue.trim();
                    // 设置同步数据
                    xdata[vdvalue] = xele.value;
                    syncObj[vdvalue] = "value";
                }

                // 数据同步
                xdata.sync(xele, syncObj);
            } else {
                // 普通元素
                let {
                    ele
                } = xele;

                if ('checked' in ele) {
                    // 设定值
                    xdata[vd] = ele.checked;

                    // 修正Input
                    xdata.watch(vd, e => {
                        ele.checked = xdata[vd];
                    });
                    ele.addEventListener("change", e => {
                        xdata[vd] = ele.checked;
                    });
                } else {
                    // 设定值
                    xdata[vd] = ele.value;

                    // 修正Input
                    xdata.watch(vd, e => {
                        ele.value = xdata[vd];
                    });
                    ele.addEventListener("change", e => {
                        xdata[vd] = ele.value;
                    });
                    ele.addEventListener("input", e => {
                        xdata[vd] = ele.value;
                    });
                }
            }

            xele.removeAttr("xv-vd");
        });

        return xdata;
    }
    extend(proto) {
        Object.keys(proto).forEach(k => {
            // 获取描述
            let {
                get,
                set,
                value
            } = Object.getOwnPropertyDescriptor(proto, k);

            if (value) {
                Object.defineProperty(this, k, {
                    value
                });
            } else {
                Object.defineProperty(this, k, {
                    get,
                    set
                });
            }
        });
        return this;
    }
}

const XhearEleFn = XhearEle.prototype;