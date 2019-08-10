// 元素自定义组件id计数器
let renderEleId = 100;

const renderEle = (ele, data) => {
    // 获取目标数据
    let tdb = regDatabase.get(ele.tagName.toLowerCase());

    if (!tdb) {
        console.warn('not register tag ' + ele.tagName.toLowerCase());
        return;
    }

    // 判断没有渲染
    if (ele.xvRender) {
        return;
    }

    // 将内容元素拿出来先
    let childs = Array.from(ele.childNodes);

    // 填充代码
    ele.innerHTML = tdb.temp;

    // 生成renderId
    let renderId = renderEleId++;

    // 初始化元素
    let xhearEle = createXHearElement(ele);

    // 合并 proto 的函数
    let {
        proto
    } = tdb;
    if (proto) {
        Object.keys(proto).forEach(k => {
            // 获取描述
            let objDesc = Object.getOwnPropertyDescriptor(proto, k);

            let {
                get,
                set,
                value
            } = objDesc;

            if (value) {
                defineProperty(xhearEle, k, {
                    value
                });
            } else {
                defineProperty(xhearEle, k, {
                    get,
                    set
                });
            }
        });
    }

    // 全部设置 shadow id
    Array.from(ele.querySelectorAll("*")).forEach(ele => ele.setAttribute('xv-shadow', renderId));

    // 渲染依赖xv-ele，
    // 让ele使用渲染完成的内元素
    Array.from(ele.querySelectorAll(`[xv-ele][xv-shadow="${renderId}"]`)).forEach(ele => renderEle(ele));

    // 渲染完成，设置renderID
    ele.removeAttribute('xv-ele');
    ele.setAttribute('xv-render', renderId);
    defineProperty(xhearEle, 'xvRender', {
        value: ele.xvRender = renderId
    });

    // 判断是否有插槽属性
    if (tdb.slotTags.length > 0) {
        tdb.slotTags.forEach(tName => {
            // 获取slot的key
            let tarKey = tName.replace(tdb.tag + "-", "");

            // 查找相应元素
            let tarInEle = ele.querySelector(`[xv-slot="${tarKey}"]`);

            if (tarInEle) {
                // 把元素填进去
                defineProperty(xhearEle, "$" + tarKey, {
                    value: createXHearElement(tarInEle)
                });

                let slotChild = childs.find(ele => {
                    let {
                        tagName
                    } = ele;

                    // 判断是否相应的tagId，并且不是xv定制的元素
                    if (tagName && tagName.toLowerCase() === tName && !ele.getAttribute("xv-ele") && !ele.getAttribute("xv-render")) {
                        // 置换childs
                        return ele;
                    }
                });

                if (slotChild) {
                    // 将slot内的元素都设置shadowId
                    slotChild.querySelectorAll(`*`).forEach(ele => {
                        if (!ele.attributes.hasOwnProperty('xv-shadow')) {
                            ele.setAttribute(`xv-shadow`, renderId);
                        }
                    });

                    // 键slot内的元素填进去
                    Array.from(slotChild.childNodes).forEach(ele => {
                        tarInEle.appendChild(ele);
                    });

                    // 去掉自身
                    childs = childs.filter(e => e !== slotChild);
                }
            }
        });
    }

    // 判断是否有相应的content元素，有的话从里面抽出来
    let contentTagName = tdb.tag + "-content";
    childs.some(ele => {
        let {
            tagName
        } = ele;

        // 判断是否相应的tagId，并且不是xv定制的元素
        if (tagName && tagName.toLowerCase() === contentTagName && !ele.getAttribute("xv-ele") && !ele.getAttribute("xv-render")) {
            // 置换childs
            childs = Array.from(ele.childNodes);
            return true;
        }
    });

    // 获取 xv-content
    let contentEle = ele.querySelector(`[xv-content][xv-shadow="${renderId}"],[xv-slot="content"][xv-shadow="${renderId}"]`);

    // 判断是否有$content
    if (contentEle) {
        // 初始化一次
        let contentXhearEle = createXHearElement(contentEle);

        defineProperty(xhearEle, '$content', {
            value: contentXhearEle
        });

        defineProperty(contentXhearEle, "$host", {
            value: xhearEle
        });
        // 设置hostId
        contentEle.hostId = renderId;

        // 重新修正contentEle
        while (contentEle.xvRender) {
            // $content元素也是render元素的话，获取最终的content元素
            let content = contentEle[XHEARELEMENT].$content;
            content && (contentEle = content.ele);
        }

        // 将原来的东西塞回去
        childs.forEach(ele => {
            contentEle.appendChild(ele);
        });
    } else {
        // 将原来的东西塞回去
        childs.forEach(e => {
            ele.appendChild(e);
        });
    }

    // 设置其他 xv-tar
    Array.from(ele.querySelectorAll(`[xv-tar][xv-shadow="${renderId}"]`)).forEach(ele => {
        let tarKey = ele.getAttribute('xv-tar');
        defineProperty(xhearEle, "$" + tarKey, {
            value: createXHearElement(ele)
        });
    });

    // 转换 xv-span 元素
    Array.from(ele.querySelectorAll(`xv-span[xv-shadow="${renderId}"]`)).forEach(e => {
        // 替换xv-span
        var textnode = document.createTextNode("");
        e.parentNode.insertBefore(textnode, e);
        e.parentNode.removeChild(e);

        // 文本数据绑定
        var xvkey = e.getAttribute('xvkey');

        // 先设置值，后监听
        xhearEle.watch(xvkey, e => textnode.textContent = xhearEle[xvkey]);
    });

    // 绑定xv-module
    Array.from(ele.querySelectorAll(`[xv-module][xv-shadow="${renderId}"]`)).forEach(mEle => {
        // 获取module名并设置监听
        let mKey = mEle.getAttribute('xv-module');

        // 事件回调函数
        let cFun = e => {
            xhearEle[mKey] = mEle.value;
        }
        // 判断是否xvRender的元素
        if (mEle.xvRender) {
            let sEle = createXHearElement(mEle);
            sEle.watch('value', cFun);
        } else {
            mEle.addEventListener('change', cFun);
            mEle.addEventListener('input', cFun);
        }

        // 反向绑定
        xhearEle.watch(mKey, e => {
            mEle.value = xhearEle[mKey];
        });
    });

    // watch事件绑定
    let watchMap = tdb.watch;
    Object.keys(watchMap).forEach(kName => {
        xhearEle.watch(kName, watchMap[kName]);
    });

    // 要设置的数据
    let rData = assign({}, tdb.data);

    data && assign(rData, data);

    // attrs 上的数据
    tdb.attrs.forEach(attrName => {
        // 获取属性值并设置
        let attrVal = ele.getAttribute(attrName);
        if (!isUndefined(attrVal) && attrVal != null) {
            rData[attrName] = attrVal;
        }

        // 绑定值
        xhearEle.watch(attrName, d => {
            // 绑定值
            ele.setAttribute(attrName, d.val);
        });
    });

    // props 上的数据
    tdb.props.forEach(attrName => {
        let attrVal = ele.getAttribute(attrName);
        (!isUndefined(attrVal) && attrVal != null) && (rData[attrName] = attrVal);
    });

    // 添加_exkey
    let exkeys = Object.keys(rData);
    exkeys.push(...tdb.attrs);
    exkeys.push(...tdb.props);
    exkeys.push(...Object.keys(watchMap));
    exkeys = new Set(exkeys);
    defineProperty(xhearEle, EXKEYS, {
        value: exkeys
    });

    // 合并数据后设置
    exkeys.forEach(k => {
        let val = rData[k];

        // 是Object的话，转换成stanz数据
        if (val instanceof Object) {
            val = cloneObject(val);
            val = createXData(val, {
                parent: xhearEle,
                hostkey: k
            });
        }

        if (!isUndefined(val)) {
            xhearEle[k] = val;
        }
    });

    // 设置 value key
    if (exkeys.has('value')) {
        // 设置value取值
        defineProperty(ele, 'value', {
            get() {
                return xhearEle.value;
            },
            set(d) {
                xhearEle.value = d;
            }
        });
    }

    // 优先渲染子元素
    Array.from(ele.querySelectorAll(`[xv-ele]`)).forEach(ele => renderEle(ele));

    // 执行inited 函数
    tdb.inited && tdb.inited.call(xhearEle);

    // 添加到document后执行attached函数
    if (tdb.attached && !ele[ATTACHED] && ele.getRootNode() === document) {
        tdb.attached.call(xhearEle);
        ele[ATTACHED] = 1;
    }
}

const register = (options) => {
    let defaults = {
        // 自定义标签名
        tag: "",
        // 正文内容字符串
        temp: "",
        // 属性绑定keys
        attrs: [],
        props: [],
        // 默认数据
        data: {},
        // 直接监听属性变动对象
        watch: {},
        // 原型链上的方法
        // proto: {},
        // 初始化完成后触发的事件
        // inited() {},
        // 添加进document执行的callback
        // attached() {},
        // 删除后执行的callback
        // detached() {}
    };
    assign(defaults, options);

    // 复制数据
    defaults.attrs = defaults.attrs.slice();
    defaults.props = defaults.props.slice();
    defaults.data = cloneObject(defaults.data);
    defaults.watch = assign({}, defaults.watch);

    // 装载slot字段
    let slotTags = defaults.slotTags = [];

    if (defaults.temp) {
        let {
            temp
        } = defaults;

        // 判断temp有内容的话，就必须带上 xv-content
        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = temp;

        let xvcontent = tempDiv.querySelector('[xv-content],[xv-slot="content"]');
        if (!xvcontent) {
            console.error(defaults.tag + " need container!", options);
            return;
        }

        // 查找slot字段
        let slots = tempDiv.querySelectorAll('[xv-slot]');
        if (slots) {
            slots.forEach(ele => {
                let slotName = ele.getAttribute("xv-slot");

                // content就不用加入了
                if (slotName && slotName !== "content") {
                    slotTags.push(defaults.tag + "-" + slotName);
                }
            });
        }

        // 去除无用的代码（注释代码）
        temp = temp.replace(/<!--.+?-->/g, "");

        // 准换自定义字符串数据
        var textDataArr = temp.match(/{{.+?}}/g);
        textDataArr && textDataArr.forEach((e) => {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                temp = temp.replace(e, `<xv-span xvkey="${key[1].trim()}"></xv-span>`);
            }
        });

        defaults.temp = temp;
    }

    // 判断是否有attached 或者 detached，有的话初始 全局dom监听事件
    if (defaults.attached || defaults.detached) {
        initDomObserver();
    }

    // 设置映射tag数据
    regDatabase.set(defaults.tag, defaults);

    // 尝试查找页面存在的元素
    Array.from(document.querySelectorAll(defaults.tag + '[xv-ele]')).forEach(e => {
        renderEle(e);
    });
}

// 初始化全局监听dom事件
let isInitDomObserve = 0;
const initDomObserver = () => {
    if (isInitDomObserve) {
        return;
    }
    isInitDomObserve = 1;

    // attached detached 监听
    let observer = new MutationObserver((mutations) => {
        mutations.forEach((e) => {
            let {
                addedNodes,
                removedNodes
            } = e;

            // 监听新增元素
            addedNodes && tachedArrFunc(Array.from(addedNodes), "attached", ATTACHED);

            // 监听去除元素
            removedNodes && tachedArrFunc(Array.from(removedNodes), "detached", DETACHED);
        });
    });
    observer.observe(document.body, {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true,
    });
}

const tachedArrFunc = (arr, tachedFunName, tachedKey) => {
    arr.forEach(ele => {
        if (ele.xvRender) {
            tatcheTargetFunc(ele, tachedFunName, tachedKey);
        }

        if (ele instanceof Element) {
            // 判断子元素是否包含render
            Array.from(ele.querySelectorAll('[xv-render]')).forEach(e => {
                tatcheTargetFunc(e, tachedFunName, tachedKey);
            });
        }
    });
}

const tatcheTargetFunc = (ele, tachedFunName, tachedKey) => {
    if (!ele.xvRender || ele[tachedKey]) {
        return;
    }
    let tagdata = regDatabase.get(ele.tagName.toLowerCase());
    if (tagdata[tachedFunName]) {
        tagdata[tachedFunName].call(createXHearElement(ele));
        ele[tachedKey] = 1;
    }
}