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

        // 渲染依赖sv-ele
        _$('[sv-ele]', ele).each((i, e) => {
            renderEle(e);
        });

        // 生成元素
        let shearObject = new tagdata.Shear();

        //挂载数据
        ele._svData = shearObject;

        // 先转换 sv-span 元素
        _$('sv-span', ele).each((i, e) => {
            // 替换sv-span
            var textnode = document.createTextNode("");
            e.parentNode.insertBefore(textnode, e);
            e.parentNode.removeChild(e);

            // 文本数据绑定
            var svkey = e.getAttribute(SVKEY);
            oriWatch(shearObject, svkey, (val) => {
                textnode.textContent = val;
            });
        });

        // 写入 $content
        let $content = _$('[sv-content]', ele);
        delete $content.prevObject;
        if ($content[0]) {
            defineProperty(shearObject, '$content', {
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
                shearObject.__obs = observer;
            }
        }

        // 写入其他定义节点
        _$('[sv-tar][sv-shadow="t"]', ele).each((i, e) => {
            let eName = _$(e).attr('sv-tar');
            defineProperty(shearObject, '$' + eName, {
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
            if (attrVal) {
                rData[kName] = attrVal;
            }

            // 绑定值
            oriWatch(shearObject, kName, (val) => {
                $ele.attr(kName, val);
            });
        });

        // props 上的数据
        tagdata.props.forEach(kName => {
            let attrVal = $ele.attr(kName);
            rData[kName] = attrVal;
        });

        // 绑定sv-module
        _$('[sv-module]', ele).each((i, tar) => {
            let $tar = _$(tar);
            let kName = $tar.attr('sv-module');

            // 绑定值
            oriWatch(shearObject, kName, (val) => {
                tar.value = val;
            });

            // 监听改动
            $tar.on('input', () => {
                shearObject[kName] = tar.value;
            });
        });

        // watch监听
        let needWatchObj = tagdata.watch;
        if (needWatchObj) {
            for (let kName in needWatchObj) {
                // 绑定值
                oriWatch(shearObject, kName, (...args) => needWatchObj[kName].apply(innerShearObject, args));
            }
        }

        // 判断是否有value值绑定
        let valInfoData = tagdata.val;
        if (valInfoData) {
            let dObj = {};
            valInfoData.get && (dObj.get = () => valInfoData.get.call(innerShearObject));
            valInfoData.set && (dObj.set = d => {
                let reObj = valInfoData.set.call(innerShearObject, d);

                // 触发修改函数
                emitChange(shearObject, 'val', d);

                return reObj;
            });

            defineProperty(ele, 'value', dObj);
        }

        // 需要computed进去的key
        let computedInData = [];

        // 是否有自定义字段数据
        let {
            computed
        } = tagdata;
        if (computed) {
            for (let key in computed) {
                let tar = computed[key];
                let tarType = getType(tar);

                // 专门方法
                let getFunc, setFunc;

                if (tarType == "function") {
                    getFunc = tar;
                } else {
                    getFunc = tar.get;
                    setFunc = tar.set;
                }
                let dObj = {
                    enumerable: true
                };
                getFunc && (dObj.get = () => getFunc.call(innerShearObject));
                setFunc && (dObj.set = d => {
                    // 获取当前值
                    let val = setFunc.call(innerShearObject, d);

                    // 重新get获取数据
                    if (getFunc) {
                        d = shearObject[key];
                    }

                    // 触发修改函数
                    emitChange(shearObject, key, d);

                    return val;
                });

                defineProperty(shearObject, key, dObj);

                // 先触发一次渲染
                // emitChange(shearObject, key, shearObject[key]);

                // 预先设置数据
                if (!isUndefined(rData[key])) {
                    computedInData.push(key);
                    rData[key] = shearObject[key];
                }
            }
        }

        // 生成renderId
        let renderId = getRandomId();

        // 设置已经渲染
        $ele.removeAttr('sv-ele').attr('sv-render', renderId);
        $ele.find(`[sv-shadow="t"]`).attr('sv-shadow', renderId);

        // 渲染节点完成
        tagdata.render && tagdata.render(innerShearObject, rData);

        // 设置 rData
        shearObject.set(rData);

        // computedInData数据设置
        each(computedInData, key => {
            let tar_val = rData[key];
            !isUndefined(tar_val) && (shearObject[key] = tar_val);
        });

        // val 设值
        if (valInfoData) {
            let tar_val = rData.val;
            !isUndefined(tar_val) && (ele.value = tar_val);
        }

        // 初始化完成
        tagdata.inited && tagdata.inited(innerShearObject);

        // 如果是在document上，直接触发 attached 事件
        if (ele.getRootNode() === document && tagdata.attached && !ele[ATTACHED_KEY]) {
            tagdata.attached(innerShearObject);
            ele[ATTACHED_KEY] = 1;
        }
    }
}