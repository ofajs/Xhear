// business function
// 判断元素是否符合条件
// const meetsEle = (ele, expr) => {
//     if (ele === expr) {
//         return !0;
//     }
//     let fadeParent = document.createElement('div');
//     if (ele === document) {
//         return false;
//     }
//     fadeParent.appendChild(ele.cloneNode(false));
//     return !!fadeParent.querySelector(expr);
// }

const meetsEle = (ele, expr) => {
    if (ele === expr) {
        return !0;
    }
    if (ele === document) {
        return false;
    }
    let tempEle = document.createElement('template');
    let html = `<${ele.tagName.toLowerCase()} ${Array.from(ele.attributes).map(e => e.name + '="' + e.value + '"').join(" ")} />`

    tempEle.innerHTML = html;
    return !!tempEle.content.querySelector(expr);
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
    objData.slot && ele.setAttribute('slot', objData.slot);
    objData.text && (ele.textContent = objData.text);
    let {
        data
    } = objData;
    data && Object.keys(data).forEach(k => {
        let val = data[k];
        ele.dataset[k] = val;
    });

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

const parseToDom = (expr) => {
    let ele;

    if (expr instanceof XhearEle) {
        return expr.ele;
    }

    switch (getType(expr)) {
        case "string":
            if (/\<.+\>/.test(expr)) {
                ele = parseStringToDom(expr);
                ele = ele[0];
            }
            break;
        case "object":
            ele = parseDataToDom(expr);
            break;
        default:
            if (expr instanceof Element || expr instanceof DocumentFragment || expr instanceof Document) {
                ele = expr;
            }
    }
    return ele;
}

/**
 * 查找元素内相匹配的元素，并以数组形式返回
 * @param {Element} target 目标节点
 * @param {String} expr 表达字符串
 */
const queAllToArray = (target, expr) => {
    let tars = target.querySelectorAll(expr);
    return tars ? Array.from(tars) : [];
}

const isXhear = (target) => target instanceof XhearEle;

// 将 element attribute 横杠转换为大小写模式
const attrToProp = key => {
    // 判断是否有横线
    if (/\-/.test(key)) {
        key = key.replace(/\-[\D]/g, (letter) => letter.substr(1).toUpperCase());
    }
    return key;
}
const propToAttr = key => {
    if (/[A-Z]/.test(key)) {
        key = key.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
    }
    return key;
}