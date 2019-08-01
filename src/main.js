const CANSETKEYS = Symbol("cansetkeys");

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

    setData(key, value) {
        // 只有在允许列表里才能进行set操作
        let canSetKeys = this[CANSETKEYS];
        if (canSetKeys && canSetKeys.has(key)) {
            return XDataSetData.call(this, key, value);
        }

        return false;
    }

    getData(key) {
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