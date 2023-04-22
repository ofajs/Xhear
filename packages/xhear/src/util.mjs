import Xhear from "./main.mjs";
import { getType } from "../../stanz/src/public.mjs";

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

const temp = document.createElement("div");

export const strToXEle = (str) => {
  temp.innerHTML = str;
  const ele = temp.children[0] || temp.childNodes[0];
  temp.innerHTML = "";

  return eleX(ele);
};

export const createXEle = (expr, exprType) => {
  if (expr instanceof Xhear) {
    return expr;
  }

  if (expr instanceof Element) {
    return eleX(expr);
  }

  const type = getType(expr);

  switch (type) {
    case "object":
      return objToXEle(expr);
    case "string":
      return strToXEle(expr);
  }
};
