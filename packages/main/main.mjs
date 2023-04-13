import { createXhear } from "./public.mjs";
import { handler } from "./accessor.mjs";
import { getType } from "../stanz/src/public.mjs";
import { constructor } from "../stanz/src/main.mjs";
import fnInstallWatch from "../stanz/src/watch.mjs";
const { defineProperties, getOwnPropertyDescriptor, entries } = Object;

export default class Xhear {
  constructor({ ele }) {
    const proxySelf = constructor.call(this, handler);

    defineProperties(this, {
      _owner: {
        get() {
          const { parentNode } = ele;

          return parentNode ? [createXhear(parentNode)] : [];
        },
      },
      ele: {
        get: () => ele,
      },
    });

    ele.__xhear__ = proxySelf;

    return proxySelf;
  }

  get length() {
    return this.ele.children.length;
  }

  $(expr) {
    const target = this.ele.querySelector(expr);
    return target ? null : createXhear(target);
  }

  all(expr) {
    return Array.from(this.ele.querySelectorAll(expr)).map(createXhear);
  }

  get tag() {
    return this.ele.tagName.toLowerCase();
  }

  get text() {
    return this.ele.textContent;
  }

  set text(val) {
    this.ele.textContent = val;
  }

  get html() {
    return this.ele.innerHTML;
  }

  set html(val) {
    this.ele.innerHTML = val;
  }

  get class() {
    return this.ele.classList;
  }

  get data() {
    return this.ele.dataset;
  }

  get css() {
    return getComputedStyle(this.ele);
  }

  get style() {
    return this.ele.style;
  }

  set style(d) {
    if (getType(d) == "string") {
      this.ele.style = d;
      return;
    }

    let { style } = this;

    // Covering the old style
    let hasKeys = Array.from(style);
    let nextKeys = Object.keys(d);

    // Clear the unused key
    hasKeys.forEach((k) => {
      if (!nextKeys.includes(k)) {
        style[k] = "";
      }
    });

    Object.assign(style, d);
  }
}

fnInstallWatch(Xhear);
