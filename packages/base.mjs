import render from "./render/index.mjs";

function $(expr) {
  return render(expr);
}

globalThis.$ = $;
