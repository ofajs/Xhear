function XhearElement(ele) {
    defineProperties(this, {
        tag: {
            enumerable: true,
            value: ele.tagName.toLowerCase()
        },
        ele: {
            value: ele
        }
    });
    let opt = {
        // status: "root",
        // 设置数组长度
        // length,
        // 事件寄宿对象
        [EVES]: new Map(),
        // modifyId存放寄宿对象
        [MODIFYIDHOST]: new Set(),
        // modifyId清理器的断定变量
        [MODIFYTIMER]: 0,
        // watch寄宿对象
        [WATCHHOST]: new Map(),
        // 同步数据寄宿对象
        [SYNCHOST]: new Map(),
        // ------下面是XhearElement新增的------
        // 实体事件函数寄存
        [XHEAREVENT]: {},
        [EXKEYS]: new Set()
    };

    // 设置不可枚举数据
    setNotEnumer(this, opt);

    // 返回代理后的数据对象
    return new Proxy(this, XhearElementHandler);
}
let XhearElementFn = XhearElement.prototype = Object.create(XDataFn);

const XhearElementHandler = {
    get(target, key, receiver) {
        // 判断是否纯数字
        if (/\D/.test(key)) {
            return Reflect.get(target, key, receiver);
        } else {
            let ele = getContentEle(receiver.ele).children[key];
            return ele && createXHearElement(ele);
        }
    },
    set(target, key, value, receiver) {
        return Reflect.set(target, key, value, receiver);
    }
};
// 关键keys
let importantKeys;
defineProperties(XhearElementFn, importantKeys = {
    hostkey: {
        get() {
            return Array.from(this.ele.parentElement.children).indexOf(this.ele);
        }
    },
    parent: {
        get() {
            let parentElement = getParentEle(this.ele);
            if (!parentElement) {
                return;
            }
            return createXHearElement(parentElement);
        }
    },
    // 是否注册的Xele
    xvele: {
        get() {
            let {
                attributes
            } = this.ele;

            return attributes.hasOwnProperty('xv-ele') || attributes.hasOwnProperty('xv-render');
        }
    },
    class: {
        get() {
            return this.ele.classList;
        }
    },
    object: {
        get() {
            let obj = {
                tag: this.tag
            };

            // 非xvele就保留class属性
            if (!this.xvRender) {
                let classValue = this.ele.classList.value;
                classValue && (obj.class = classValue);
            } else {
                // 获取自定义数据
                let exkeys = this[EXKEYS];
                exkeys && exkeys.forEach(k => {
                    obj[k] = this[k];
                });
            }

            // 自身的children加入
            this.forEach((e, i) => {
                if (e instanceof XhearElement) {
                    obj[i] = e.object;
                } else {
                    obj[i] = e;
                }
            });

            return obj;
        }
    },
    length: {
        get() {
            let contentEle = getContentEle(this.ele);
            return contentEle.children.length;
        }
    }
});
importantKeys = Object.keys(importantKeys);