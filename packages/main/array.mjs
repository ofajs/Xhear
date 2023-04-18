import { isFunction } from "./public.mjs";
import { createXEle, eleX } from "./util.mjs";
import { emitUpdate } from "../stanz/src/watch.mjs";

const originSplice = (ele, start, count, ...items) => {
  const { children } = ele;
  const removes = [];
  for (let i = start, len = start + count; i < len; i++) {
    const target = children[i];
    removes.push(target);
  }

  removes.forEach((el) => el.remove());

  if (items.length) {
    const frag = document.createDocumentFragment();
    items.forEach((e) => frag.append(createXEle(e).ele));

    const positionEle = children[start];
    if (positionEle) {
      ele.insertBefore(frag, positionEle);
    } else {
      ele.appendChild(frag);
    }
  }

  return removes;
};

const mutatingMethods = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "reverse",
  "sort",
  "fill",
  "copyWithin",
];

const likeArrayFn = {
  push(...args) {
    const { ele } = this;

    originSplice(ele, ele.children.length, 0, ...args);

    emitUpdate({
      type: "array",
      currentTarget: this,
      target: this,
      args,
      name: "push",
    });

    return ele.children.length;
  },

  pop(...args) {
    const { ele } = this;

    const targets = originSplice(ele, ele.children.length - 1, 1, ...args);

    emitUpdate({
      type: "array",
      currentTarget: this,
      target: this,
      args,
      name: "pop",
    });

    return eleX(targets[0]);
  },

  shift(...args) {
    const { ele } = this;

    const targets = originSplice(ele, 0, 1, ...args);

    emitUpdate({
      type: "array",
      currentTarget: this,
      target: this,
      args,
      name: "shift",
    });

    return eleX(targets[0]);
  },

  unshift(...args) {
    const { ele } = this;

    originSplice(ele, 0, 0, ...args);

    emitUpdate({
      type: "array",
      currentTarget: this,
      target: this,
      args,
      name: "unshift",
    });

    return ele.children.length;
  },
  splice(...args) {
    const reVal = originSplice(this.ele, ...args);

    emitUpdate({
      type: "array",
      currentTarget: this,
      target: this,
      args,
      name: "splice",
    });

    return reVal.map(eleX);
  },
};

["reverse", "sort"].forEach((name) => {
  likeArrayFn[name] = function (...args) {
    const childs = Array.from(this.ele.childNodes).map(eleX);

    arrayFn[name].call(childs, ...args);

    const frag = document.createDocumentFragment();
    childs.forEach((e) => frag.append(e.ele));
    this.ele.append(frag);

    emitUpdate({
      type: "array",
      currentTarget: this,
      target: this,
      args,
      name,
    });

    return this;
  };
});

const arrayFn = Array.prototype;

Object.keys(Object.getOwnPropertyDescriptors(arrayFn)).forEach((key) => {
  if (
    key === "constructor" ||
    key === "length" ||
    mutatingMethods.includes(key)
  ) {
    return;
  }

  const targetFunc = arrayFn[key];

  if (isFunction(targetFunc)) {
    likeArrayFn[key] = function (...args) {
      return targetFunc.apply(Array.from(this.ele.children).map(eleX), args);
    };
  }
});

export default class LikeArray {}

for (let [name, value] of Object.entries(likeArrayFn)) {
  Object.defineProperty(LikeArray.prototype, name, {
    value,
  });
}
