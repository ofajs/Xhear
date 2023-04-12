import Xhear from "./main.mjs";

export const createXhear = (ele) => {
  if (ele.__xhear__) {
    return ele.__xhear__;
  }
  
  return new Xhear({ ele });
};
