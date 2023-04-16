import Xhear from "./main.mjs";
import { getType } from "../stanz/src/public.mjs";

export const createXhear = (ele) => {
  if (ele.__xhear__) {
    return ele.__xhear__;
  }

  return new Xhear({ ele });
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
