// 因为表单太常用了，将表单组件进行规范
// 渲染表单元素的方法
const renderInput = (xele) => {
    let type = xele.attr("type") || "text";
    const { ele } = xele;

    let d_opts = {
        type: {
            enumerable: true,
            get: () => type
        },
        name: {
            enumerable: true,
            get: () => ele.name
        },
        value: {
            enumerable: true,
            get() {
                return ele.hasOwnProperty('__value') ? ele.__value : ele.value;
            },
            set(val) {
                // 针对可能输入的是数字被动转成字符
                ele.value = ele.__value = val;

                emitUpdate(xele, {
                    xid: xele.xid,
                    name: "setData",
                    args: ["value", val]
                });
            }
        },
        disabled: {
            enumerable: true,
            get() {
                return ele.disabled;
            },
            set(val) {
                ele.disabled = val;
            }
        },
        // 错误信息
        msg: {
            writable: true,
            value: null
        },
        [CANSETKEYS]: {
            value: new Set(["value", "disabled", "msg", ...xEleDefaultSetKeys])
        }
    };

    // 根据类型进行设置
    switch (type) {
        case "radio":
        case "checkbox":
            Object.assign(d_opts, {
                checked: {
                    enumerable: true,
                    get() {
                        return ele.checked;
                    },
                    set(val) {
                        ele.checked = val;
                    }
                },
                name: {
                    enumerable: true,
                    get() {
                        return ele.name;
                    }
                }
            });

            // 不赋予这个字段
            delete d_opts.msg;

            xele.on("change", e => {
                emitUpdate(xele, {
                    xid: xele.xid,
                    name: "setData",
                    args: ["checked", ele.checked]
                });
            });

            d_opts[CANSETKEYS].value.add("checked");
            break;
        case "file":
            Object.assign(d_opts, {
                accept: {
                    enumerable: true,
                    get() {
                        return ele.accept;
                    }
                }
            });
            break;
        case "text":
        default:
            xele.on("input", e => {
                delete ele.__value;

                // 改动冒泡
                emitUpdate(xele, {
                    xid: xele.xid,
                    name: "setData",
                    args: ["value", ele.value]
                });
            });
            break;
    }

    defineProperties(xele, d_opts);
}

class FromXData extends XData {
    constructor(obj, { selector, delay, _target }) {
        super(obj, "root");

        this._selector = selector;
        this._target = _target;
        this._delay = delay;

        let isInit = 0;

        let backupData;

        let watchFun = () => {
            const eles = this.eles();
            const obj = getFromEleData(eles, this);

            const objKeys = Object.keys(obj);
            Object.keys(this).filter(e => {
                return !objKeys.includes(e);
            }).forEach(k => {
                delete this[k];
            });

            Object.assign(this, obj);

            backupData = this.toJSON();

            if (!isInit) {
                return;
            }

            verifyFormEle(eles);
        }

        let timer;
        this._wid = _target.watch(() => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                watchFun();
            }, this._delay);
        });

        // 数据初始化
        watchFun();

        isInit = 1;

        // 反向数据绑定
        this.watchTick(e => {
            let data = this.toJSON();

            Object.entries(data).forEach(([k, value]) => {
                let oldVal = backupData[k];

                if (value !== oldVal || (typeof value == "object" && typeof oldVal == "object" && JSON.stringify(value) !== JSON.stringify(oldVal))) {
                    // 相应的元素
                    let targetEles = this.eles(k);

                    targetEles.forEach(ele => {
                        switch (ele.type) {
                            case "checkbox":
                                if (value.includes(ele.value)) {
                                    ele.checked = true;
                                } else {
                                    ele.checked = false;
                                }
                                break;
                            case "radio":
                                if (ele.value == value) {
                                    ele.checked = true;
                                } else {
                                    ele.checked = false;
                                }
                                break;
                            case "text":
                            default:
                                ele.value = value;
                                break;
                        }
                    });
                }
            });

            // 备份数据
            backupData = data;
        });
    }

    eles(propName) {
        let eles = this._target.all(this._selector)

        if (propName) {
            return eles.filter(e => e.name === propName);
        }

        return eles;
    }
}

// 从元素上获取表单数据
const getFromEleData = (eles, oldData) => {
    const obj = {};

    eles.forEach(ele => {
        const { name, type, value } = ele;

        switch (type) {
            case "radio":
                if (ele.checked) {
                    obj[name] = value;
                }
                break;
            case "checkbox":
                let tar_arr = obj[name] || ((obj[name] = oldData[name]) || (obj[name] = []));
                if (ele.checked) {
                    if (!tar_arr.includes(ele.value)) {
                        tar_arr.push(value);
                    }
                } else if (tar_arr.includes(ele.value)) {
                    // 包含就删除
                    tar_arr.splice(tar_arr.indexOf(ele.value), 1);
                }
                break;
            case "text":
            default:
                obj[name] = value;
        }
    });

    return obj;
}

// 验证表单元素
const verifyFormEle = (eles) => {
    // 重新跑一次验证
    eles.forEach(e => {
        const event = new CustomEvent("verify", {
            bubbles: false
        });
        event.msg = "";
        event.formData = this;
        event.$target = e;

        e.trigger(event);

        if (!e.hasOwnProperty("msg")) {
            return;
        }

        const { msg } = event;
        const msg_type = getType(msg);

        // msg只能是Error或字符串
        if (msg_type == "string") {
            e.msg = msg || null;
        } else if (msg_type == "error") {
            if (getType(e.msg) !== "error" || e.msg.message !== msg.message) {
                e.msg = msg;
            }
        } else {
            console.warn({
                target: e,
                msg,
                desc: `msg can only be Error or String`
            });
        }
    });
}

extend(XEle.prototype, {
    // 专门用于表单的插件
    form(opts) {
        const defs = {
            // 对表单元素进行修正
            selector: "input,textarea,select",
            delay: 100
        };

        if (getType(opts) === "string") {
            defs.selector = opts;
        } else {
            Object.assign(defs, opts);
        }

        // 主体返回对象
        const formdata = new FromXData({}, {
            selector: defs.selector,
            delay: defs.delay,
            _target: this
        });

        return formdata;
    }
});