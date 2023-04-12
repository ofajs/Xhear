import Stanz from "./main.mjs";
export const getRandomId = () => Math.random().toString(32).slice(2);

export const isxdata = (val) => val instanceof Stanz;

const objectToString = Object.prototype.toString;
export const getType = (value) =>
  objectToString
    .call(value)
    .toLowerCase()
    .replace(/(\[object )|(])/g, "");

export const isObject = (obj) => {
  const type = getType(obj);
  return type === "array" || type === "object";
};

export function nextTick(callback) {
  if (typeof process === "object" && typeof process.nextTick === "function") {
    process.nextTick(callback);
  } else {
    Promise.resolve().then(callback);
  }
}

export function debounce(func, wait = 0) {
  let timeout = null;
  let hisArgs = [];

  return function (...args) {
    if (timeout === null) {
      timeout = 1;
      (wait > 0 ? setTimeout : nextTick)(() => {
        func.call(this, hisArgs);
        hisArgs = [];
        timeout = null;
      }, wait);
    }
    hisArgs.push(...args);
  };
}
