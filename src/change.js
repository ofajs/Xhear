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

    switch (genre) {
        case "handleSet":
            debugger
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
                    let contentEle = getContentEle(receiver.ele);
                    let childs = Array.from(contentEle.children).reverse();
                    childs.forEach(e => {
                        contentEle.appendChild(e);
                    });
                    reData = this;
                    break;
                case "sort":
                    let contentEle = getContentEle(receiver.ele);
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
        case "handleDelete":
            // 是不会出现handleDelete的情况的，删除数据属于不合法行为
            break;
    }

    // update事件触发
    receiver.emit(eveObj);

    return reData;
}