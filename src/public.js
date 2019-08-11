// business function
// 判断元素是否符合条件
const meetsEle = (ele, expr) => {
    if (ele === expr) {
        return !0;
    }
    let fadeParent = document.createElement('div');
    if (ele === document) {
        return false;
    }
    fadeParent.appendChild(ele.cloneNode(false));
    return !!fadeParent.querySelector(expr);
}

// 转换元素
const parseStringToDom = (str) => {
    let par = document.createElement('div');
    par.innerHTML = str;
    let childs = Array.from(par.childNodes);
    return childs.filter(function (e) {
        if (!(e instanceof Text) || (e.textContent && e.textContent.trim())) {
            par.removeChild(e);
            return e;
        }
    });
};

const parseDataToDom = (objData) => {
    if (!objData.tag) {
        console.error("this data need tag =>", objData);
        throw "";
    }

    // 生成element
    let ele = document.createElement(objData.tag);

    // 添加数据
    objData.class && ele.setAttribute('class', objData.class);
    objData.text && (ele.textContent = objData.text);
    if (objData.data) {
        let {
            data
        } = objData;

        Object.keys(data).forEach(k => {
            let val = data[k];
            ele.dataset[k] = val;
        });
    }

    if (ele.xvele) {
        let xhearele = createXhearEle(ele);

        xhearele[CANSETKEYS].forEach(k => {
            let val = objData[k];
            if (!isUndefined(val)) {
                xhearele[k] = val;
            }
        });
    }

    // 填充子元素
    let akey = 0;
    while (akey in objData) {
        // 转换数据
        let childEle = parseDataToDom(objData[akey]);
        ele.appendChild(childEle);
        akey++;
    }

    return ele;
}