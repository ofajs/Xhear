// 创建xEle元素
const createXEle = (ele) => {
    return ele.__xEle__ ? ele.__xEle__ : (ele.__xEle__ = new XEle(ele));
}

const meetTemp = document.createElement('template');
// 判断元素是否符合条件
const meetsEle = (ele, expr) => {
    if (!ele.tagName) {
        return false;
    }
    if (ele === expr) {
        return true;
    }
    if (ele === document) {
        return false;
    }
    meetTemp.innerHTML = `<${ele.tagName.toLowerCase()} ${Array.from(ele.attributes).map(e => e.name + '="' + e.value + '"').join(" ")} />`;
    return !!meetTemp.content.querySelector(expr);
}

const pstTemp = document.createElement('div');
// 转换元素
const parseStringToDom = (str) => {
    pstTemp.innerHTML = str;
    let childs = Array.from(pstTemp.children);
    return childs.map(function (e) {
        pstTemp.removeChild(e);
        return e;
    });
};

// 将对象转为element
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