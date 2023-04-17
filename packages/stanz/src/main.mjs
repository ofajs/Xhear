import { extend, getRandomId } from "./public.mjs";
import { handler as stanzHandler } from "./accessor.mjs";
import arrayFn from "./array.mjs";
import watchFn from "./watch.mjs";
const { defineProperties, getOwnPropertyDescriptor, entries } = Object;

export const SELF = Symbol("self");
export const PROXY = Symbol("proxy");
export const WATCHS = Symbol("watchs");

export function constructor(data, handler = stanzHandler) {
  // const proxySelf = new Proxy(this, handler);
  let { proxy: proxySelf, revoke } = Proxy.revocable(this, handler);

  // Determines the properties of the listener bubble
  proxySelf._update = 1;

  let watchs;

  defineProperties(this, {
    xid: { value: data.xid || getRandomId() },
    // Save all parent objects
    _owner: {
      configurable: true,
      value: [],
    },
    owner: {
      get() {
        return new Set(this._owner);
      },
    },
    [SELF]: {
      configurable: true,
      get: () => this,
    },
    [PROXY]: {
      configurable: true,
      get: () => proxySelf,
    },
    // Save the object of the listener function
    [WATCHS]: {
      get: () => watchs || (watchs = new Map()),
    },
    _hasWatchs: {
      get: () => !!watchs,
    },
    _revoke: {
      value: revoke,
    },
  });

  Object.keys(data).forEach((key) => {
    const descObj = getOwnPropertyDescriptor(data, key);
    let { value, get, set } = descObj;

    if (get || set) {
      defineProperties(this, {
        [key]: descObj,
      });
    } else {
      // Set the function directly
      proxySelf[key] = value;
    }
  });

  return proxySelf;
}

export default class Stanz extends Array {
  constructor(data) {
    super();

    return constructor.call(this, data);
  }

  // This method is still in the experimental period
  revoke() {
    const self = this[SELF];
    entries(this).forEach(([name, value]) => {
      if (isxdata(value)) {
        this[name] = null;
      }
    });
    self._owner.forEach((parent) => {
      entries(parent).forEach(([name, value]) => {
        if (value === this) {
          parent[name] = null;
        }
      });
    });
    delete self[SELF];
    delete self[PROXY];
    self._revoke();
  }

  toJSON() {
    let obj = {};

    let isPureArray = true;
    let maxId = 0;

    Object.keys(this).forEach((k) => {
      let val = this[k];

      if (!/\D/.test(k)) {
        k = parseInt(k);
        if (k > maxId) {
          maxId = k;
        }
      } else {
        isPureArray = false;
      }

      if (isxdata(val)) {
        val = val.toJSON();
      }

      obj[k] = val;
    });

    if (isPureArray) {
      obj.length = maxId + 1;
      obj = Array.from(obj);
    }

    const xid = this.xid;
    defineProperties(obj, {
      xid: {
        get: () => xid,
      },
    });

    return obj;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  extend(obj, desc) {
    return extend(this, obj, desc);
  }
}

Stanz.prototype.extend(
  { ...watchFn, ...arrayFn },
  {
    enumerable: false,
  }
);

export const isxdata = (val) => val instanceof Stanz;