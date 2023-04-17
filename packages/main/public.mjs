import Xhear from "./main.mjs";
import { getType } from "../stanz/src/public.mjs";

export const eleX = (ele) => {
  if (ele.__xhear__) {
    return ele.__xhear__;
  }

  return new Xhear({ ele });
};

export const objToXEle = (obj) => {
  const data = { ...obj };

  if (!obj.tag) {
    return null;
  }

  const ele = document.createElement(obj.tag);
  delete data.tag;
  const $ele = eleX(ele);

  Object.assign($ele, data);

  return $ele;
};

export const createXEle = (expr) => {
  if (expr instanceof Xhear) {
    return expr;
  }

  if (expr instanceof Element) {
    return eleX(expr);
  }

  if (getType(expr) === "object") {
    return objToXEle(expr);
  }
};

export const isFunction = (val) => getType(val).includes("function");

export const hyphenToUpperCase = (str) =>
  str.replace(/-([a-z])/g, (match, p1) => {
    return p1.toUpperCase();
  });

export const getNextNode = (ele) => {
  let nextEle = ele;
  do {
    nextEle = nextEle.nextSibling;
  } while (nextEle instanceof Text);

  return nextEle;
};
