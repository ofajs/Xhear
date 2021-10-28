// 公用方法文件
// 创建xEle元素
const createXEle = (ele) => {
    if (!ele) {
        return null;
    }
    return ele.__xEle__ ? ele.__xEle__ : (ele.__xEle__ = new XEle(ele));
}

// 判断元素是否符合条件
const meetTemp = document.createElement('template');
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

// 转换元素
const parseStringToDom = (str) => {
    const pstTemp = document.createElement('div');
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
    // objData.text && (ele.textContent = objData.text);

    const xele = createXEle(ele);

    // 数据合并
    xele[CANSETKEYS].forEach(k => {
        if (objData[k]) {
            xele[k] = objData[k];
        }
    });

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

// 对象获取值，优化对象多点key获取值
const getXData = (xdata, key) => {
    if (typeof key === 'string' && key.includes('.')) {
        let tar = xdata;
        key.split(".").forEach(k => {
            tar = tar[k];
        });
        return tar;
    } else {
        return xdata[key];
    }
}

// 对象设置值，优化对象多点key设置值
const setXData = (xdata, key, value) => {
    if (typeof key === 'string' && key.includes('.')) {
        let tar = xdata, tarKey = key;
        let key_arr = key.split("."), lastid = key_arr.length - 1;
        key_arr.forEach((k, index) => {
            if (index === lastid) {
                tarKey = k;
                return;
            }
            tar = xdata[k];
        });

        tar[tarKey] = value;
    } else {
        xdata[key] = value;
    }
}