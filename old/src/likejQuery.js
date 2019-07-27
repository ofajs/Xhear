defineProperties(XhearElementFn, {
    display: {
        get() {
            return getComputedStyle(this.ele)['display'];
        },
        set(val) {
            this.ele.style['display'] = val;
        }
    },
    text: {
        get() {
            return getContentEle(this.ele).textContent;
        },
        set(d) {
            getContentEle(this.ele).textContent = d;
        }
    },
    html: {
        get() {
            return getContentEle(this.ele).innerHTML;
        },
        set(d) {
            getContentEle(this.ele).innerHTML = d;
        }
    },
    style: {
        get() {
            return this.ele.style;
        },
        set(d) {
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

            assign(style, d);
        }
    },
    css: {
        get() {
            return getComputedStyle(this.ele);
        }
    },
    position: {
        get() {
            return {
                top: this.ele.offsetTop,
                left: this.ele.offsetLeft
            };
        }
    },
    offset: {
        get() {
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
    },
    width: {
        get() {
            return parseInt(getComputedStyle(this.ele).width);
        }
    },
    height: {
        get() {
            return parseInt(getComputedStyle(this.ele).height);
        }
    },
    innerWidth: {
        get() {
            return this.ele.clientWidth;
        }
    },
    innerHeight: {
        get() {
            return this.ele.clientHeight;
        }
    },
    offsetWidth: {
        get() {
            return this.ele.offsetWidth;
        }
    },
    offsetHeight: {
        get() {
            return this.ele.offsetHeight;
        }
    },
    outerWidth: {
        get() {
            let tarSty = getComputedStyle(this.ele);
            return this.ele.offsetWidth + parseInt(tarSty['margin-left']) + parseInt(tarSty['margin-right']);
        }
    },
    outerHeight: {
        get() {
            let tarSty = getComputedStyle(this.ele);
            return this.ele.offsetHeight + parseInt(tarSty['margin-top']) + parseInt(tarSty['margin-bottom']);
        }
    }
});

// 模拟类jQuery的方法
setNotEnumer(XhearElementFn, {
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

        return parChilds.map(e => createXHearElement(e));
    },
    remove() {
        if (/\D/.test(this.hostkey)) {
            console.error(`can't delete this key => ${this.hostkey}`, this, data);
            throw "";
        }
        this.parent.splice(this.hostkey, 1);
    },
    empty() {
        // this.html = "";
        this.splice(0, this.length);
        return this;
    },
    parents(expr) {
        let pars = [];
        let tempTar = this.parent;

        if (!expr) {
            while (tempTar && tempTar.tag != "html") {
                pars.push(tempTar);
                tempTar = tempTar.parent;
            }
        } else {
            if (getType(expr) == "string") {
                while (tempTar && tempTar.tag != "html") {
                    if (meetsEle(tempTar.ele, expr)) {
                        pars.push(tempTar);
                    }
                    tempTar = tempTar.parent;
                }
            } else {
                if (expr instanceof XhearElement) {
                    expr = expr.ele;
                }

                // 从属 element
                if (expr instanceof Element) {
                    while (tempTar && tempTar.tag != "html") {
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
    },
    parentsUntil(expr) {
        if (expr) {
            let tempTar = this.parent;
            while (tempTar && tempTar.tag != "html") {
                if (meetsEle(tempTar.ele, expr)) {
                    return tempTar;
                }
                tempTar = tempTar.parent;
            }
        }
    },
    attr(key, value) {
        if (!isUndefined(value)) {
            if (this.xvRender) {
                let regTagData = regDatabase.get(this.tag);
                if (regTagData.attrs.includes(key)) {
                    this[key] = value;
                }
            }
            this.ele.setAttribute(key, value);
        } else if (key instanceof Object) {
            Object.keys(key).forEach(k => {
                this.attr(k, key[k]);
            });
        } else {
            return this.ele.getAttribute(key);
        }
    },
    removeAttr(key) {
        this.ele.removeAttribute(key);
        return this;
    },
    is(expr) {
        return meetsEle(this.ele, expr)
    },
    clone() {
        return $(this.ele.cloneNode(true));
    },
    // like jQuery function find
    que(expr) {
        return $.que(expr, this.ele);
    },
    queAll(expr) {
        return $.queAll(expr, this.ele);
    },
    queAllShadow(expr) {
        let {
            xvRender
        } = this;

        if (xvRender) {
            let tars = this.ele.querySelectorAll(expr);
            tars = Array.from(tars).filter(ele => {
                let shadowId = ele.getAttribute('xv-shadow');
                if (shadowId == xvRender) {
                    return true;
                }
            });
            return tars.map(e => createXHearElement(e));
        } else {
            throw `it's must render element`;
        }
    },
    queShadow(expr) {
        return this.queAllShadow(expr)[0];
    }
});