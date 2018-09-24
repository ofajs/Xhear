// 元素自定义组件id
let rid = 100;

// 填充 value tag
const getXEleByData = (data, tagMap) => {
    // 获取tag
    let {
        tag
    } = data;

    if (tagMap && tagMap[tag]) {
        tag = tagMap[tag];
    }

    // 获取深复制，删除tag、数字和length
    let cData = {};
    Object.keys(data).forEach(k => {
        if (/\D/.test(k)) {
            cData[k] = data[k];
        }
    });
    delete cData.tag;
    delete cData.length;

    // 生成元素
    let xEle = $(`<${tag} xv-ele xv-rid="${data._id}"></${tag}>`);

    // 合并数据
    assign(xEle, cData);

    // 递归添加子元素
    Array.from(data).forEach(data => {
        xEle.append(getXEleByData(data, tagMap));
    });

    return xEle;
}

// 重新填充元素
const resetInData = (xhearEle, childsData, tagMap) => {
    xhearEle.hide();

    // 新添加
    xhearEle.empty();

    // 添加进元素
    childsData.forEach(data => {
        xhearEle.append(getXEleByData(data, tagMap));
    });

    xhearEle.show();
}

const renderEle = (ele) => {
    if (!hasAttr(ele, 'xv-ele')) {
        return;
    }

    // 从库中获取注册数据
    let regData = getTagData(ele);

    // 判断是否存在注册数据
    if (!regData) {
        console.warn('no exist tag', ele);
        return;
    }
    let $ele = _$(ele);

    // 获取子元素
    let childs = Array.from(ele.childNodes);

    // 填充代码
    ele.innerHTML = regData.temp;

    // 生成renderId
    let renderId = ++rid;

    // 初始化对象
    let xhearOriObj = new regData.XHear({});
    let xhearObj = new Proxy(xhearOriObj, XDataHandler);
    ele[XHEAROBJKEY] = xhearObj;

    let xhearEle = createShearObject(ele);

    // 设置渲染id
    $ele.removeAttr('xv-ele').attr('xv-render', renderId);
    $ele.find(`*`).attr('xv-shadow', renderId);

    // 渲染依赖sx-ele
    _$(`[xv-ele][xv-shadow="${renderId}"]`, ele).each((i, e) => {
        renderEle(e);
    });

    // 转换 xv-span 元素
    _$(`xv-span[xv-shadow="${renderId}"]`, ele).each((i, e) => {
        // 替换xv-span
        var textnode = document.createTextNode("");
        e.parentNode.insertBefore(textnode, e);
        e.parentNode.removeChild(e);

        // 文本数据绑定
        var svkey = e.getAttribute('svkey');

        xhearObj.watch(svkey, d => {
            textnode.textContent = d;
        });
    });

    // 放回内容
    let xvContentEle = _$(`[xv-content][xv-shadow="${renderId}"]`, ele);
    if (0 in xvContentEle) {
        // 定义$content属性
        defineProperty(xhearObj, '$content', {
            enumerable: true,
            get() {
                return createShear$(xvContentEle);
            }
        });

        // 添加svParent
        xvContentEle.prop('svParent', ele);

        // 添加子元素
        xvContentEle.append(childs);

        // 判断是否监听子节点变动
        if (regData.childChange) {
            let observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    let {
                        addedNodes,
                        removedNodes
                    } = mutation;
                    let obsEvent = {};
                    (0 in addedNodes) && (obsEvent.addedNodes = Array.from(addedNodes));
                    (0 in removedNodes) && (obsEvent.removedNodes = Array.from(removedNodes));
                    regData.childChange(createShearObject(ele), obsEvent);
                });
            });

            // 监听节点
            observer.observe(xvContentEle[0], {
                attributes: false,
                childList: true,
                characterData: false,
                subtree: false,
            });

            // 设置监听属性
            xhearObj.__obs = observer;
        }
    }

    // 写入其他定义节点
    _$(`[xv-tar][xv-shadow="${renderId}"]`, ele).each((i, e) => {
        let eName = _$(e).attr('xv-tar');
        defineProperty(xhearObj, '$' + eName, {
            enumerable: true,
            get() {
                return createShear$([e]);
            }
        });
    });

    // 等下需要设置的data
    let rData = assign({}, regData.data);

    // attrs 上的数据
    regData.attrs.forEach(kName => {
        // 获取属性值并设置
        let attrVal = $ele.attr(kName);
        if (isRealValue(attrVal)) {
            rData[kName] = attrVal;
        }

        // 绑定值
        xhearObj.watch(kName, d => {
            // 绑定值
            $ele.attr(kName, d);
        });
    });

    // props 上的数据
    regData.props.forEach(kName => {
        let attrVal = $ele.attr(kName);
        isRealValue(attrVal) && (rData[kName] = attrVal);
    });


    // 绑定xv-module
    _$(`[xv-module][xv-shadow="${renderId}"]`, ele).each((i, tar) => {
        let $tar = _$(tar);
        let kName = $tar.attr('xv-module');

        // 绑定值
        xhearObj.watch(kName, val => {
            tar.value = val;
        });

        // 监听改动
        if (tar[XHEAROBJKEY]) {
            tar[XHEAROBJKEY].watch("value", val => {
                // kName;
                // tar;
                xhearObj[kName] = val;
            });
        } else {
            $tar.on('change input', (e) => {
                xhearObj[kName] = tar.value;
            });
        }
    });

    // 设置渲染完成
    $ele.removeAttr('xv-ele').attr('xv-render', renderId);

    // 补充rData
    let watchData = regData.watch;
    if (watchData) {
        for (let k in watchData) {
            if (!(k in rData)) {
                rData[k] = undefined;
            }
        }
    }

    // 创建渲染器
    xhearEle.watch("render", (childsData, e) => {
        // 获取目标对象、key和值
        let {
            trend
        } = e;

        if (e.type === "new" || (trend && !trend.methodName && trend.keys.length === 1)) {
            resetInData(xhearEle, childsData, regData.renderMap);
            return;
        }
        // 后续修改操作，就没有必要全部渲染一遍了
        // 针对性渲染
        let {
            target,
            key,
            value
        } = detrend(xhearEle, trend);

        // 获取目标元素
        let tarDataEle;

        if (trend.keys.length == 1 && trend.keys[0] == "render") {
            tarDataEle = xhearEle;
        } else {
            tarDataEle = xhearEle.find(`[xv-rid="${target._id}"]`);
        }

        if (trend.type == "array-method") {
            // 先处理特殊的
            switch (trend.methodName) {
                case 'fill':
                case 'reverse':
                case 'sort':
                    // 重新填充数据
                    resetInData(tarDataEle, target, regData.renderMap);
                    return;
            }

            // 三个基本要素
            let index, removeCount, newDatas;

            switch (trend.methodName) {
                case "splice":
                    // 先获取要删减的数量
                    [index, removeCount, ...newDatas] = trend.args;
                    break;
                case 'shift':
                    index = 0;
                    removeCount = 1;
                    newDatas = [];
                    break;
                case 'unshfit':
                    index = 0;
                    removeCount = 0;
                    newDatas = trend.args;
                    break;
                case 'push':
                    index = tarDataEle.children().length;
                    removeCount = 0;
                    newDatas = trend.args;
                    break;
                case 'pop':
                    index = tarDataEle.children().length;
                    removeCount = 1;
                    newDatas = [];
                    break;
            };
            // 走splice通用流程
            // 最后的id
            let lastRemoveId = parseInt(index) + parseInt(removeCount);

            // 根据数据删除
            (removeCount > 0) && tarDataEle.children().each((i, e) => {
                if (i >= index && i < lastRemoveId) {
                    $(e).remove();
                }
            });

            // 获取相应id的元素
            let indexEle = tarDataEle.children().eq(index);

            // 后置数据添加
            newDatas.forEach(data => {
                let xEle = getXEleByData(data, regData.renderMap);

                if (0 in indexEle) {
                    // before
                    indexEle.before(xEle);
                } else {
                    // append
                    tarDataEle.append(xEle);
                }
            });
        } else {
            if (/\D/.test(key)) {
                // 改变属性值
                // 获取元素
                let targetEle = xhearEle.find(`[xv-rid="${target._id}"]`);

                // 修改值
                targetEle[key] = value;
            } else {
                // 替换旧元素
                let {
                    oldVal
                } = trend;

                let oldId = oldVal._id;

                if (oldId) {
                    // 获取元素
                    let oldEle = xhearEle.find(`[xv-rid="${oldId}"]`);

                    // 向后添加元素
                    oldEle.after(getXEleByData(value, regData.renderMap));

                    // 删除旧元素
                    oldEle.remove();
                } else {
                    // 直接替换数组，而不是通过push添加的
                    // 直接向后添加元素
                    let xEle = getXEleByData(value, regData.renderMap);

                    // 在render数组下的数据
                    if (target._host._id === xhearEle._id) {
                        xhearEle.append(xEle);
                    } else {
                        let parEle = xhearEle.find(`[xv-rid="${target._id}"]`);
                        parEle.append(getXEleByData(value, regData.renderMap));
                    }
                }
            }
        }

    });

    // 设置keys
    // 将value和render添加进key里
    let exkeys = Object.keys(rData);
    exkeys.includes('value') || (exkeys.push('value'));
    exkeys.includes('render') || (exkeys.push('render'));
    xhearOriObj._exkeys = exkeys;

    // watch监听
    if (watchData) {
        for (let k in watchData) {
            let tar = watchData[k];

            // 两个callback
            let getCallback, setCallback;

            switch (getType(tar)) {
                case "function":
                    setCallback = tar;
                    break;
                case "object":
                    getCallback = tar.get;
                    setCallback = tar.set;
                    break;
            }

            getCallback && watchGetter(xhearObj, k, getCallback.bind(xhearEle));
            setCallback && xhearObj.watch(k, setCallback.bind(xhearEle));
        }
    }

    defineProperty(ele, 'value', {
        get() {
            return xhearObj.value;
        },
        set(d) {
            xhearObj.value = d;
        }
    });

    // 设置数据
    for (let k in rData) {
        isRealValue(rData[k]) && (xhearObj[k] = rData[k]);
    }

    // 触发callback
    regData.inited && regData.inited.call(ele, xhearEle);

    // attached callback
    if (regData.attached && ele.getRootNode() === document && !ele[ATTACHED_KEY]) {
        regData.attached.call(ele, xhearEle);
        ele[ATTACHED_KEY] = 1;
    }
}