import { createXhear } from "./public.mjs";

export default function $(expr) {
  if (expr instanceof Element) {
    return createXhear(expr);
  }

  const ele = document.querySelector(expr);

  return createXhear(ele);
}
