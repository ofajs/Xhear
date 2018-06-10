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

// 同步数据的方法
$.syncData = (...args) => {
    let computedKeys = [];
    each(args, d => {
        if (d instanceof XData) {
            for (let k in d) {
                // 查找到就下一个
                if (computedKeys.indexOf(k) > -1) {
                    continue;
                }

                // 需要绑定的参数数组
                let needBridgeObj = [{
                    tar: d,
                    key: k
                }];

                // 遍历查找是否有相同key的XData
                each(args, e2 => {
                    if (e2 !== d && k in e2) {
                        needBridgeObj.push({
                            tar: e2,
                            key: k
                        });
                    }
                });

                if (1 in needBridgeObj) {
                    // 绑定数据
                    bridge(...needBridgeObj);
                }

                // 加入已完成列表
                computedKeys.push(k);
            }
        }
    });
}

let XDataFn = {};

let XData = $.XData = function (obj) {
    defineProperty(this, SWATCH, {
        value: {}
    });
    // 内部用的watch
    defineProperty(this, SWATCHORI, {
        value: {}
    });
    this.set(obj);
}

each(['watch', 'unwatch', 'set'], fName => {
    defineProperty(XDataFn, fName, {
        value: ShearFn[fName]
    });
});

defineProperty(XDataFn, "cover", {
    value(obj) {
        for (let k in obj) {
            this[k] = obj[k];
        }
    }
});

XData.prototype = XDataFn;