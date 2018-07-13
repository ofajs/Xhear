// 基础tag记录器
let tagDatabase = {};

// debugger
glo.tagDatabase = tagDatabase;

const {
    assign,
    create,
    defineProperty,
    defineProperties
} = Object;

// function
let isUndefined = val => val === undefined;
let isRealValue = val => val !== undefined && val !== null;
const hasAttr = (e, attrName) => {
    if (!e.getAttribute) {
        return !!0;
    }
    let attr = e.getAttribute(attrName);
    if (attr !== null && attr !== undefined) {
        return !!1;
    }
};

// 获取类型
let objectToString = Object.prototype.toString;
const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');

const each = (arr, func) => Array.from(arr).forEach(func);

// 获取随机id
const getRandomId = () => Math.random().toString(32).substr(2);

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

// COMMON
// 随机字符串
const RANDOMID = "_" + getRandomId();
const SWATCH = RANDOMID + "_watchs";
const SWATCHGET = SWATCH + "_get";
const OBSERVERKEYS = RANDOMID + "_observer";
const XHEAROBJKEY = getRandomId() + "_xhearobj";
const ATTACHED_KEY = getRandomId() + "_attached";
const SHADOW_DESCRIPT_CANNOTUSE = 'shadow element can\'t use ';
const XDATA_DATAOBJ = getRandomId() + "xdatas";


// business fucntion 
const getTagData = (ele) => {
    let tagname = ele.tagName.toLowerCase();
    return tagDatabase[tagname];
}

// 生成专用shear对象
const createShearObject = (ele) => {
    let xvData = ele[XHEAROBJKEY];
    let e = create(xvData);
    e.push(ele);
    return e;
}

// 生成普通继承的$实例
const inCreate$ = arr => {
    let reObj = create(shearInitPrototype);
    reObj.splice(-1, 0, ...arr);
    if (arr.prevObject) {
        reObj.prevObject = arr.prevObject;
    }
    return reObj;
}

// 通用实例生成方法
const createShear$ = arr => {
    if (arr.length == 1 && arr[0][XHEAROBJKEY]) {
        return createShearObject(arr[0]);
    }
    return inCreate$(arr);
}

// 渲染所有的sv-ele元素
const renderAllSvEle = (jqObj) => {
    // 自己是不是sv-ele
    if (jqObj.is('[xv-ele]')) {
        jqObj.each((i, e) => {
            renderEle(e);
        });
    }

    // 查找有没有 sv-ele
    _$('[xv-ele]', Array.from(jqObj)).each((i, e) => {
        renderEle(e);
    });
}