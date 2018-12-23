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
// XhearElement寄存在element内的函数寄宿对象key
const XHEAREVENT = "_xevent_" + getRandomId();
// xhearElement初始化存放的变量key
const XHEARELEMENT = "_xhearEle_" + getRandomId();
// 属于可动变量的key组合
const EXKEYS = "_exkeys_" + getRandomId();
// const PROTO = '_proto_' + getRandomId();
// const ATTACHED = "_attached_" + getRandomId();
// const DETACHED = "_detached_" + getRandomId();
// const XHEARDATA = "_xheardata_" + getRandomId();

// database
// 注册数据
const regDatabase = new Map();

let {
    defineProperty,
    defineProperties,
    assign
} = Object;

// business function

// 将element转换成xhearElement
const createXHearElement = (ele) => {
    let xhearData = ele[XHEARELEMENT];
    if (!xhearData) {
        xhearData = new XhearElement(ele);
        ele[XHEARELEMENT] = xhearData;
    }
    return xhearData;
}

// 转化成XhearElement
const parseToXHearElement = (tar) => {
    return createXHearElement(tar);
}

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
    return !!fadeParent.querySelector(expr);
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