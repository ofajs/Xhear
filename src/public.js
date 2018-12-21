// 获取随机id
const getRandomId = () => Math.random().toString(32).substr(2);
let objectToString = Object.prototype.toString;
const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
const isUndefined = val => val === undefined;
// 克隆object
const cloneObject = obj => JSON.parse(JSON.stringify(obj));

// 设置不可枚举的方法
const setNotEnumer = (tar, obj) => {
    for (let k in obj) {
        defineProperty(tar, k, {
            // enumerable: false,
            writable: true,
            value: obj[k]
        });
    }
}

//改良异步方法
const nextTick = (() => {
    let isTick = false;
    let nextTickArr = [];
    return (fun) => {
        if (!isTick) {
            isTick = true;
            setTimeout(() => {
                for (let i = 0; i < nextTickArr.length; i++) {
                    nextTickArr[i]();
                }
                nextTickArr = [];
                isTick = false;
            }, 0);
        }
        nextTickArr.push(fun);
    };
})();

// common
const PROTO = '_proto_' + getRandomId();
const XHEAREVENT = "_xevent_" + getRandomId();
const EXKEYS = "_exkeys_" + getRandomId();
const ATTACHED = "_attached_" + getRandomId();
const DETACHED = "_detached_" + getRandomId();
const XHEARDATA = "_xheardata_" + getRandomId();

// database
// 注册数据
const regDatabase = new Map();

let {
    defineProperty,
    defineProperties,
    assign
} = Object;

// 获取 content 容器
const getContentEle = (tarEle) => {
    let contentEle = tarEle;

    // 判断是否xvRender
    while (contentEle.xvRender) {
        let xhearData = contentEle[XHEARDATA];

        if (xhearData) {
            let {
                $content
            } = xhearData;

            if ($content) {
                contentEle = $content.ele;
            } else {
                break;
            }
        }
    }

    return contentEle;
}

// 获取父容器
const getParentEle = (tarEle) => {
    let {
        parentElement
    } = tarEle;

    if (!parentElement) {
        return;
    }

    while (parentElement.xvContent) {
        parentElement = parentElement[XHEARDATA].$host.ele;
    }

    return parentElement;
}

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
    return fadeParent.querySelector(expr) ? true : false;
}

// 转换元素
const parseStringToDom = (str) => {
    let par = document.createElement('div');
    par.innerHTML = str;
    let childs = Array.from(par.childNodes);
    return childs.filter(function (e) {
        if (!(e instanceof Text) || (e.textContent && e.textContent.trim())) {
            return e;
        }
    });
};

// 渲染所有xv-ele
const renderAllXvEle = (ele) => {
    // 判断内部元素是否有xv-ele
    let eles = ele.querySelectorAll('[xv-ele]');
    Array.from(eles).forEach(e => {
        renderEle(e);
    });

    let isXvEle = ele.getAttribute('xv-ele');
    if (!isUndefined(isXvEle) && isXvEle !== null) {
        renderEle(ele);
    }
}

// 转换 xhearData 到 element
const parseDataToDom = (data) => {
    if (data.tag && !(data instanceof XhearElement)) {
        let ele = document.createElement(data.tag);

        data.class && ele.setAttribute('class', data.class);
        data.text && (ele.textContent = data.text);

        // 判断是否xv-ele
        let {
            xvele
        } = data;

        let xhearEle;

        if (xvele) {
            ele.setAttribute('xv-ele', "");
            renderEle(ele);
            xhearEle = createXHearElement(ele);

            // 数据合并
            xhearEle[EXKEYS].forEach(k => {
                let val = data[k];
                !isUndefined(val) && (xhearEle[k] = val);
            });
        }

        // 填充内容
        let akey = 0;
        while (akey in data) {
            let childEle = parseDataToDom(data[akey]);

            if (xvele && xhearEle) {
                let {
                    $content
                } = xhearEle;

                if ($content) {
                    $content.ele.appendChild(childEle);
                }
            } else {
                ele.appendChild(childEle);
            }
            akey++;
        }

        return ele;
    }
}

// main
const createXHearElement = ele => {
    if (!ele) {
        return;
    }
    let xhearData = ele[XHEARDATA];
    if (!xhearData) {
        xhearData = new XhearElement(ele);
        ele[XHEARDATA] = xhearData;
    }

    // 防止内存泄露，隔离 xhearData 和 ele
    let xhearEle = Object.create(xhearData);
    defineProperties(xhearEle, {
        ele: {
            enumerable: false,
            value: ele
        }
    });
    xhearEle = new Proxy(xhearEle, XhearElementHandler);
    return xhearEle;
};
const parseToXHearElement = expr => {
    if (expr instanceof XhearElement) {
        return expr;
    }

    let reobj;

    // expr type
    let exprType = getType(expr);

    if (expr instanceof Element) {
        renderAllXvEle(expr);
        reobj = createXHearElement(expr);
    } else if (exprType == "string") {
        reobj = parseStringToDom(expr)[0];
        renderAllXvEle(reobj);
        reobj = createXHearElement(reobj);
    } else if (exprType == "object") {
        reobj = parseDataToDom(expr);
        reobj = createXHearElement(reobj);
    }

    return reobj;
}