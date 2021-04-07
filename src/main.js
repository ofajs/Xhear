// 可setData的key
const CANSETKEYS = Symbol("cansetkeys");
const ORIEVE = Symbol("orignEvents");

// 可直接设置的Key
const xEleDefaultSetKeys = new Set(["text", "html", "display", "style"]);

// 可直接设置的Key并且能冒泡（在普通元素下，非组件）
// const xEleDefaultSetKeysCanUpdate = new Set(["text", "html"]);

// 不可设置的key
// const UnSetKeys = new Set(["parent", "index", "slot"]);
const UnSetKeys = new Set(["parent", "slot"]);

const XDataSetData = XData.prototype.setData;

class XhearEle extends XData {
    constructor(ele) {
        super({});
        delete this.parent;
        delete this.index;
        delete this.length;
        Object.defineProperties(ele, {
            __xhear__: {
                value: this,
                configurable: true
            }
        });
        let tagValue = ele.tagName ? ele.tagName.toLowerCase() : '';
        Object.defineProperties(this, {
            tag: {
                enumerable: true,
                value: tagValue
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
        // if (parentNode instanceof DocumentFragment) {
        //     return;
        // }
        return (!parentNode || parentNode === document) ? null : createXhearProxy(parentNode);
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

    get $shadow() {
        let { shadowRoot } = this.ele;
        return shadowRoot && createXhearProxy(shadowRoot);
    }

    get $root() {
        let root = this.ele;
        while (root.parentNode) {
            root = root.parentNode;
        }
        return root && createXhearProxy(root);
    }

    get $host() {
        let { $root } = this;
        return $root && $root.ele.host && createXhearProxy($root.ele.host);
    }

    get attrs() {
        return createProxyAttrs(this.ele);
    }

    // 监听指定元素的变动
    moni(queStr, func) {
        let olds;
        this.watch(() => {
            let eles = this.all(queStr);
            let isSame = true;

            // 确保数据一致
            if (olds && olds.length == eles.length) {
                eles.some(e => {
                    if (!olds.includes(e)) {
                        isSame = false;
                        return true;
                    }
                });
            } else {
                isSame = false;
            }

            if (isSame) {
                return;
            }

            let obj = {
                old: olds,
                val: eles
            };

            olds = eles;

            func(eles, obj);
        }, true);
    }


    setData(key, value) {
        if (UnSetKeys.has(key)) {
            console.warn(`can't set this key => `, key);
            return false;
        }

        key = attrToProp(key);

        let _this = this[XDATASELF];

        // 只有在允许列表里才能进行set操作
        let canSetKey = this[CANSETKEYS];
        if (xEleDefaultSetKeys.has(key)) {

            let descriptor = getOwnPropertyDescriptor(_this, key);

            if (!descriptor || !descriptor.set) {
                // 直接设置
                _this[key] = value;
            } else {
                descriptor.set.call(this[PROXYTHIS], value);
            }

            // if (xEleDefaultSetKeysCanUpdate.has(key)) {
            //     emitUpdate(_this, "setData", [key, value], {
            //         oldValue: oldVal
            //     });
            // }
            return true;
        } else if ((canSetKey && canSetKey.has(key)) || /^_.+/.test(key)) {
            // 直接走xdata的逻辑
            return XDataSetData.call(_this, key, value);
        } else if (!/\D/.test(key)) {
            let xele = $(value);

            let targetChild = _this.ele.children[key];

            // 这里还欠缺冒泡机制的
            if (targetChild) {
                let oldVal = _this.getData(key).object;

                _this.ele.insertBefore(xele.ele, targetChild);
                _this.ele.removeChild(targetChild);

                // 冒泡设置
                emitUpdate(_this, "setData", [key, value], {
                    oldValue: oldVal
                });
            } else {
                _this.ele.appendChild(xele.ele);

                // 冒泡设置
                emitUpdate(_this, "setData", [key, value], {
                    oldValue: undefined
                });
            }
        }

        return true;
    }

    getData(key) {
        key = attrToProp(key);

        let _this = this[XDATASELF];

        let target;

        if (!/\D/.test(key)) {
            // 纯数字，直接获取children
            target = _this.ele.children[key];
            target && (target = createXhearProxy(target));
        } else {
            let descriptor = getOwnPropertyDescriptor(_this, key);

            if (!descriptor) {
                target = _this[key];
            } else {
                let { get, value } = descriptor;
                if (!isUndefined(value)) {
                    target = value;
                } else if (get) {
                    target = get.call(this[PROXYTHIS], key);
                }
            }

            // target = _this[key];
        }

        if (target instanceof XData) {
            target = target[PROXYTHIS];
        }

        return target;
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

        return parChilds.map(e => createXhearProxy(e));
    }

    empty() {
        this.splice(0, this.length);
        return this;
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

    is(expr) {
        return meetsEle(this.ele, expr)
    }

    $(expr) {
        let tar = this.ele.querySelector(expr);
        if (tar) {
            return createXhearProxy(tar);
        }
    }

    all(expr) {
        return queAllToArray(this.ele, expr).map(tar => createXhearProxy(tar));
    }

    clone() {
        let cloneEle = createXhearProxy(this.ele.cloneNode(true));

        // 数据重新设置
        Object.keys(this).forEach(key => {
            if (key !== "tag") {
                cloneEle[key] = this[key];
            }
        });

        return cloneEle;
    }

    // extend(proto) {
    //     Object.keys(proto).forEach(k => {
    //         // 获取描述
    //         let {
    //             get,
    //             set,
    //             value
    //         } = getOwnPropertyDescriptor(proto, k);

    //         if (value) {
    //             if (this.hasOwnProperty(k)) {
    //                 this[k] = value;
    //             } else {
    //                 Object.defineProperty(this, k, {
    //                     value
    //                 });
    //             }
    //         } else {
    //             // debugger
    //             // get && (get = get.bind(this))

    //             Object.defineProperty(this, k, {
    //                 get,
    //                 set
    //             });

    //             if (set) {
    //                 // 添加到可设置key权限内
    //                 xEleDefaultSetKeys.add(k);
    //             }
    //         }
    //     });
    //     return this;
    // }

    getTarget(keys) {
        let target = this;
        if (keys.length) {
            keys.some(k => {
                if (!target) {
                    console.warn("getTarget failure");
                    return true;
                }
                target = target[k];

                if (target._fakeWrapper) {
                    target = target._fakeWrapper;
                    // debugger
                }
            });
        }
        return target;
    }
}

const XhearEleFn = XhearEle.prototype;