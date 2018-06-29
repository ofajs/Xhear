// 元素自定义组件id
let rid = 100;

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

    let xhearObj = new regData.XHear();
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
                xhearObj.value = val;
            });
            debugger
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

    // 设置keys
    xhearObj.set(Object.keys(rData));

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

    // 存在 value key
    if ('value' in rData) {
        defineProperty(ele, 'value', {
            get() {
                return xhearObj.value;
            },
            set(d) {
                xhearObj.value = d;
            }
        });
    }

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