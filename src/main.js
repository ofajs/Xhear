const CANSETKEYS = Symbol("cansetkeys");

// 将 element attribute 横杠转换为大小写模式
const transAttrKey = key => {
    // 判断是否有横线
    if (/\-/.test(key)) {
        key = key.replace(/\-[\D]/, (letter) => letter.substr(1).toUpperCase());
    }
    return key;
}

const xEleKeys = new Set(["text", "html"]);

const XDataSetData = XData.prototype.setData;
class XhearElement extends XData {
    constructor(ele) {
        super({});
        delete this.parent;
        delete this.index;
        ele.__xhear__ = this;
        Object.defineProperties(this, {
            tag: {
                enumerable: true,
                value: ele.tagName.toLowerCase()
            },
            ele: {
                value: ele
            },
            // [CANSETKEYS]: {
            //     value: new Set(["haha"])
            // }
        });
    }

    get parent() {
        return (this.ele.parentNode === document) ? null : createXhearElement(this.ele.parentNode);
    }

    get index() {
        let { ele } = this;
        return Array.from(ele.parentNode.children).indexOf(ele);
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

    get data() {
        return this.ele.dataset;
    }

    setData(key, value) {
        key = transAttrKey(key);

        // 只有在允许列表里才能进行set操作
        let canSetKeys = this[CANSETKEYS];
        if (xEleKeys.has(key)) {
            // 直接设置
            this[XDATASELF][key] = value;
            return true;
        } else if (canSetKeys && canSetKeys.has(key)) {
            return XDataSetData.call(this, key, value);
        }

        return false;
    }

    getData(key) {
        key = transAttrKey(key);

        let target;

        if (!/\D/.test(key)) {
            // 纯数字，直接获取children
            target = this.ele.children[key];
            target = createXhearElement(target);
        } else {
            target = this[key];
        }

        if (target instanceof XData) {
            target = target[PROXYTHIS];
        }

        return target;
    }
}

window.XhearElement = XhearElement;