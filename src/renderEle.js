// 内部用的watch方法
const oriWatch = (d, k, func) => {
    let tars = getWatchObj(d, k, SWATCHORI);
    tars.push(func);
};

// 设置数据
const setRData = (rData, k, innerShearObject) => {
    let data = rData[k];
    switch (k) {
        case "val":
            innerShearObject.val(data);
            break;
        default:
            innerShearObject[k] = data;
    }
}

// 获取 defineObject 的 参数对象
// param computedObj getter setter 对象
// param key 绑定属性名
// param innerShearObject 内部用 shear元素对象
// param shearProtoObj shear元素对象的一级原型对象
// param setCall setter callback
const getDefineOptions = (computedObj, key, innerShearObject, shearProtoObj, setCall = () => {}) => {
    let computedObjType = getType(computedObj);

    // 专门方法
    let getFunc = () => undefined,
        setFunc;

    if (computedObjType == "function") {
        getFunc = computedObj;
    } else {
        getFunc = computedObj.get;
        setFunc = computedObj.set;
    }

    let dObj = {
        enumerable: true,
        get: () => getFunc.call(innerShearObject)
    };
    setFunc && (dObj.set = d => {
        // 获取之前的值
        let oldVal = (key == "val") ? innerShearObject.val() : innerShearObject[key];

        // 获取当前值
        let reObj = setFunc.call(innerShearObject, d);

        let val = d;

        // 重新get获取数据
        if (getFunc && key !== "val") {
            val = shearProtoObj[key];
        }

        // 触发修改函数
        emitChange(shearProtoObj, key, val, oldVal, d);

        setCall(val);

        return reObj;
    });

    return dObj;
}

let rid = 100;

// 渲染 sv元素
const renderEle = (ele) => {
    // 判断是否属于sv-ele元素
    if (hasAttr(ele, 'sv-ele')) {
        // 获取 tag data
        let tagdata = getTagData(ele);

        if (!tagdata) {
            console.warn('this element is not defined', ele);
            return;
        }

        // 主体元素
        let $ele = _$(ele);

        // 获取子元素
        let childs = Array.from(ele.childNodes);

        // 填充模板元素
        ele.innerHTML = tagdata.code;

        // 生成renderId
        let renderId = ++rid;

        // 设置渲染id
        $ele.removeAttr('sv-ele').attr('sv-render', renderId);
        $ele.find(`*`).attr('sv-shadow', renderId);

        // 渲染依赖sv-ele
        _$(`[sv-ele][sv-shadow="${renderId}"]`, ele).each((i, e) => {
            renderEle(e);
        });

        // 生成元素
        let shearProtoObj = new tagdata.Shear();

        //挂载数据
        ele._svData = shearProtoObj;

        // 先转换 sv-span 元素
        _$(`sv-span[sv-shadow="${renderId}"]`, ele).each((i, e) => {
            // 替换sv-span
            var textnode = document.createTextNode("");
            e.parentNode.insertBefore(textnode, e);
            e.parentNode.removeChild(e);

            // 文本数据绑定
            var svkey = e.getAttribute(SVKEY);
            oriWatch(shearProtoObj, svkey, (val) => {
                textnode.textContent = val;
            });
        });

        // 写入 $content
        let $content = _$(`[sv-content][sv-shadow="${renderId}"]`, ele);
        delete $content.prevObject;
        if ($content[0]) {
            defineProperty(shearProtoObj, '$content', {
                enumerable: true,
                get() {
                    return createShear$($content);
                }
            });
            // 把东西还原回content
            $content.append(childs);

            // 设置父节点
            $content.prop('svParent', ele);

            // 判断是否监听子节点变动
            if (tagdata.childChange) {
                let observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        let {
                            addedNodes,
                            removedNodes
                        } = mutation;
                        let obsEvent = {};
                        (0 in addedNodes) && (obsEvent.addedNodes = Array.from(addedNodes));
                        (0 in removedNodes) && (obsEvent.removedNodes = Array.from(removedNodes));
                        tagdata.childChange(createShearObject(ele), obsEvent);
                    });
                });

                // 监听节点
                observer.observe($content[0], {
                    attributes: false,
                    childList: true,
                    characterData: false,
                    subtree: false,
                });

                // 设置监听属性
                shearProtoObj.__obs = observer;
            }
        }

        // 写入其他定义节点
        _$(`[sv-tar][sv-shadow="${renderId}"]`, ele).each((i, e) => {
            let eName = _$(e).attr('sv-tar');
            defineProperty(shearProtoObj, '$' + eName, {
                enumerable: true,
                get() {
                    return createShear$([e]);
                }
            });
        });

        // 私有属性
        let innerShearObject = createShearObject(ele);
        let priObj = tagdata.pri;
        if (priObj) {
            for (let k in priObj) {
                innerShearObject["_" + k] = priObj[k];
            }
        }

        // 等下需要设置的data
        let rData = {};

        // 基础数据
        assign(rData, tagdata.data);

        // attrs 上的数据
        tagdata.attrs.forEach(kName => {
            // 获取属性值并设置
            let attrVal = $ele.attr(kName);
            if (isRealValue(attrVal)) {
                rData[kName] = attrVal;
            }

            // 绑定值
            oriWatch(shearProtoObj, kName, (value) => {
                $ele.attr(kName, value);
            });
        });

        // props 上的数据
        tagdata.props.forEach(kName => {
            let attrVal = $ele.attr(kName);
            isRealValue(attrVal) && (rData[kName] = attrVal);
        });

        // 绑定sv-module
        _$(`[sv-module][sv-shadow="${renderId}"]`, ele).each((i, tar) => {
            let $tar = _$(tar);
            let kName = $tar.attr('sv-module');

            // 绑定值
            oriWatch(shearProtoObj, kName, (val) => {
                tar.value = val;
            });

            // 监听改动
            $tar.on('input change', (e) => {
                (kName == "val") ? $ele.val(tar.value): (shearProtoObj[kName] = tar.value);
            });

            if (tar.tagName.toLowerCase() == 'select') {
                rData[kName] = tar.value;
            }

        });

        let valInfoData = tagdata.val;

        if (0 in _$(`[sv-module="val"][sv-shadow="${renderId}"]`, ele) && !valInfoData) {
            let tempVal = "";
            valInfoData = {
                get: () => tempVal,
                set: val => tempVal = val
            };
        }

        // 判断是否有value值绑定
        if (valInfoData) {
            let defineOptions = getDefineOptions(valInfoData, 'val', innerShearObject, shearProtoObj);
            defineProperty(ele, 'value', defineOptions);
        }

        // 禁止val事件向上冒泡
        $ele.on('change input', e => {
            if (e.target !== ele) {
                e.stopImmediatePropagation();
            }
        });

        let computed = assign({}, tagdata.computed);
        let computedKey = Object.keys(computed);

        // 设置rData其他的 computed
        for (let k in rData) {
            if (!computed[k] && k !== "val") {
                let data;
                computed[k] = {
                    get() {
                        return data;
                    },
                    set(val) {
                        data = val;
                    }
                };
            }
        }

        // 设置computed
        for (let key in computed) {
            // 定义方法
            let defineOptions = getDefineOptions(computed[key], key, innerShearObject, shearProtoObj);

            defineProperty(shearProtoObj, key, defineOptions);
        }

        // 渲染完成方法
        tagdata.render && tagdata.render(innerShearObject, rData);

        // 设置值
        for (let k in rData) {
            if (computedKey.indexOf(k) > -1) {
                continue;
            }
            setRData(rData, k, innerShearObject);
        }
        each(computedKey, k => {
            isRealValue(rData[k]) && setRData(rData, k, innerShearObject);
        });

        // 初始化完成
        tagdata.inited && tagdata.inited(innerShearObject);

        // 如果是在document上，直接触发 attached 事件
        if (ele.getRootNode() === document && tagdata.attached && !ele[ATTACHED_KEY]) {
            tagdata.attached(innerShearObject);
            ele[ATTACHED_KEY] = 1;
        }
    }
}