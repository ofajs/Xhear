// xhear数据的entrend入口
const xhearEntrend = (options) => {
    let {
        target,
        key,
        value,
        receiver,
        modifyId,
        genre
    } = options;

    // 判断modifyId
    if (!modifyId) {
        // 生成随机modifyId
        modifyId = getRandomId();
    } else {
        // 查看是否已经存在这个modifyId了，存在就不折腾
        if (receiver[MODIFYIDHOST].has(modifyId)) {
            return true;
        };
    }

    // 自身添加modifyId
    receiver[MODIFYIDHOST].add(modifyId);

    // 准备打扫函数
    clearModifyIdHost(receiver);

    // 返回的数据
    let reData = true;

    // 事件实例生成
    let eveObj = new XDataEvent('update', receiver);

    let {
        ele
    } = receiver;

    // 获取影子id
    let shadowId = ele.getAttribute('xv-shadow');

    // 设置shadowId
    shadowId && (eveObj.shadow = shadowId);

    switch (genre) {
        case "handleSet":
            let oldVal;
            if (/\D/.test(key)) {
                // 替换变量数据
                oldVal = target[key];

                // 一样的值就别折腾
                if (oldVal == value) {
                    return;
                }

                // 是Object的话，转换成stanz数据
                var afterSetValue = value;
                if (afterSetValue instanceof Object) {
                    afterSetValue = cloneObject(afterSetValue);
                    afterSetValue = createXData(afterSetValue, {
                        parent: receiver,
                        hostkey: key
                    });
                }

                // 替换值
                target[key] = afterSetValue;

            } else {
                // 直接替换相应位置元素
                var afterSetValue = parseToXHearElement(value);

                if (shadowId) {
                    // 存在shadow的情况，添加的新元素也要shadow属性
                    afterSetValue.ele.setAttribute('xv-shadow', shadowId);
                }

                // 获取旧值
                let tarEle = receiver[key];
                if (tarEle) {
                    // 替换相应元素
                    let {
                        parentElement
                    } = tarEle.ele;
                    parentElement.insertBefore(afterSetValue.ele, tarEle.ele);
                    parentElement.removeChild(tarEle.ele);
                } else {
                    // 在后面添加新元素
                    let contentEle = getContentEle(ele);
                    contentEle.appendChild(afterSetValue.ele);
                }

                oldVal = tarEle;
            }

            // 添加修正数据
            eveObj.modify = {
                genre: "change",
                key,
                value,
                oldVal,
                modifyId
            };
            break;
        case "arrayMethod":
            let {
                methodName,
                args
            } = options;

            switch (methodName) {
                case "splice":
                    reData = xhearSplice(receiver, ...args);
                    break;
                case "unshift":
                    xhearSplice(receiver, 0, 0, ...args);
                    reData = receiver.length;
                    break;
                case "push":
                    xhearSplice(receiver, receiver.length, 0, ...args);
                    reData = receiver.length;
                    break;
                case "shift":
                    reData = xhearSplice(receiver, 0, 1, ...args);
                    break;
                case "pop":
                    reData = xhearSplice(receiver, receiver.length - 1, 1, ...args);
                    break;
                case "reverse":
                    var contentEle = getContentEle(receiver.ele);
                    let childs = Array.from(contentEle.children).reverse();
                    childs.forEach(e => {
                        contentEle.appendChild(e);
                    });
                    reData = this;
                    break;
                case "sort":
                    var contentEle = getContentEle(receiver.ele);
                    let arg = args[0];

                    if (arg instanceof Array) {
                        // 先做备份
                        let backupChilds = Array.from(contentEle.children);

                        // 修正顺序
                        arg.forEach(eid => {
                            contentEle.appendChild(backupChilds[eid]);
                        });
                    } else {
                        // 新生成数组
                        let arr = Array.from(contentEle.children).map(e => createXHearElement(e));
                        let backupArr = Array.from(arr);

                        // 执行排序函数
                        arr.sort(arg);

                        // 记录顺序
                        let ids = [],
                            putId = getRandomId();

                        arr.forEach(e => {
                            let id = backupArr.indexOf(e);
                            backupArr[id] = putId;
                            ids.push(id);
                        });

                        // 修正新顺序
                        arr.forEach(e => {
                            contentEle.appendChild(e.ele);
                        });

                        // 重新赋值参数
                        args = [ids];
                    }
                    break;
            }

            // 添加修正数据
            eveObj.modify = {
                genre: "arrayMethod",
                methodName,
                modifyId,
                args
            };
            break;
        default:
            return;
    }

    // update事件触发
    receiver.emit(eveObj);

    return reData;
}