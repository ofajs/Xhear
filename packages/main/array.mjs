import { createXEle } from "./public.mjs";
import { emitUpdate } from "../stanz/src/watch.mjs";

const originSplice = (_this, start, count, ...items) => {};

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

const arrayFn = {
  push(...args) {
    const fragment = document.createDocumentFragment();
    args.forEach((data) => {
      const $e = createXEle(data);
      fragment.append($e.ele);
    });

    this.ele.append(fragment);

    emitUpdate({
      type: "array",
      currentTarget: this,
      target: this,
      args,
      name: "push",
    });

    return this.ele.children.length;
  },
};

export default arrayFn;
