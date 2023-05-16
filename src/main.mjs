import { eleX } from "./util.mjs";
import { meetsEle } from "./public.mjs";
import { handler } from "./accessor.mjs";
import renderFn from "./render/render.mjs";
import syncFn from "./render/sync.mjs";
import eventFn from "./event.mjs";
import LikeArray from "./array.mjs";
import formFn, { initFormEle } from "./form.mjs";
import { getType, extend } from "../node_modules/stanz/src/public.mjs";
import Stanz, { constructor } from "../node_modules/stanz/src/main.mjs";
import watchFn from "../node_modules/stanz/src/watch.mjs";
import "./render/condition.mjs";
import "./render/fill.mjs";
const { defineProperties } = Object;

const init = ({ _this, ele, proxySelf }) => {
  const descs = {
    owner: {
      get() {
        const { parentNode } = ele;
        const { _owner } = _this;
        const arr = parentNode ? [eleX(parentNode), ..._owner] : [..._owner];
        return new Set(arr);
      },
    },
    ele: {
      get: () => ele,
    },
  };

  const tag = ele.tagName && ele.tagName.toLowerCase();

  if (tag) {
    descs.tag = {
      enumerable: true,
      value: tag,
    };
  }

  defineProperties(_this, descs);

  initFormEle(proxySelf);
};

export default class Xhear extends LikeArray {
  constructor({ ele }) {
    super();

    const proxySelf = constructor.call(this, {}, handler);

    init({
      _this: this,
      ele,
      proxySelf,
    });

    ele.__xhear__ = proxySelf;

    return proxySelf;
  }

  get length() {
    return this.ele.children.length;
  }

  $(expr) {
    const target = this.ele.querySelector(expr);
    return target ? eleX(target) : null;
  }

  all(expr) {
    return Array.from(this.ele.querySelectorAll(expr)).map(eleX);
  }

  extend(obj, desc) {
    return extend(this, obj, desc);
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

  get shadow() {
    return eleX(this.ele.shadowRoot);
  }

  get root() {
    const rootNode = this.ele.getRootNode();
    return rootNode ? eleX(rootNode) : null;
  }
  get host() {
    let root = this.ele.getRootNode();
    let { host } = root;
    return host ? eleX(host) : null;
  }

  get parent() {
    let { parentNode } = this.ele;
    return !parentNode || parentNode === document ? null : eleX(parentNode);
  }

  get parents() {
    const parents = [];
    let target = this;
    while (target.parent) {
      target = target.parent;
      parents.push(target);
    }
    return parents;
  }

  get next() {
    const nextEle = this.ele.nextElementSibling;
    return nextEle ? eleX(nextEle) : null;
  }

  get nexts() {
    const { parent } = this;
    const selfIndex = this.index;
    return parent.filter((e, i) => i > selfIndex);
  }

  get prev() {
    const prevEle = this.ele.previousElementSibling;
    return prevEle ? eleX(prevEle) : null;
  }

  get prevs() {
    const { parent } = this;
    const selfIndex = this.index;
    return parent.filter((e, i) => i < selfIndex);
  }

  get siblings() {
    return this.parent.filter((e) => e !== this);
  }

  get index() {
    let { parentNode } = this.ele;

    if (!parentNode) {
      return null;
    }

    return Array.prototype.indexOf.call(parentNode.children, this.ele);
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

  get width() {
    return parseInt(getComputedStyle(this.ele).width);
  }

  get height() {
    return parseInt(getComputedStyle(this.ele).height);
  }

  get clientWidth() {
    return this.ele.clientWidth;
  }

  get clientHeight() {
    return this.ele.clientHeight;
  }

  get offsetWidth() {
    return this.ele.offsetWidth;
  }

  get offsetHeight() {
    return this.ele.offsetHeight;
  }

  get outerWidth() {
    let computedStyle = getComputedStyle(this.ele);
    return (
      this.ele.offsetWidth +
      parseInt(computedStyle["margin-left"]) +
      parseInt(computedStyle["margin-right"])
    );
  }

  get outerHeight() {
    let computedStyle = getComputedStyle(this.ele);
    return (
      this.ele.offsetHeight +
      parseInt(computedStyle["margin-top"]) +
      parseInt(computedStyle["margin-bottom"])
    );
  }

  is(expr) {
    return meetsEle(this.ele, expr);
  }

  remove() {
    this.ele.remove();
  }
}

const sfn = Stanz.prototype;
const fn = Xhear.prototype;

fn.extend(
  {
    get: sfn.get,
    toJSON: sfn.toJSON,
    toString: sfn.toString,
    ...watchFn,
    ...eventFn,
    ...renderFn,
    ...syncFn,
    ...formFn,
  },
  {
    enumerable: false,
  }
);