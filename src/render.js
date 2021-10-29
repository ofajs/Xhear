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
const [$e,$target] = $args;

try{
    with(this){
        ${expr};
    }
}catch(e){
    throw {
        message:e.message || "run error",
        expr:\`${expr.replace(/`/g, "\\`")}\`,
        target:this,
        error:e
    };
}`);
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

// 绑定函数监听，添加到记录数组
const bindWatch = (data, func, bindings) => {
    let eid = data.watchTick(func);
    bindings.push({
        eid,
        target: data
    });
}

// 获取目标数据get函数
const renderXdataGetFunc = (expr, xdata) => {
    let runFunc;

    if (regIsFuncExpr.test(expr)) {
        // 属于函数
        runFunc = exprToFunc("return " + expr).bind(xdata);
    } else {
        // 值变动
        // runFunc = () => xdata[expr];
        runFunc = () => getXData(xdata, expr);
    }

    return runFunc;
}

// 渲染器上的watch函数绑定
// expr用作判断xdata或host的依据，不做执行
const renderInWatch = ({ xdata, host, expr, watchFun }) => {
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
        }
        // else {
        //     throw {
        //         desc: "fill element must use $data $host $item or $index",
        //         target: host,
        //         expr
        //     };
        // }
    } else {
        // host数据绑定
        bindWatch(xdata, watchFun, bindings);
    }

    return bindings;
}

// 表达式到值的设置
const exprToSet = ({ xdata, host, expr, callback, isArray }) => {
    // 即时运行的判断函数
    let runFunc = renderXdataGetFunc(expr, xdata);

    // 备份比较用的数据
    let backup_val, backup_ids, backup_objstr;

    // 直接运行的渲染函数
    const watchFun = (modifys) => {
        const val = runFunc();

        if (isxdata(val)) {
            if (isArray) {
                // 对象只监听数组变动
                let ids = val.map(e => (e && e.xid) ? e.xid : e).join(",");
                if (backup_ids !== ids) {
                    callback({ val, modifys });
                    backup_ids = ids;
                }
            } else {
                // 对象监听
                let obj_str = val.toJSON();

                if (backup_val !== val || obj_str !== backup_objstr) {
                    callback({ val, modifys });
                    backup_objstr = obj_str;
                }
            }
        } else if (backup_val !== val) {
            callback({ val, modifys });
            backup_objstr = null;
        }
        backup_val = val;
    }

    // 先执行一次
    watchFun();

    return renderInWatch({
        xdata, host, expr, watchFun
    });
}

// 添加监听数据
const addBindingData = (target, bindings) => {
    let _binds = target.__bindings || (target.__bindings = []);
    _binds.push(...bindings);
}

const regIsFuncExpr = /[\(\)\;\=\>\<\|\!\?\+\-\*\/\&\|\{\}`]/;

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
        if (ele.isCustom) {
            createXEle(ele).revoke();
        }

        if (ele.__bindings) {
            ele.__bindings.forEach(e => {
                let { target, eid } = e;
                target.unwatch(eid);
            });
        }
    });
}

// 添加渲染模板item内的元素
const addTempItemEle = ({
    temp, temps, marker, parent, host, xdata
}) => {
    // 添加元素
    let targets = parseStringToDom(temp.innerHTML);
    targets.forEach(ele => {
        parent.insertBefore(ele, marker);
        renderTemp({ host, xdata, content: ele, temps });
    });
    return targets;
}

// 删除渲染模板item内的元素
const removeTempItemEle = (arr) => {
    arr.forEach(item => {
        // 去除数据绑定
        removeElementBind(item)

        // 删除元素
        item.parentNode.removeChild(item);
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
                    // func.call(xdata, event, $tar);
                    func.call(host, event, $tar);
                });
            } else {
                // 函数名绑定
                eid = $tar.on(eventName, (event) => {
                    // const func = xdata[name];
                    const func = host[name];
                    if (func) {
                        if (isFunction(func)) {
                            func.call(xdata, event);
                        } else {
                            console.error({
                                target: xdata,
                                host,
                                name,
                                value: func,
                                desc: "bind value is not function"
                            });
                        }
                    } else {
                        console.error({
                            target: xdata,
                            host,
                            name,
                            desc: "no binding function"
                        });
                    }
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
                    if (val === null || val === undefined) {
                        ele.removeAttribute(attrName);
                    } else {
                        ele.setAttribute(attrName, val);
                    }
                }
            });

            addBindingData(ele, bindings);
        })
    });

    // class绑定
    getCanRenderEles(content, "[x-class]").forEach(ele => {
        const classListData = JSON.parse(ele.getAttribute('x-class'));

        moveAttrExpr(ele, "x-class", classListData);

        Object.keys(classListData).forEach(className => {
            const bindings = exprToSet({
                xdata, host,
                expr: classListData[className],
                callback: ({ val }) => {
                    // ele.setAttribute(className, val);
                    if (val) {
                        ele.classList.add(className);
                    } else {
                        ele.classList.remove(className);
                    }
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
                    setXData(xEle, propName, val);
                }
            });

            const bindings2 = exprToSet({
                xdata: xEle, host, expr: propName,
                callback: ({ val }) => {
                    setXData(xdata, hostPropName, val);
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
    getCanRenderEles(content, '[x-cmd-if]').forEach(ele => {
        const conditionEles = [ele];
        // 将后续的else-if和else都拿起来
        let { nextElementSibling } = ele;
        while (nextElementSibling && (nextElementSibling.hasAttribute("x-cmd-else-if") || nextElementSibling.hasAttribute("x-cmd-else"))) {
            nextElementSibling.parentNode.removeChild(nextElementSibling);
            conditionEles.push(nextElementSibling);
            nextElementSibling = ele.nextElementSibling
        }

        let all_expr = '';

        // 将连在一起的 if else 都组成一个数组，并转化成条件函数
        const conditions = conditionEles.map((e, index) => {
            let callback;

            const expr = e.getAttribute("x-cmd-else-if") || e.getAttribute("x-cmd-if");

            if (expr) {
                callback = renderXdataGetFunc(expr, xdata);
                all_expr += `${index == 0 ? 'if' : 'else-if'}(${expr})...`;
            }

            return {
                callback,
                tempEle: e
            };
        });

        // 定位文本元素
        let { marker, parent } = postionNode(ele);

        // 生成的目标元素
        let oldTargetEle = null;
        let oldConditionId = -1;
        // let oldConditionValue;

        const watchFun = (modifys) => {
            let tempEle, conditionId = -1;
            let conditionVal;
            conditions.some((e, index) => {
                if (e.callback) {
                    conditionVal = !!e.callback();

                    if (conditionVal) {
                        tempEle = e.tempEle;
                        conditionId = index;
                        return true;
                    }
                } else {
                    // 最后的else
                    tempEle = e.tempEle;
                    conditionId = index;
                    // conditionVal = true;
                }
            });

            // 值或序号不一样，都能进入修正的环节
            // if (oldConditionId !== conditionId || conditionVal !== oldConditionValue) {
            if (oldConditionId !== conditionId) {
                // 旧模板销毁
                if (oldTargetEle) {
                    // debugger
                    // 去除数据绑定
                    removeElementBind(oldTargetEle);

                    // 删除元素
                    oldTargetEle.parentNode.removeChild(oldTargetEle);
                    // parent.replaceChild(marker, oldTargetEle);
                    oldTargetEle = null;
                }

                // 确定可添加模板
                // if (conditionVal && tempEle) {
                if (tempEle) {
                    // 添加元素
                    oldTargetEle = parseStringToDom(tempEle.content.children[0].outerHTML)[0];

                    parent.insertBefore(oldTargetEle, marker);

                    // 重新渲染
                    renderTemp({ host, xdata, content: oldTargetEle, temps });
                }
            }

            // oldConditionValue = conditionVal;
            oldConditionId = conditionId;
        }

        // 先执行一次
        watchFun();

        addBindingData(marker, renderInWatch({
            xdata, host, expr: all_expr, watchFun
        }));
    });

    // await元素渲染
    getCanRenderEles(content, "[x-cmd-await]").forEach(ele => {
        let awaitTemp = ele, thenTemp, catchTemp;
        // 将后续的else-if和else都拿起来
        let { nextElementSibling } = ele;
        while (nextElementSibling && (nextElementSibling.hasAttribute("x-cmd-then") || nextElementSibling.hasAttribute("x-cmd-catch"))) {
            if (nextElementSibling.hasAttribute("x-cmd-then")) {
                thenTemp = nextElementSibling;
            } else if (nextElementSibling.hasAttribute("x-cmd-catch")) {
                catchTemp = nextElementSibling;
            }
            nextElementSibling.parentNode.removeChild(nextElementSibling);
            nextElementSibling = ele.nextElementSibling
        }

        // 添加定位
        let { marker, parent } = postionNode(ele);

        let expr = ele.getAttribute("x-cmd-await");

        let beforePms, beforeTargets;
        const bindings = exprToSet({
            xdata, host, expr,
            callback: ({ val }) => {
                // 清除前面的数据
                if (beforeTargets) {
                    removeTempItemEle(beforeTargets);
                    beforeTargets = null;
                }

                // 添加元素
                beforeTargets = addTempItemEle({
                    temp: awaitTemp, temps, marker, parent, host, xdata
                });

                beforePms = val;

                val.then(e => {
                    if (beforePms !== val) {
                        return;
                    }
                    removeTempItemEle(beforeTargets);
                    beforeTargets = null;
                    if (thenTemp) {
                        beforeTargets = addTempItemEle({
                            temp: thenTemp, temps, marker, parent, host, xdata: {
                                [thenTemp.getAttribute("x-cmd-then")]: e
                            }
                        });
                    }
                }).catch(err => {
                    if (beforePms !== val) {
                        return;
                    }
                    removeTempItemEle(beforeTargets);
                    beforeTargets = null;
                    if (catchTemp) {
                        beforeTargets = addTempItemEle({
                            temp: catchTemp, temps, marker, parent, host, xdata: {
                                [catchTemp.getAttribute("x-cmd-catch")]: err
                            }
                        });
                    }
                })
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

        createXEle(container)._unupdate = 1;

        let [tempName, propName] = Object.entries(fillData)[0];

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