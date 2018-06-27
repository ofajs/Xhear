// 数据绑定Class
let XData = function () {
    defineProperty(this, SWATCH, {
        value: {}
    });
    defineProperty(this, SWATCHGET, {
        value: {}
    });
    defineProperty(this, OBSERVERKEYS, {
        value: []
    });
}

// 获取监听对象数组
const getWatchObj = (d, k, sName = SWATCH) => d[sName] && (d[sName][k] || (d[sName][k] = []));

const watchGetter = (host, k, func) => {
    getWatchObj(host, k).push(func);
}

// 触发改动监听
const emitChange = (tar, key, val, oldVal, type = "update") => {
    // 触发watch事件
    (type === "update") && each(getWatchObj(tar, key), callFunc => {
        callFunc(val, oldVal);
    });

    // 触发观察
    each(tar[OBSERVERKEYS], callFunc => {
        callFunc({
            name: key,
            type,
            oldVal,
            val
        });
    });
};

let XDataFn = {
    watch(k, func) {
        switch (getType(k)) {
            case "string":
                getWatchObj(this, k).push(func);
                break;
            case "object":
                for (let i in k) {
                    this.watch(i, k[i]);
                }
                break;
        }
    },
    unwatch(k, func) {
        if (k && func) {
            let tars = getWatchObj(this, k);
            // 查找到函数就去掉
            let id = tars.indexOf(func);
            tars.splice(id, 1);
        }
    },
    set(key, value) {
        switch (getType(key)) {
            case "object":
                for (let i in key) {
                    this.set(i, key[i]);
                }
                return;
            case "array":
                each(key, k => this.set(k));
                return;
        }

        // 寄放处
        let oriValue = value;

        // 定义函数
        defineProperty(this, key, {
            enumerable: true,
            get() {
                // get操作频繁，比重建数组的each快
                getWatchObj(this, key, SWATCHGET).forEach(callFunc => {
                    callFunc(oriValue);
                });
                return oriValue;
            },
            set(d) {
                let oldVal = oriValue;
                oriValue = d;

                // 防止重复值触发改动
                if (oldVal !== d) {
                    emitChange(this, key, d, oldVal);
                }
            }
        });

        emitChange(this, key, value, undefined, "new");

        // 设置值
        this[key] = value;
    },
    // 观察
    observe(callback) {
        callback && this[OBSERVERKEYS].push(callback);
        return this;
    },
    // 取消观察
    unobserve(callback) {
        if (callback) {
            let arr = this[OBSERVERKEYS];
            let id = arr.indexOf(callback);
            if (id > -1) {
                arr.splice(id, 1);
            }
        }
        return this;
    },
    // 覆盖对象数据
    cover(obj) {
        for (let k in obj) {
            if (k in this) {
                this[k] = obj[k];
            }
        }
        return this;
    }
};

let XDataFnDefineObj = {};
for (let k in XDataFn) {
    XDataFnDefineObj[k] = {
        value: XDataFn[k]
    }
}
defineProperties(XData.prototype, XDataFnDefineObj);

// 直接生成
$.xdata = function (obj, options) {
    // 生成对象
    let xd = new XData();

    // 注册keys
    // xd.set(Object.keys(obj));

    // 设置数据
    // xd.cover(obj);

    xd.set(obj);

    return xd;
}