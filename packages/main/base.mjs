import { eleX, objToXEle } from "./public.mjs";
import { render, convert } from "./render.mjs";
import Xhear from "./main.mjs";
import stanz from "../stanz/src/base.mjs";
import { getType } from "../stanz/src/public.mjs";

export default function $(expr) {
  if (expr instanceof Element) {
    return eleX(expr);
  }

  if (getType(expr) === "object") {
    return objToXEle(expr);
  }

  const ele = document.querySelector(expr);

  return eleX(ele);
}

Object.assign($, { stanz, render, convert, fn: Xhear.prototype });
