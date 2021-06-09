// 获取所有符合表达式的可渲染的元素
const getCanRenderEles = (root, expr) => {
    let arr = Array.from(root.querySelectorAll(expr))
    if (root instanceof Element && meetsEle(root, expr)) {
        arr.push(root);
    }
    return arr;
}

// 去除原元素并添加定位元素
const postionNode = e => {
    // let textnode = document.createTextNode("");
    let marker = new Comment("x-marker");

    let parent = e.parentNode;
    parent.insertBefore(marker, e);
    parent.removeChild(e);

    return {
        marker, parent
    };
}

// 将表达式转换为函数
const exprToFunc = expr => {
    return new Function("...$args", `
        const [$event] = $args;
        
        with(this){
            return ${expr};
        }
    `);
}

// 代理对象监听函数
// class WatchAgent {
//     constructor(xdata) {
//         if (xdata.__watchAgent) {
//             return xdata.__watchAgent;
//         }

//         // 互相绑定
//         this.xdata = xdata;
//         xdata.__watchAgent = this;

//         // 存储表达式对象
//         this.exprMap = new Map();
//     }

//     // 监听表达式变动
//     watchExpr(expr) {
//         debugger
//     }
// }

// 表达式到值的设置
const exprToSet = (xdata, host, expr, callback) => {
    // 即时运行的判断函数
    let runFunc;

    if (regIsFuncExpr.test(expr)) {
        // 属于函数
        runFunc = exprToFunc(expr).bind(xdata);
    } else {
        // 值变动
        runFunc = () => xdata[expr];
    }

    // 备份比较用的数据
    let backup_val, backup_ids;

    // 直接运行的渲染函数
    const watchFun = () => {
        const val = runFunc();

        if (isxdata(val)) {
            let ids = val.map(e => e ? e.xid : e).join(",");
            if (backup_ids !== ids) {
                callback(val);
                backup_ids = ids;
            }
        } else if (backup_val !== val) {
            callback(val);
            backup_val = val;
        }
    }

    // 先执行一次
    watchFun();

    // 需要监听的目标对象
    let targetData = xdata;

    if (host !== xdata) {
        // 属于fill 填充渲染
        if (expr.includes("$host")) {
            targetData = host;
        }
    }
    targetData.watchTick(watchFun);
}

const regIsFuncExpr = /[\(\)\;\.\=\>\<]/;

// 元素深度循环函数（包含自身）
const elementDeepEach = (ele, callback) => {
    // callback(ele);
    Array.from(ele.childNodes).forEach(target => {
        callback(target);

        if (target instanceof Element) {
            elementDeepEach(target, callback);
        }
    });
}

// 根据 if 语句，去除数据绑定关系
const removeElementBind = (target) => {
    elementDeepEach(target, ele => {
        if (ele) { }
        debugger
    });
}

// 渲染组件的逻辑
// host 主体组件元素；存放方法的主体
// xdata 渲染目标数据；单层渲染下是host，x-fill模式下是具体的数据
// content 渲染目标元素
const renderTemp = ({ host, xdata, content, temps }) => {
    // 事件绑定
    getCanRenderEles(content, "[x-on]").forEach(target => {
        let eventInfo = JSON.parse(target.getAttribute("x-on"));

        let eids = [];

        const $tar = createXEle(target);

        Object.keys(eventInfo).forEach(eventName => {
            let { name } = eventInfo[eventName];

            let eid;

            // 判断是否函数
            if (regIsFuncExpr.test(name)) {
                // 函数绑定
                const func = exprToFunc(name);
                eid = $tar.on(eventName, (event) => {
                    // func.call(host, event);
                    func.call(xdata, event);
                });
            } else {
                // 函数名绑定
                eid = $tar.on(eventName, (event) => {
                    // host[name] && host[name].call(host, event);
                    xdata[name] && xdata[name].call(xdata, event);
                });
            }

            eids.push(eid);
        });

        target.setAttribute("rendered-on", JSON.stringify(eids));
    });

    // 属性绑定
    getCanRenderEles(content, "[x-attr]").forEach(ele => {
        const attrData = JSON.parse(ele.getAttribute('x-attr'));

        Object.keys(attrData).forEach(attrName => {
            exprToSet(xdata, host, attrData[attrName], val => {
                ele.setAttribute(attrName, val);
            });
        })
    });

    getCanRenderEles(content, "[x-prop]").forEach(ele => {
        const propData = JSON.parse(ele.getAttribute('x-prop'));
        const xEle = createXEle(ele);

        Object.keys(propData).forEach(propName => {
            exprToSet(xdata, host, propData[propName], val => {
                xEle[propName] = val;
            });
        });
    });

    // if元素渲染
    getCanRenderEles(content, '[x-if]').forEach(ele => {
        const expr = ele.getAttribute('x-if');

        // 定位文本元素
        let { marker, parent } = postionNode(ele);

        // 生成的目标元素
        let targetEle = null;

        exprToSet(xdata, host, expr, val => {
            if (val && !targetEle) {
                // 添加元素
                targetEle = $(ele.content.children[0].outerHTML).ele;

                // parent.insertBefore(targetEle, marker);
                parent.replaceChild(targetEle, marker);

                // 重新渲染
                renderTemp({ host, xdata, content: targetEle, temps });
            } else if (targetEle) {
                // 去除数据绑定
                // removeElementBind(targetEle);

                // 删除元素
                // targetEle.parentNode.removeChild(targetEle);
                parent.replaceChild(marker, targetEle);

                targetEle = null;
            }
        });
    });

    getCanRenderEles(content, '[x-fill]').forEach(ele => {
        const fillData = JSON.parse(ele.getAttribute("x-fill"));

        const container = ele;

        Object.keys(fillData).forEach(tempName => {
            let propName = fillData[tempName];

            // 是否初始化
            let isInited;

            exprToSet(xdata, host, propName, targetArr => {
                // 获取模板
                let tempData = temps.get(tempName);

                if (!tempData) {
                    throw {
                        target: host.ele,
                        desc: `this template was not found`,
                        name: tempName
                    };
                }
                if (!isInited) {
                    targetArr.forEach((data, index) => {
                        const itemEle = createXEle(parseStringToDom(tempData.code)[0]);

                        // 添加到容器内
                        container.appendChild(itemEle.ele);

                        const itemData = createXData({
                            get $host() {
                                return host
                            },
                            get $index() {
                                return index
                            }
                        });
                        itemData.$data = data;

                        renderTemp({ host, xdata: itemData, content: itemEle.ele, temps });
                    });
                } else {
                    debugger
                }
                isInited = 1;
            });
        });
    });
}