import { createXhear } from "./public.mjs";
import { handler as stanzHandler, setData } from "../stanz/src/accessor.mjs";

export const handler = {
  set(target, key, value, receiver) {
    if (!/\D/.test(key)) {
      return Reflect.set(target, key, value, receiver);
    }

    return stanzHandler.set(target, key, value, receiver);
  },
  get(target, key, value, receiver) {
    if (!/\D/.test(String(key))) {
      return createXhear(target.ele.children[key]);
    }

    return Reflect.get(target, key, value, receiver);
  },
};
