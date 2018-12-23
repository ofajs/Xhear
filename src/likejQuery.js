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