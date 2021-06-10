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
    const watchFun = (e) => {
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

    // 属于fill 填充渲染
    if (host !== xdata) {
        if (expr.includes("$host") || expr.includes("$index")) {
            targetData = host;
        } else {
            targetData = xdata.$data;
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

        // 获取填充数组的函数
        container._getFillArr = () => xdata[propName];

        let [tempName, propName] = fillData;

        let old_xid;

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
            if (!old_xid) {
                targetArr.forEach((data, index) => {
                    const itemEle = createFillItem({
                        // owner: targetArr,
                        host, data, index, tempData, temps
                    });

                    // 添加到容器内
                    container.appendChild(itemEle.ele);
                });

                old_xid = targetArr.xid;
            } else {
                const childs = Array.from(container.children);
                const oldArr = childs.map(ele => {
                    const { $data } = ele.__fill_item;

                    // 将不存在的元素删除
                    if (!targetArr.includes($data)) {
                        container.removeChild(ele);
                    }

                    return $data;
                });

                // 即将用于重构的元素数组
                const new_childs = [];

                // 位移并将新对象重新创建元素绑定
                targetArr.forEach((data, index) => {
                    let oldIndex = oldArr.indexOf(data);
                    if (oldIndex > -1) {
                        // 只是换位置的
                        new_childs.push(childs[oldIndex]);
                    } else {
                        // 需要新增的
                        let newItem = createFillItem({
                            // owner: targetArr,
                            host, data, index, tempData, temps
                        });

                        new_childs.push(newItem.ele);
                    }
                });

                rebuildXEleArray(container, new_childs);
            }
        });
    });
}

// 生成fillItem元素
const createFillItem = ({
    // owner,
    host, data, index, tempData, temps
}) => {
    const itemEle = createXEle(parseStringToDom(tempData.code)[0]);

    const itemData = {
        get $host() {
            return host;
        },
        get $data() {
            return data;
        },
        get $index() {
            // return owner.indexOf(data);
            const { parent } = itemEle;

            if (parent) {
                return parent.ele._getFillArr().indexOf(data);
            } else {
                return index;
            }
        }
    };

    itemEle.ele.__fill_item = itemData;

    renderTemp({ host, xdata: itemData, content: itemEle.ele, temps });

    return itemEle;
}