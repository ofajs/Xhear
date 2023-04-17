import { createXhear } from "./public.mjs";
import { handler } from "./accessor.mjs";
import renderFn from "./render.mjs";
import { conditionJudge, refreshCondition } from "./condition.mjs";
import eventFn from "./event.mjs";
import { getType, extend } from "../stanz/src/public.mjs";
import { constructor } from "../stanz/src/main.mjs";
import watchFn from "../stanz/src/watch.mjs";
const { defineProperties } = Object;

export default class Xhear {
  constructor({ ele }) {
    const proxySelf = constructor.call(this, {}, handler);

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

  extend(obj, desc) {
    return extend(this, obj, desc);
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

  get classList() {
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

  set if(val) {
    const { ele } = this;

    ele.__conditionType = "if";
    ele.__condition = val;
    refreshCondition(ele);
  }

  set elseIf(val) {
    const { ele } = this;

    ele.__condition = val;
    if (ele.__conditionType) {
      return;
    }

    conditionJudge(ele, "elseIf");
  }

  set else(v) {
    const { ele } = this;

    if (ele.__conditionType) {
      return;
    }

    conditionJudge(ele, "else");
  }
}

Xhear.prototype.extend(
  { ...watchFn, ...eventFn, ...renderFn },
  {
    enumerable: false,
  }
);
