// 因为表单太常用了，将表单组件进行规范
// input元素有专用的渲染字段
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
                return ele.value;
            },
            set(val) {
                ele.value = val;
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
        [CANSETKEYS]: {
            value: new Set(["value", "disabled", ...xEleDefaultSetKeys])
        }
    };

    if (ele.contentEditable == "true") {
        d_opts.value = {
            enumerable: true,
            get() {
                return ele.innerHTML;
            },
            set(val) {
                ele.innerHTML = val;
            }
        };
    }

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

// extend(XEle.prototype, {
//     // 专门用于表单的组件
//     form(opts) {
//         const defs = {

//         };
//         debugger
//     }
// });