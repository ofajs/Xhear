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
