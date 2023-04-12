import { createXhear } from "./public.mjs";
import { handler as stanzHandler } from "./stanz/accessor.mjs";

export const handler = {
  set(target, key, value, receiver) {
    if (typeof key === "symbol") {
      return Reflect.set(target, key, value, receiver);
    }

    console.log("set => ", key, value);
    return Reflect.set(target, key, value, receiver);
  },
  get(target, key, value, receiver) {
    if (!/\D/.test(key)) {
      return createXhear(target.ele.children[key]);
    }

    return Reflect.get(target, key, value, receiver);
  },
};
