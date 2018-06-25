// 基础tag记录器
let tagDatabase = {};

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
const OBSERVERKEYS = RANDOMID + "_observer";