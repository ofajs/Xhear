// x-fill 操作足够复杂，使用单独一个文件进行封装
// 舍弃原来的component带入模式，因为 template 内就能使用 component
// 在数据量小的时候使用，还是很方便的

// 根据itemData生成一个绑定数据的组件元素或模板元素
const createFillItem = ({ useTempName, temps, itemData, host, parent, index }) => {
    let template = temps.get(useTempName);

    if (!template) {
        throw {
            desc: "find out the template",
            name: useTempName,
            targetElement: host.ele
        };
    }

    // 伪造一个挂载元素的数据
    let fakeData;

    const $host = (host.$host && host.$data) ? host.$host : host;

    if (itemData instanceof XData) {
        fakeData = createXData({
            $data: itemData.mirror,
            // $host: ((host.$host && host.$data) ? host.$host : host).mirror,
            get $host() {
                return $host;
            },
            get $parent() {
                return parent;
            },
            get $index() {
                return itemData.index !== undefined ? itemData.index : index;
            }
        });

        itemData.on("updateIndex", e => {
            // debugger
            fakeData.emitHandler("updateIndex");
        });
    } else {
        fakeData = createXData({
            get $data() {
                return itemData;
            },
            set $data(val) {
                parent[index] = val;
                // parent.setData(index, val);
            },
            // $host: ((host.$host && host.$data) ? host.$host : host).mirror,
            get $host() {
                return $host;
            },
            get $parent() {
                return parent;
            },
            get $index() {
                return index;
            }
        });
    }

    fakeData[CANSETKEYS] = new Set();

    fakeData = fakeData[PROXYTHIS];

    let xNode = createXhearEle(parseToDom(template.innerHTML));

    xNode._update = false;
    xNode.__fill_item = itemData;
    xNode.__fake_item = fakeData;

    renderTemp({ sroot: xNode.ele, proxyEle: fakeData, temps });

    return {
        itemEle: xNode,
        fakeData
    };
}

/**
 * 对fill的目标对象，进行伪造虚拟对象渲染
 * @param {Element} ele 需要塞入 fake fill 的元素
 */
const renderFakeFill = ({ ele, attrName, useTempName, host, temps }) => {
    // 等待填充的 x-fill 元素
    let targetFillEle = createXhearProxy(ele);

    // 禁止元素内的update冒泡
    targetFillEle._update = false;

    let tarData = host[attrName];

    // 首次填充元素
    tarData.forEach((itemData, index) => {
        let { itemEle } = createFillItem({
            useTempName, itemData, temps, host,
            parent: tarData, index
        });

        ele.appendChild(itemEle.ele);
    });

    // 监听变动，重新设置元素
    host.watch(attrName, e => {
        let targetVal = host[attrName];

        e.trends.forEach(trend => {
            let keys = trend.keys.slice();

            // 数据设置整个数组
            if (trend.name == "setData" && trend.keys.length < attrName.split(".").length) {
                keys.push(trend.args[0]);
            }

            if (attrName == keys.join(".")) {
                // 针对当前节点的变动
                nextTick(() => {
                    // 防止变动再更新
                    targetVal = host[attrName];

                    targetFillEle.forEach(itemEle => {
                        let eleItemData = itemEle.__fill_item;

                        if (!(eleItemData instanceof XData)) {
                            itemEle.ele.parentNode.removeChild(itemEle.ele);
                        } else if (!targetVal.includes(eleItemData)) {
                            // 删除不在数据对象内的元素
                            itemEle.__fill_item = null;
                            itemEle.ele.parentNode.removeChild(itemEle.ele);
                        } else {
                            // 在元素对象内的，提前预备不内部操作的记号
                            itemEle.ele[RUNARRAY] = 1;
                        }
                    });

                    // 等待放开记号的元素
                    let need_open_runarray = targetFillEle.map(e => e.ele);

                    // 等待重新填充新的元素
                    let fragment = document.createDocumentFragment();

                    targetVal.forEach((itemData, index) => {
                        let tarItem = targetFillEle.find(e => e.__fill_item == itemData);

                        if (tarItem) {
                            fragment.appendChild(tarItem.ele);
                        } else {
                            // 新数据重新生成元素
                            let { itemEle } = createFillItem({
                                useTempName, itemData, temps, host,
                                parent: targetVal, index
                            });

                            fragment.appendChild(itemEle.ele);
                        }
                    });

                    // 重新填充
                    targetFillEle.ele.appendChild(fragment);

                    need_open_runarray.forEach(ele => ele[RUNARRAY] = 0);

                }, targetVal);
            }
        });
    });
}
