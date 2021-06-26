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
const [$e] = $args;

with(this){
    return ${expr};
}
    `);
}

// 清除表达式属性并将数据添加到元素对象内
const moveAttrExpr = (ele, exprName, propData) => {
    ele.removeAttribute(exprName);

    let renderedData = ele.__renderData;
    if (!renderedData) {
        renderedData = ele.__renderData = {}
        // 增加渲染过后的数据
        ele.setAttribute("x-rendered", "");
    }

    renderedData[exprName] = propData;
}

const bindWatch = (data, func, bindings) => {
    let eid = data.watchTick(func);
    bindings.push({
        eid,
        target: data
    });
}

// 表达式到值的设置
const exprToSet = ({ xdata, host, expr, callback, isArray }) => {
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
    let backup_val, backup_ids, backup_objstr;

    // 直接运行的渲染函数
    const watchFun = (e) => {
        const val = runFunc();

        if (isxdata(val)) {
            if (isArray) {
                // 对象只监听数组变动
                let ids = val.map(e => (e && e.xid) ? e.xid : e).join(",");
                if (backup_ids !== ids) {
                    callback({ val, modifys: e });
                    backup_ids = ids;
                }
            } else {
                // 对象监听
                let obj_str = val.toJSON();

                if (backup_val !== val || obj_str !== backup_objstr) {
                    callback({ val, modifys: e });
                    backup_objstr = obj_str;
                }
            }
        } else if (backup_val !== val) {
            callback({ val, modifys: e });
            backup_objstr = null;
        }
        backup_val = val;
    }

    // 先执行一次
    watchFun();

    // 已绑定的数据
    const bindings = [];

    // if (host !== xdata) {
    if (!(xdata instanceof XEle)) {
        // fill内的再填充渲染
        // xdata负责监听$index
        // xdata.$data为item数据本身
        // $host为组件数据
        if (expr.includes("$host")) {
            if (expr.includes("$index")) {
                bindWatch(xdata, watchFun, bindings);
            }
            bindWatch(host, watchFun, bindings);
        } else if (expr.includes("$index") || expr.includes("$item")) {
            bindWatch(xdata, watchFun, bindings);
            isxdata(xdata.$data) && bindWatch(xdata.$data, watchFun, bindings);
        } else if (expr.includes("$data")) {
            isxdata(xdata.$data) && bindWatch(xdata.$data, watchFun, bindings);
        } else {
            throw {
                desc: "fill element must use $data $host $item or $index",
                target: host,
                expr
            };
        }
    } else {
        // host数据绑定
        bindWatch(xdata, watchFun, bindings);
    }

    // 返回绑定的关系数据
    return bindings;
}

// 添加监听数据
const addBindingData = (target, bindings) => {
    let _binds = target.__bindings || (target.__bindings = []);
    _binds.push(...bindings);
}

const regIsFuncExpr = /[\(\)\;\.\=\>\<]/;

// 元素深度循环函数
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
        if (ele.__bindings) {
            ele.__bindings.forEach(e => {
                let { target, eid } = e;
                target.unwatch(eid);
            });
        }
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

        moveAttrExpr(target, "x-on", eventInfo);
    });

    // 属性绑定
    getCanRenderEles(content, "[x-attr]").forEach(ele => {
        const attrData = JSON.parse(ele.getAttribute('x-attr'));

        moveAttrExpr(ele, "x-attr", attrData);

        Object.keys(attrData).forEach(attrName => {
            const bindings = exprToSet({
                xdata, host,
                expr: attrData[attrName],
                callback: ({ val }) => {
                    ele.setAttribute(attrName, val);
                }
            });

            addBindingData(ele, bindings);
        })
    });

    getCanRenderEles(content, "[x-prop]").forEach(ele => {
        const propData = JSON.parse(ele.getAttribute('x-prop'));
        const xEle = createXEle(ele);

        moveAttrExpr(ele, "x-prop", propData);

        Object.keys(propData).forEach(propName => {
            const bindings = exprToSet({
                xdata, host,
                expr: propData[propName],
                callback: ({ val }) => {
                    xEle[propName] = val;
                }
            });

            addBindingData(ele, bindings);
        });
    });

    // 数据双向绑定
    getCanRenderEles(content, "[x-sync]").forEach(ele => {
        const propData = JSON.parse(ele.getAttribute('x-sync'));
        const xEle = createXEle(ele);

        Object.keys(propData).forEach(propName => {
            let hostPropName = propData[propName];
            if (regIsFuncExpr.test(hostPropName)) {
                throw {
                    desc: "sync only accepts attribute names"
                };
            }

            const bindings1 = exprToSet({
                xdata, host,
                expr: hostPropName,
                callback: ({ val }) => {
                    xEle[propName] = val;
                }
            });

            const bindings2 = exprToSet({
                xdata: xEle, host, expr: propName,
                callback: ({ val }) => {
                    xdata[hostPropName] = val;
                }
            });

            addBindingData(ele, [...bindings1, ...bindings2]);
        });
    });

    // 文本绑定
    getCanRenderEles(content, 'x-span').forEach(ele => {
        let expr = decodeURI(ele.getAttribute("prop"));

        let { marker, parent } = postionNode(ele);

        // 改为textNode
        const textnode = document.createTextNode("")
        parent.replaceChild(textnode, marker);

        // 数据绑定
        const bindings = exprToSet({
            xdata, host, expr,
            callback: ({ val }) => {
                textnode.textContent = val;
            }
        });

        addBindingData(textnode, bindings);
    });

    // if元素渲染
    getCanRenderEles(content, '[x-if]').forEach(ele => {
        const expr = ele.getAttribute('x-if');

        // 定位文本元素
        let { marker, parent } = postionNode(ele);

        // 生成的目标元素
        let targetEle = null;

        const bindings = exprToSet({
            xdata, host, expr,
            callback: ({ val }) => {
                if (val && !targetEle) {
                    // 添加元素
                    targetEle = $(ele.content.children[0].outerHTML).ele;

                    parent.insertBefore(targetEle, marker);
                    // parent.replaceChild(targetEle, marker);

                    // 重新渲染
                    renderTemp({ host, xdata, content: targetEle, temps });
                } else if (!val && targetEle) {
                    // 去除数据绑定
                    removeElementBind(targetEle);

                    // 删除元素
                    targetEle.parentNode.removeChild(targetEle);
                    // parent.replaceChild(marker, targetEle);

                    targetEle = null;
                }
            }
        });

        addBindingData(marker, bindings);
    });

    // 填充绑定
    getCanRenderEles(content, '[x-fill]').forEach(ele => {
        const fillData = JSON.parse(ele.getAttribute("x-fill"));
        let fillKeys = ele.getAttribute("x-item");
        fillKeys && (fillKeys = JSON.parse(fillKeys));

        const container = ele;

        let [tempName, propName] = fillData;

        let old_xid;

        // 提前把 x-fill 属性去掉，防止重复渲染
        moveAttrExpr(ele, "x-fill", fillData);
        moveAttrExpr(ele, "x-item", fillKeys);

        const bindings = exprToSet({
            xdata, host,
            expr: propName,
            isArray: 1,
            callback: d => {
                const targetArr = d.val;

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
                    // 完全填充
                    targetArr.forEach((data, index) => {
                        const itemEle = createFillItem({
                            host, data, index, tempData, temps
                        });

                        if (fillKeys) {
                            initKeyToItem(itemEle, fillKeys, xdata, host);
                        }

                        // 添加到容器内
                        container.appendChild(itemEle.ele);
                    });

                    old_xid = targetArr.xid;
                } else {
                    const childs = Array.from(container.children);
                    const oldArr = childs.map(e => e.__fill_item.$data);

                    const holder = Symbol("holder");

                    const afterChilds = [];
                    targetArr.forEach((e, index) => {
                        let oldIndex = oldArr.indexOf(e);
                        if (oldIndex === -1) {
                            // 属于新增
                            let newItem = createFillItem({
                                host, data: e, index, tempData, temps
                            });

                            if (fillKeys) {
                                initKeyToItem(newItem, fillKeys, xdata, host);
                            }

                            afterChilds.push(newItem.ele);
                        } else {
                            // 属于位移
                            let targetEle = childs[oldIndex];
                            // 更新index
                            targetEle.__fill_item.$index = index;
                            afterChilds.push(targetEle);

                            // 标识已用
                            oldArr[oldIndex] = holder;
                        }
                    });

                    // 需要被清除数据的
                    const needRemoves = [];

                    // 删除不在数据内的元素
                    oldArr.forEach((e, i) => {
                        if (e !== holder) {
                            let e2 = childs[i];
                            needRemoves.push(e2);
                            container.removeChild(e2);
                        }
                    });

                    // 去除数据绑定
                    needRemoves.forEach(e => removeElementBind(e));

                    // 重构数组
                    rebuildXEleArray(container, afterChilds);
                }
            }
        });

        addBindingData(ele, bindings);
    });
}

const initKeyToItem = (itemEle, fillKeys, xdata, host) => {
    let fData = itemEle.$item;
    Object.keys(fillKeys).forEach(key => {
        let expr = fillKeys[key];

        const propName = attrToProp(key);
        let itemBindings = exprToSet({
            xdata, host, expr,
            callback: ({ val }) => {
                fData[propName] = val;
            }
        });

        addBindingData(itemEle.ele, itemBindings);
    });
}

// 生成fillItem元素
// fillKeys 传递的Key
const createFillItem = ({
    host, data, index, tempData, temps
}) => {
    const itemEle = createXEle(parseStringToDom(tempData.code)[0]);

    const itemData = createXData({
        get $host() {
            return host;
        },
        // $data: data,
        $index: index,
        get $data() {
            return data;
        },
        get $item() {
            // 获取自身
            return itemData;
        }
        // get $index() {
        //     return this._index;
        // },
        // _index: index
    });

    defineProperties(itemEle, {
        $item: {
            get: () => itemData
        },
        $data: {
            get: () => data
        }
    });

    itemEle.ele.__fill_item = itemData;

    renderTemp({ host, xdata: itemData, content: itemEle.ele, temps });

    return itemEle;
}