import { getType } from "../stanz/src/public.mjs";

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

export const isArrayEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
};
