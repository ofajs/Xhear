import { getType } from "../../stanz/src/public.mjs";

export const isFunction = (val) => getType(val).includes("function");

export const hyphenToUpperCase = (str) =>
  str.replace(/-([a-z])/g, (match, p1) => {
    return p1.toUpperCase();
  });

export function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

export const toDashCase = (str) => {
  return str.replace(/[A-Z]/g, function (match) {
    return "-" + match.toLowerCase();
  });
};

// Determine if an element is eligible
export const meetsEle = (ele, expr) => {
  const temp = document.createElement("template");
  temp.content.append(ele.cloneNode());
  return !!temp.content.querySelector(expr);
};
