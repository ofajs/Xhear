import { createXhear } from "./public.mjs";
import stanz from "../stanz/src/base.mjs";
import { render, convert } from "./render.mjs";
import Xhear from "./main.mjs";

export default function $(expr) {
  if (expr instanceof Element) {
    return createXhear(expr);
  }

  const ele = document.querySelector(expr);

  return createXhear(ele);
}

Object.assign($, { stanz, render, convert, fn: Xhear.prototype });
