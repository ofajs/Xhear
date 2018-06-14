const bridge = $.bridge = (...args) => {
    // 之前的值得
    let beforeOriVal;

    each(args, (options, i) => {
        let {
            tar,
            key
        } = options;

        if (options instanceof $) {
            tar = options;
            key = 'val';
        }

        tar.watch(key, (val, beforeVal, oriVal) => {
            if (beforeOriVal === oriVal) {
                return;
            }
            beforeOriVal = oriVal;
            each(args, opt => {
                let tar2, key2;

                if (opt instanceof $) {
                    tar2 = opt;
                    key2 = "val"
                } else {
                    tar2 = opt.tar;
                    key2 = opt.key;
                }


                if (tar !== tar2) {
                    if (key2 === "val") {
                        tar2.val(oriVal);
                    } else {
                        tar2[key2] = oriVal;
                    }
                }
            });
        });

        if (i == args.length - 1) {
            if (key === "val") {
                tar.val(tar.val());
            } else {
                tar[key] = tar[key];
            }
        }
    });
}

let XData = $.XData = function (obj) {
    defineProperty(this, SWATCH, {
        value: {}
    });
    defineProperty(this, OBSERVERKEYS, {
        value: []
    });
    obj && this.set(obj);
}

Object.defineProperties(XData.prototype, {
    watch: {
        value: ShearFn.watch
    },
    unwatch: {
        value: ShearFn.unwatch
    },
    set: {
        value: ShearFn.set
    },
    cover: {
        value(obj) {
            for (let k in obj) {
                this[k] = obj[k];
            }
            return this;
        }
    },
    // 观察
    observe: {
        value(callback) {
            this[OBSERVERKEYS].push(callback);
            return this;
        }
    },
    // 取消观察
    unobserve: {
        value(callback) {
            let arr = this[OBSERVERKEYS];
            let id = arr.indexOf(callback);
            if (id > -1) {
                arr.splice(id, 1);
            }
            return this;
        }
    },
    // 同步数据
    syncData: {
        value(dataObj, options, proprs) {
            switch (getType(options)) {
                case "string":
                    bridge({
                        tar: this,
                        key: options
                    }, {
                        tar: dataObj,
                        key: options
                    });
                    break;
                case "array":
                    each(options, k => {
                        bridge({
                            tar: this,
                            key: k
                        }, {
                            tar: dataObj,
                            key: k
                        });
                    });
                    break;
                case "objecy":
                    for (let k in options) {
                        bridge({
                            tar: this,
                            key: k
                        }, {
                            tar: dataObj,
                            key: options[k]
                        });
                    }
                    break;
                default:
                    for (let k in this) {
                        if (k in dataObj) {
                            bridge({
                                tar: this,
                                key: k
                            }, {
                                tar: dataObj,
                                key: k
                            });
                        }
                    }
            }
            return this;
        }
    },
    // 中转型绑定数据
    transData: {
        value(myKey, dataObj, dataObjKey, props) {
            // 两个值
            let beforeGetVal, beforeSetVal;

            // 转换get
            this.watch(myKey, (val, oldVal, oriVal) => {
                if (oriVal === beforeSetVal) {
                    return;
                }
                beforeGetVal = props.beforeGet(val);
                dataObj[dataObjKey] = beforeGetVal;
            });

            // 转换set
            dataObj.watch(dataObjKey, (val, oldVal, oriVal) => {
                if (oriVal === beforeGetVal) {
                    return;
                }
                beforeSetVal = props.beforeSet(val);
                this[myKey] = beforeSetVal;
            });
        }
    }
});