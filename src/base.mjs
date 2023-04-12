import { createXhear } from "./public.mjs";

export default function $(expr) {
  if (expr instanceof Element) {
    return createXEle(expr);
  }

  const ele = document.querySelector(expr);

  return createXhear(ele);
}

if (typeof global !== "undefined") {
  global.$ = $;
}
