// 数据绑定Class
let XData = function () {
    defineProperty(this, SWATCH, {
        value: {}
    });
    defineProperty(this, OBSERVERKEYS, {
        value: []
    });
}

let getWatchObj = (d, k) => d[SWATCH] && (d[SWATCH][k] || (d[SWATCH][k] = []));

defineProperties(XData.prototype, {
    watch: {
        value(k, func) {
            switch (getType(k)) {
                case "string":
                    let tars = getWatchObj(this, k);
                    tars && tars.push(func);
                    break;
                case "object":
                    for (let i in k) {
                        this.watch(i, k[i]);
                    }
                    break;
            }
        }
    },
    unwatch: {
        value(k, func) {
            if (k && func) {
                let tars = getWatchObj(this, k);
                // 查找到函数就去掉
                let id = tars.indexOf(func);
                tars.splice(id, 1);
            }
        }
    },
    set: {
        value(key, value) {
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
            let oriValue;

            // 定义函数
            defineProperty(this, key, {
                enumerable: true,
                get() {
                    return oriValue;
                },
                set(d) {
                    let oldVal = oriValue;
                    oriValue = d;

                    // 防止重复值触发改动
                    if (oldVal === d) {
                        return;
                    }

                    // 触发watch事件
                    each(getWatchObj(this, key), callFunc => {
                        callFunc(oriValue, oldVal);
                    });

                    // 触发观察
                    each(this[OBSERVERKEYS], callFunc => {
                        callFunc({
                            name: key,
                            type: "update",
                            oldVal,
                            val: d
                        });
                    });
                }
            });

            // 设置值
            this[key] = value;
        }
    },
    // 观察
    observe: {
        value(callback) {
            callback && this[OBSERVERKEYS].push(callback);
            return this;
        }
    },
    // 取消观察
    unobserve: {
        value(callback) {
            if (callback) {
                let arr = this[OBSERVERKEYS];
                let id = arr.indexOf(callback);
                if (id > -1) {
                    arr.splice(id, 1);
                }
            }
            return this;
        }
    },
    // 覆盖对象数据
    cover: {
        value(obj) {
            for (let k in obj) {
                if (k in this) {
                    this[k] = obj[k];
                }
            }
            return this;
        }
    }
});

// 直接生成
$.xdata = function (obj, options) {
    // 生成对象
    let xd = new XData();

    // 注册keys
    xd.set(Object.keys(obj));

    // 设置数据
    xd.cover(obj);

    return xd;
}