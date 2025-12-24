//! xhear - v7.5.32 https://github.com/ofajs/Xhear  (c) 2018-2025 YAO
// const error_origin = "http://127.0.0.1:5793/errors";
const error_origin = "https://ofajs.github.io/ofa-errors/errors";

// 存放错误信息的数据对象
const errors = {
  load_fail: "Load {url} failed",
  load_fail_status: "Load {url} failed, status code: {status}",
  load_module: "Load module failed, module address: {url}",
  no_alias: "No alias found: {name}, so '{url}' request is invalid",
  config_alias_name_error: "Error in setting alias, must start with '@'",
  alias_already: "Alias ​​'{name}' already exists",
  alias_relate_name:
    "Alias ​​cannot be configured with relative address, '{name}': '{path}'",
  failed_to_set_data: "Error in setting attribute value {key}",
  failed_to_get_data: "Error in getting {key}",
  nexttick_thread_limit:
    "nextTick exceeds thread limit, may have an infinite loop, please try to repair or optimize the function",
  not_func: "The callback parameter of the {name} method must be a Function",
  not_found_func:
    "The '{name}' method was not found on the target {tag}. Please define the '{name}' method on the 'proto' of the component {tag}",
  invalid_key:
    "The parameters for registering the '{compName}' component are incorrect. The '{name}' on '{targetName}' is already occupied. Please change '{name}' to another name.",
  xhear_wrap_no_parent:
    "The target element has no parent element, the warp method cannot be used",
  xhear_unwrap_has_siblings:
    "The target element contains adjacent nodes, the unwrap method cannot be used",
  xhear_reander_err: "Failed to render the tag '{tag}'",
  xhear_register_exists:
    "The component '{name}' already exists, and this component cannot be registered repeatedly",
  xhear_register_err: "Error in registering the '{tag}' component",
  xhear_validate_tag:
    "The registered component name '{str}' is incorrect. For the Web Components naming rules, please refer to: https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#valid_custom_element_names ",
  xhear_tag_noline:
    "The registered component name '{str}' is incorrect and contains at least one '-' character; Web Components For naming rules, please refer to: https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#valid_custom_element_names ",
  xhear_regster_data_noset:
    "Error in registering component {tag}, custom data cannot have data of type 'Set' or 'Map'",
  xhear_regster_data_nofunc:
    "Registration component {tag} error, functions cannot appear in custom data, please put the function in 'proto'; or change '{key}' to '_{key}'",
  xhear_fakenode_unclose:
    "This is an unclosed FakeNode; use the wrong attribute name: {name}",
  xhear_fill_tempname: "Fill component template '{name}' not found",
  xhear_eval:
    "Template syntax '{name}' error, expression {name}:{arg0}=\"{arg1}\"",
  xhear_listen_already:
    "An old listener already exists, and this element is rendering incorrectly. ",
  xhear_dbfill_noname:
    "Only fill components with the 'name' attribute can be rendered in the fill component",
  xhear_temp_exist: "Template '{name}' already exists",
  xhear_sync_no_options:
    "Direct use of the 'sync' method is not allowed, it is only used for template rendering",
  xhear_sync_object_value:
    "Cannot use 'sync' to synchronize values ​​of Object type, target {targetName}",
  loading_nothing: "Loading function has no return content",
  app_src_change:
    "The app element that has been initialized cannot modify the src attribute",
  no_cross_access_func:
    "To jump to a page across domains, you must set the access function",
  access_return_error: "Jumping to {src} is not allowed",
  load_comp_module:
    "Error loading component module, wrong module address: {url}",
  comp_registered:
    "Component '{tag}' has been registered, and the component cannot be registered again",
  "inject-link-rel":
    "The rel attribute value of the link element in the inject-host component can only be 'stylesheet'",
  "use-data-inject":
    "Please do not use data() on the style element in the inject-host, because it will cause serious performance crisis",
  load_page_module: "Loading page module {url} failed",
  page_no_defaults:
    "The current page ({src}) has been rendered and cannot be rendered again",
  not_page_module:
    "{src} is not a page module and cannot be set as the src of the page component",
  page_failed: "Loading page failed: {src}",
  fetch_temp_err: "Page module {url} failed to load template {tempSrc}",
  page_wrap_fetch: "Page {before} failed to get the parent page ({current})",
  context_change_name:
    "Changing the 'name' of {compName} may cause performance issues, please avoid changing this property",
  no_provider:
    "The consumer named '{name}' was not captured by the corresponding provider",
  page_invalid_key:
    "The registration parameters of page {src} are incorrect. '{name}' on '{targetName}' is already taken. Please change '{name}' to another name.",
  root_provider_exist:
    "An exception occurred in the root provider named '{name}'. The root provider component can only appear once",
  root_provider_name_change:
    "An exception occurred in the root provider named '{name}'. The root provider component cannot change the 'name' attribute",
  change_lm_src:
    "{tag} element changes 'src' attribute invalid, this attribute can only be set once.",
  error_no_owner:
    "This data is incorrect, the owner has not registered this object",
  circular_data: "An object with a circular reference",
  fill_type:
    "'value' of 'x-fill' must be of type Array, the current value is of type {type}",
  fill_key_duplicates: "The key in the fill component is repeated",
  render_el_error: "Rendering element failed, rendering error is {expr}",
  temp_multi_child:
    "The template element can only contain one child element. If multiple child elements appear, the child elements will be repackaged in a <div> element",
  temp_wrap_child:
    "The template '{tempName}' contains {len} child elements, which have been wrapped in a div element with the attribute '{wrapName}'.",
  app_noback:
    "This is already the first page, and the 'back' operation cannot be performed again",
  invalidated_inject_host: "This element will be invalidated in 'inject-host'",
  olink_out_app: "The element of [olink] is only allowed in o-app",
  app_noforward:
    "This is the last page, you can no longer perform the 'forward' operation",
  need_forwards:
    "The target o-app does not allow forward operations, please add the '_forwards' attribute to the target; or in the app config file, add 'export const allowForward = true' ",
  watchuntil_timeout: "watchUntil timed out, target value not monitored",
};

if (globalThis.navigator && navigator.language) {
  let langFirst = navigator.language.toLowerCase().split("-")[0];

  if (langFirst === "zh" && navigator.language.toLowerCase() !== "zh-cn") {
    langFirst = "zhft";
  }

  // 根据用户的语言首字母加载对应的错误匹配库，匹配开发人员报错信息
  (async () => {
    if (!globalThis.localStorage) {
      // 不支持 localStorage，不加载错误库
      return;
    }

    if (globalThis.navigator && !navigator.onLine) {
      // 网络不可用，不加载错误库
      return;
    }

    if (localStorage["ofa-errors"]) {
      const targetLangErrors = JSON.parse(localStorage["ofa-errors"]);
      Object.assign(errors, targetLangErrors);
    }

    const errCacheTime = localStorage["ofa-errors-time"];

    if (!errCacheTime || Date.now() > Number(errCacheTime) + 5 * 60 * 1000) {
      const targetLangErrors = await fetch(`${error_origin}/${langFirst}.json`)
        .then((e) => e.json())
        .catch(() => null);

      if (targetLangErrors) {
        localStorage["ofa-errors"] = JSON.stringify(targetLangErrors);
        localStorage["ofa-errors-time"] = Date.now();
      } else {
        targetLangErrors = await fetch(`${error_origin}/en.json`)
          .then((e) => e.json())
          .catch((error) => {
            return null;
          });
      }

      Object.assign(errors, targetLangErrors);
    }
  })();
}

let isSafari = false;
if (globalThis.navigator) {
  isSafari =
    navigator.userAgent.includes("Safari") &&
    !navigator.userAgent.includes("Chrome");
}

/**
 * 根据键、选项和错误对象生成错误对象。
 *
 * @param {string} key - 错误描述的键。
 * @param {Object} [options] - 映射相关值的选项对象。
 * @param {Error} [error] - 原始错误对象。
 * @returns {Error} 生成的错误对象。
 */
const getErr = (key, options, error) => {
  let desc = getErrDesc(key, options);

  let errObj;
  if (error) {
    if (isSafari) {
      desc += `\nCaused by: ${error.toString()}\n`;

      if (error.stack) {
        desc += `  ${error.stack.replace(/\n/g, "\n    ")}`;
      }
    }
    errObj = new Error(desc, { cause: error });
  } else {
    errObj = new Error(desc);
  }
  errObj.code = key;
  return errObj;
};

/**
 * 根据键、选项生成错误描述
 *
 * @param {string} key - 错误描述的键。
 * @param {Object} [options] - 映射相关值的选项对象。
 * @returns {string} 生成的错误描述。
 */
const getErrDesc = (key, options) => {
  if (!errors[key]) {
    return `Error code: "${key}", please go to https://github.com/ofajs/ofa-errors to view the corresponding error information`;
  }

  let desc = errors[key];

  // 映射相关值
  if (options) {
    for (let k in options) {
      desc = desc.replace(new RegExp(`{${k}}`, "g"), options[k]);
    }
  }

  return desc;
};

const getRandomId = () => Math.random().toString(32).slice(2);

const objectToString = Object.prototype.toString;
const getType = (value) =>
  objectToString
    .call(value)
    .toLowerCase()
    .replace(/(\[object )|(])/g, "");

const isObject = (obj) => {
  const type = getType(obj);
  return type === "array" || type === "object";
};

// export const isDebug = {
//   value: null,
// };

// try {
//   const fileUrl = import.meta.url;
//   isDebug.value = fileUrl.includes("#debug");
// } catch (err) {
//   isDebug.value = false;
// }

// const TICKERR = "nexttick_thread_limit";

let asyncsCounter = 0;
let afterTimer;
function nextTick(callback) {
  clearTimeout(afterTimer);
  afterTimer = setTimeout(() => {
    asyncsCounter = 0;
  });

  // if (isDebug.value) {
  Promise.resolve().then(() => {
    asyncsCounter++;
    if (asyncsCounter > 100000) {
      const err = getErr("nexttick_thread_limit");
      console.warn(err, "lastCall => ", callback);
      throw err;
    }

    callback();
  });
  return;
  // }

  // const tickId = `t-${getRandomId()}`;
  // tickSets.add(tickId);
  // Promise.resolve().then(() => {
  //   asyncsCounter++;
  //   // console.log("asyncsCounter => ", asyncsCounter);
  //   if (asyncsCounter > 50000) {
  //     tickSets.clear();

  //     const err = getErr(TICKERR);
  //     console.warn(err, "lastCall => ", callback);
  //     throw err;
  //   }
  //   if (tickSets.has(tickId)) {
  //     callback();
  //     tickSets.delete(tickId);
  //   }
  // });
  // return tickId;
}

// export const clearTick = (id) => tickSets.delete(id);

function debounce(func, wait = 0) {
  let timeout = null;
  let hisArgs = [];

  return function (...args) {
    hisArgs.push(...args);

    if (wait > 0) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.call(this, hisArgs);
        hisArgs = [];
        timeout = null;
      }, wait);
    } else {
      if (timeout === null) {
        timeout = 1;
        nextTick(() => {
          timeout = null;
          const args = hisArgs.slice();
          hisArgs = [];
          func.call(this, args);
        });
      }
    }
  };
}

// Enhanced methods for extending objects
const extend = (_this, proto, descriptor = {}) => {
  [
    ...Object.getOwnPropertyNames(proto),
    ...Object.getOwnPropertySymbols(proto),
  ].forEach((k) => {
    const result = Object.getOwnPropertyDescriptor(proto, k);
    const { configurable, enumerable, writable, get, set, value } = result;

    if ("value" in result) {
      if (_this.hasOwnProperty(k)) {
        _this[k] = value;
      } else {
        Object.defineProperty(_this, k, {
          enumerable,
          configurable,
          writable,
          ...descriptor,
          value,
        });
      }
    } else {
      Object.defineProperty(_this, k, {
        enumerable,
        configurable,
        ...descriptor,
        get,
        set,
      });
    }
  });

  return _this;
};

// 检测 Proxy 是否被撤销的函数
function dataRevoked(proxyToCheck) {
  try {
    // 尝试对 Proxy 做一个无害的操作，例如获取原型
    Object.getPrototypeOf(proxyToCheck);
    return false; // 如果没有抛出错误，则 Proxy 没有被撤销
  } catch (error) {
    if (error instanceof TypeError) {
      return true; // 如果抛出了 TypeError，则 Proxy 已经被撤销
    }
    // throw error; // 抛出其他类型的错误
    return false;
  }
}

const isFunction = (val) => getType(val).includes("function");

const hyphenToUpperCase = (str) =>
  str.replace(/-([a-z])/g, (match, p1) => {
    return p1.toUpperCase();
  });

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const toDashCase = (str) => {
  return str.replace(/[A-Z]/g, function (match) {
    return "-" + match.toLowerCase();
  });
};

function isEmptyObject(obj) {
  if (!obj) {
    return false;
  }
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

const removeArrayValue = (arr, target) => {
  const index = arr.indexOf(target);
  if (index > -1) {
    arr.splice(index, 1);
  }
};

const searchEle = (el, expr) => {
  if (el instanceof HTMLTemplateElement) {
    return Array.from(el.content.querySelectorAll(expr));
  }
  return Array.from(el.querySelectorAll(expr));
};

function mergeObjects(obj1, obj2) {
  for (let key of Object.keys(obj1)) {
    if (!obj2.hasOwnProperty(key)) {
      delete obj1[key];
    }
  }

  for (let [key, value] of Object.entries(obj2)) {
    obj1[key] = value;
  }
}

const isSafariBrowser = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const { assign: assign$1, freeze } = Object;

class Watcher {
  constructor(opts) {
    assign$1(this, opts);
    freeze(this);
  }

  hasModified(k) {
    if (this.type === "array") {
      return this.path.includes(this.currentTarget.get(k));
    }

    const keys = k.split(".");

    if (this.currentTarget === this.target && this.name === keys[0]) {
      return true;
    }

    const modifieds = getModifieds(this, keys);

    const positionIndex = modifieds.indexOf(this.target);
    if (positionIndex > -1) {
      const currentKeys = keys.slice(positionIndex + 1);

      if (!currentKeys.length) {
        // This is listening for changes in the child object itself
        return true;
      }

      return this.name === currentKeys[0];
    }

    // Data belonging to the chain of change
    return this.path.includes(this.currentTarget[k]);
  }

  hasReplaced(k) {
    if (this.type !== "set") {
      return false;
    }

    const keys = k.split(".");

    if (this.target === this.currentTarget && this.name === keys[0]) {
      return true;
    }

    const modifieds = getModifieds(this, keys);

    const positionIndex = modifieds.indexOf(this.target);

    if (positionIndex > -1) {
      const currentKeys = keys.slice(positionIndex + 1);

      return currentKeys[0] === this.name;
    }

    return false;
  }
}

const getModifieds = (_this, keys) => {
  const modifieds = [];

  const cloneKeys = keys.slice();
  let target = _this.currentTarget;
  while (cloneKeys.length) {
    const targetKey = cloneKeys.shift();
    if (target) {
      target = target[targetKey];
    }

    modifieds.push(target);
  }

  return modifieds;
};

class Watchers extends Array {
  constructor(arr) {
    super(...arr);
  }

  hasModified(key) {
    return this.some((e) => e.hasModified(key));
  }

  hasReplaced(key) {
    return this.some((e) => e.hasReplaced(key));
  }
}

const emitUpdate = ({
  type,
  currentTarget,
  target,
  name,
  value,
  oldValue,
  args,
  path = [],
}) => {
  if (path && path.includes(currentTarget)) {
    const err = getErr("circular_data");

    console.warn(err, {
      currentTarget,
      target,
      path,
    });

    return;
  }

  let options = {
    type,
    target,
    name,
    oldValue,
    value,
  };

  if (type === "array") {
    delete options.value;
    options.args = args;
  }

  if (currentTarget._hasWatchs) {
    const watcher = new Watcher({
      currentTarget,
      ...options,
      path: [...path],
    });

    currentTarget[WATCHS].forEach((func) => {
      func(watcher);
    });
  }

  currentTarget._update &&
    currentTarget.owner.forEach((parent) => {
      emitUpdate({
        currentTarget: parent,
        ...options,
        path: [currentTarget, ...path],
      });
    });
};

var watchFn = {
  watch(callback) {
    if (!(callback instanceof Function)) {
      throw getErr("not_func", { name: "watch" });
    }

    const wid = "w-" + getRandomId();

    this[WATCHS].set(wid, callback);

    return wid;
  },

  unwatch(wid) {
    return this[WATCHS].delete(wid);
  },

  watchTick(callback, wait) {
    if (!(callback instanceof Function)) {
      throw getErr("not_func", { name: "watchTick" });
    }

    return this.watch(
      debounce((arr) => {
        if (dataRevoked(this)) {
          // console.warn(`The revoked object cannot use watchTick : `, this);
          return;
        }
        arr = arr.filter((e) => {
          try {
            e.path.forEach((item) => item.xid);
          } catch (err) {
            return false;
          }

          return true;
        });

        callback(new Watchers(arr));
      }, wait || 0)
    );
  },
  // For manual use of emitUpdate
  refresh(opts) {
    const options = {
      ...opts,
      type: "refresh",
      target: this,
      currentTarget: this,
    };
    emitUpdate(options);
  },
  watchUntil(func, outTime = 30000) {
    return new Promise((resolve, reject) => {
      let f;
      let timer;
      const tid = this.watch(
        (f = () => {
          const bool = func();
          if (bool) {
            clearTimeout(timer);
            this.unwatch(tid);
            resolve(this);
          }
        })
      );

      timer = setTimeout(() => {
        this.unwatch(tid);
        const err = getErr("watchuntil_timeout");
        console.warn(err, func, this);
        reject(err);
      }, outTime);

      f();
    });
  },
};

const mutatingMethods$1 = [
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

const holder = Symbol("placeholder");

function compareArrays(oldArray, newArray) {
  const backupNewArray = Array.from(newArray);
  const backupOldArray = Array.from(oldArray);
  const deletedItems = [];
  const addedItems = new Map();

  const oldLen = oldArray.length;
  for (let i = 0; i < oldLen; i++) {
    const oldItem = oldArray[i];
    const newIndex = backupNewArray.indexOf(oldItem);
    if (newIndex > -1) {
      backupNewArray[newIndex] = holder;
    } else {
      deletedItems.push(oldItem);
    }
  }

  const newLen = newArray.length;
  for (let i = 0; i < newLen; i++) {
    const newItem = newArray[i];
    const oldIndex = backupOldArray.indexOf(newItem);
    if (oldIndex > -1) {
      backupOldArray[oldIndex] = holder;
    } else {
      addedItems.set(i, newItem);
    }
  }

  return { deletedItems, addedItems };
}

const fn$1 = {};

const arrayFn$1 = Array.prototype;

mutatingMethods$1.forEach((methodName) => {
  if (arrayFn$1[methodName]) {
    fn$1[methodName] = function (...args) {
      const backupArr = Array.from(this);

      const reval = arrayFn$1[methodName].apply(this[SELF], args);

      const { deletedItems, addedItems } = compareArrays(backupArr, this);

      // Refactoring objects as proxy instances
      for (let [key, value] of addedItems) {
        if (isxdata(value)) {
          value._owner.push(this);
        } else if (isObject(value)) {
          this.__unupdate = 1;
          this[key] = value;
          delete this.__unupdate;
        }
      }

      for (let item of deletedItems) {
        clearOwner(item, this);
      }

      emitUpdate({
        type: "array",
        currentTarget: this,
        target: this,
        args,
        name: methodName,
        oldValue: backupArr,
      });

      if (reval === this[SELF]) {
        return this[PROXY];
      }

      return reval;
    };
  }
});

// Object.getOwnPropertyNames(Array.prototype).forEach((methodName) => {
["concat", "filter", "slice", "flatMap", "map"].forEach((methodName) => {
  if (methodName === "constructor" || mutatingMethods$1.includes(methodName)) {
    return;
  }

  const oldFunc = Array.prototype[methodName];
  if (oldFunc instanceof Function) {
    fn$1[methodName] = function (...args) {
      return oldFunc.call(Array.from(this), ...args);
    };
  }
});

const { defineProperties: defineProperties$2, getOwnPropertyDescriptor, entries } = Object;

const SELF = Symbol("self");
const PROXY = Symbol("proxy");
const WATCHS = Symbol("watchs");
const ISXDATA = Symbol("isxdata");

const isxdata = (val) => val && !!val[ISXDATA];

function constructor(data, handler = handler$1) {
  // const proxySelf = new Proxy(this, handler);
  let { proxy: proxySelf, revoke } = Proxy.revocable(this, handler);

  // Determines the properties of the listener bubble
  proxySelf._update = 1;

  let watchs;

  defineProperties$2(this, {
    xid: { value: data.xid || getRandomId() },
    // Save all parent objects
    _owner: {
      value: [],
    },
    owner: {
      configurable: true,
      get() {
        return new Set(this._owner);
      },
    },
    [ISXDATA]: {
      value: true,
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
    __init_is_array: {
      value: Array.isArray(data),
    },
  });

  Object.keys(data).forEach((key) => {
    const descObj = getOwnPropertyDescriptor(data, key);
    let { value, get, set } = descObj;

    if (get || set) {
      defineProperties$2(this, {
        [key]: descObj,
      });
    } else {
      // Set the function directly
      proxySelf[key] = value;
    }
  });

  return proxySelf;
}

class Stanz extends Array {
  constructor(data, options) {
    // options是被继承的类库使用的参数，当前stanz不需要使用
    super();

    return constructor.call(this, data);
  }

  // This method is still in the experimental period
  revoke() {
    const self = this[SELF];

    if (self._onrevokes) {
      self._onrevokes.forEach((f) => f());
      self._onrevokes.length = 0;
    }

    self.__unupdate = 1;

    self[WATCHS].clear();

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
    let maxId = -1;

    const initIsArray = this.__init_is_array;

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

      if (!obj.length && !initIsArray) {
        // 初始化不是数组，就是对象
        obj = {};
      }
    }
    const xid = this.xid;
    defineProperties$2(obj, {
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

  get(key) {
    if (/\./.test(key)) {
      const keys = key.split(".");
      let target = this;
      for (let i = 0, len = keys.length; i < len; i++) {
        try {
          target = target[keys[i]];
        } catch (error) {
          const err = getErr(
            "failed_to_get_data",
            {
              key: keys.slice(0, i).join("."),
            },
            error
          );

          console.warn(err, {
            key,
            self: this,
          });

          throw err;
        }
      }

      return target;
    }

    return this[key];
  }
  set(key, value) {
    if (/\./.test(key)) {
      const keys = key.split(".");
      const lastKey = keys.pop();
      let target = this;
      for (let i = 0, len = keys.length; i < len; i++) {
        try {
          target = target[keys[i]];
        } catch (error) {
          const err = getErr(
            "failed_to_get_data",
            {
              key: keys.slice(0, i).join("."),
            },
            error
          );

          console.warn(err, {
            key,
            self: this,
          });

          throw err;
        }
      }

      return (target[lastKey] = value);
    }

    return (this[key] = value);
  }
}

Stanz.prototype.extend(
  { ...watchFn, ...fn$1 },
  {
    enumerable: false,
  }
);

const { defineProperties: defineProperties$1 } = Object;

const setData = ({ target, key, value, receiver, type, succeed }) => {
  const oldValue = receiver[key];

  let data = value;
  if (isxdata(data)) {
    if (oldValue === value) {
      return true;
    }
    data._owner.push(receiver);
  } else if (isObject(value)) {
    const desc = Object.getOwnPropertyDescriptor(target, key);
    if (!desc || desc.hasOwnProperty("value")) {
      data = new (target.__OriginStanz || Stanz)(value, {
        owner: receiver,
      });

      data._owner.push(receiver);
    }
  }

  const isSame = oldValue === value;

  if (!isSame && isxdata(oldValue)) {
    clearOwner(oldValue, receiver);
  }

  const reval = succeed(data);

  !isSame &&
    // __unupdate: Let the system not trigger an upgrade, system self-use attribute
    !target.__unupdate &&
    emitUpdate({
      type: type || "set",
      target: receiver,
      currentTarget: receiver,
      name: key,
      value,
      oldValue,
    });

  return reval;
};

// 当数据被移除时，清除 owner 数据
const clearOwner = (targetData, owner) => {
  if (isxdata(targetData)) {
    const index = targetData._owner.indexOf(owner);
    if (index > -1) {
      targetData._owner.splice(index, 1);
    } else {
      const err = getErr("error_no_owner");
      console.warn(err, {
        owner,
        mismatch: targetData,
      });
      console.error(err);
    }
  }
};

const handler$1 = {
  set(target, key, value, receiver) {
    if (typeof key === "symbol") {
      return Reflect.set(target, key, value, receiver);
    }

    // Set properties with _ prefix directly
    if (/^_/.test(key)) {
      if (!target.hasOwnProperty(key)) {
        defineProperties$1(target, {
          [key]: {
            writable: true,
            configurable: true,
            value,
          },
        });
      } else {
        Reflect.set(target, key, value, receiver);
      }
      return true;
    }

    try {
      return setData({
        target,
        key,
        value,
        receiver,
        succeed(data) {
          return Reflect.set(target, key, data, receiver);
        },
      });
    } catch (error) {
      const err = getErr(
        "failed_to_set_data",
        {
          key,
        },
        error
      );

      console.warn(err, { target, value });

      throw err;
    }
  },
  deleteProperty(target, key) {
    if (/^_/.test(key) || typeof key === "symbol") {
      return Reflect.deleteProperty(target, key);
    }

    return setData({
      target,
      key,
      value: undefined,
      receiver: target[PROXY],
      type: "delete",
      succeed() {
        return Reflect.deleteProperty(target, key);
      },
    });
  },
};

// const tempEl = document.createElement("template");

const handler = {
  set(target, key, value, receiver) {
    if (!/\D/.test(String(key))) {
      return Reflect.set(target, key, value, receiver);
    }

    if (target[key] === value) {
      // Optimise performance;
      // fix focus remapping caused by 'text' being reset
      return true;
    }

    if (key === "html") {
      // When setting HTML values that contain single quotes, they become double quotes when set, leading to an infinite loop of updates.
      // tempEl.innerHTML = value;
      // value = tempEl.innerHTML;

      // If custom elements are stuffed, the html values may remain inconsistent
      return Reflect.set(target, key, value, receiver);
    }

    return handler$1.set(target, key, value, receiver);
  },
  get(target, key, receiver) {
    if (!/\D/.test(String(key))) {
      return eleX(target.ele.children[key]);
    }

    return Reflect.get(target, key, receiver);
  },
  ownKeys(target) {
    let keys = Reflect.ownKeys(target);
    let len = target.ele.children.length;
    for (let i = 0; i < len; i++) {
      keys.push(String(i));
    }
    return keys;
  },
  getOwnPropertyDescriptor(target, key) {
    if (typeof key === "string" && !/\D/.test(key)) {
      return {
        enumerable: true,
        configurable: true,
      };
    }
    return Reflect.getOwnPropertyDescriptor(target, key);
  },
};

const renderExtends = {
  beforeConvert() {},
  afterConvert() {},
  beforeRender() {},
  render() {},
};

const getRevokes = (target) => target.__revokes || (target.__revokes = []);
const addRevoke = (target, revoke) => getRevokes(target).push(revoke);

const convertToFunc = (expr, data, opts) => {
  const funcStr = `
const dataRevoked = ${dataRevoked.toString()};
const [$event] = $args;
const {data, errCall} = this;
if(dataRevoked(data)){
  return;
}
try{
  with(data){
    return ${expr};
  }
}catch(error){
  if(data.ele && !data.ele.isConnected){
    return;
  }
  if(errCall){
    const result = errCall(error);
    if(result !== false){
      console.error(error);
    }
  }else{
    console.error(error);
  }
}
`;
  return new Function("...$args", funcStr).bind({ data, ...opts });
};

function render({
  data,
  target,
  template,
  temps,
  isRenderSelf, // 是否将当前target元素也渲染处理
  ...otherOpts
}) {
  // try {
  //   data.watchTick;
  // } catch (e) {
  //   // data 已经被回收，不需要继续操作
  //   return;
  // }

  const content = template && template.innerHTML;

  if (content) {
    target.innerHTML = content;
  }

  renderExtends.beforeRender({
    target,
  });

  const texts = searchEle(target, "xtext");

  const tasks = [];
  const revokes = getRevokes(target);

  // Styles with data() function to monitor and correct rendering
  searchEle(target, "style").forEach((el) => {
    const originStyle = el.innerHTML;

    if (/data\(.+\)/.test(originStyle)) {
      const matchs = Array.from(new Set(originStyle.match(/data\(.+?\)/g))).map(
        (dataExpr) => {
          const expr = dataExpr.replace(/data\((.+)\)/, "$1");
          const func = convertToFunc(expr, data);

          return {
            dataExpr,
            func,
          };
        }
      );

      const renderStyle = () => {
        let afterStyle = originStyle;

        matchs.forEach(({ dataExpr, func }) => {
          afterStyle = afterStyle.replace(dataExpr, func());
        });

        if (el.innerHTML !== afterStyle) {
          el.innerHTML = afterStyle;
        }
      };
      tasks.push(renderStyle);

      const revokeStyle = () => {
        matchs.length = 0;
        removeArrayValue(tasks, renderStyle);
        removeArrayValue(getRevokes(el), revokeStyle);
        removeArrayValue(revokes, revokeStyle);
      };

      addRevoke(el, revokeStyle);
      revokes.push(revokeStyle);
    }
  });

  // Render text nodes
  texts.forEach((el) => {
    const textEl = document.createTextNode("");
    const { parentNode } = el;
    parentNode.insertBefore(textEl, el);
    parentNode.removeChild(el);

    const func = convertToFunc(el.getAttribute("expr"), data);
    const renderFunc = () => {
      const content = func();
      if (textEl.textContent !== String(content)) {
        textEl.textContent = content;
      }
    };
    tasks.push(renderFunc);

    const textRevoke = () => {
      removeArrayValue(revokes, textRevoke);
      removeArrayValue(tasks, renderFunc);
      removeArrayValue(getRevokes(textEl), textRevoke);
    };
    revokes.push(textRevoke);
    addRevoke(textEl, textRevoke);
  });

  const eles = searchEle(target, `[x-bind-data]`);

  if (isRenderSelf && target.matches(`[x-bind-data]`)) {
    eles.unshift(target);
  }

  // Render properties based on expressions
  eles.forEach((el) => {
    const bindData = JSON.parse(el.getAttribute("x-bind-data"));

    const $el = eleX(el);

    for (let [actionName, arr] of Object.entries(bindData)) {
      arr.forEach((args) => {
        try {
          const { always } = $el[actionName];
          let afterArgs = [];

          let workResult;

          const work = () => {
            const [key, expr] = args;

            const func = convertToFunc(expr, data, {
              errCall: (error) => {
                const errorExpr = `:${key}="${expr}"`;
                const err = getErr(
                  "render_el_error",
                  {
                    expr: errorExpr,
                  },
                  error
                );

                console.warn(err, {
                  target: $el.ele,
                  errorExpr,
                });
                console.error(err);

                return false;
              },
            });

            afterArgs = [key, func];

            const reval = $el[actionName](...afterArgs, {
              actionName,
              target: $el,
              data,
              beforeArgs: args,
              args: afterArgs,
            });

            renderExtends.render({
              step: "refresh",
              args,
              name: actionName,
              target: $el,
            });

            return reval;
          };

          let clearRevs = () => {
            const { revoke: methodRevoke } = $el[actionName];

            if (methodRevoke) {
              methodRevoke({
                actionName,
                target: $el,
                data,
                beforeArgs: args,
                args: afterArgs,
                result: workResult,
              });
            }

            removeArrayValue(revokes, clearRevs);
            removeArrayValue(getRevokes(el), clearRevs);
            removeArrayValue(tasks, work);
            clearRevs = null;
          };

          if (always) {
            // Run every data update
            tasks.push(work);
          } else {
            workResult = work();
          }

          revokes.push(clearRevs);
          if (el !== target) {
            addRevoke(el, clearRevs);
          }
        } catch (error) {
          const err = getErr(
            "xhear_eval",
            {
              name: actionName,
              arg0: args[0],
              arg1: args[1],
            },
            error
          );
          console.warn(err, el);
          throw err;
        }
      });
    }

    el.removeAttribute("x-bind-data");

    el._bindingRendered = true;
    el.dispatchEvent(new Event("binding-rendered"));
  });

  if (!target.__render_temps && !isEmptyObject(temps)) {
    target.__render_temps = temps;
  }

  if (target.__render_data && target.__render_data !== data) {
    const err = getErr("xhear_listen_already");

    console.warn(err, {
      element: target,
      old: target.__render_data,
      new: data,
    });

    throw err;
  }

  target.__render_data = data;

  if (tasks.length) {
    tasks.forEach((f) => f());

    // After the data changes, traverse the rendering tasks
    try {
      const wid = data.watchTick((e) => {
        if (tasks.length) {
          tasks.forEach((f) => f());
        } else {
          data.unwatch(wid);
        }
      });
    } catch (error) {
      // console.error('watchTick error:', error);
      return;
    }
  }

  renderExtends.render({ step: "init", target });
}

const convertEl = (el) => {
  const { tagName } = el;

  if (tagName === "TEMPLATE") {
    return;
  }

  if (tagName) {
    // Converting elements
    const obj = {};

    Array.from(el.attributes).forEach((attr) => {
      const matchData = /(.*):(.+)/.exec(attr.name);

      if (!matchData) {
        return;
      }

      let [, actionName, param0] = matchData;

      if (!actionName) {
        actionName = "prop";
      }

      const targetActions = obj[actionName] || (obj[actionName] = []);

      targetActions.push([param0, attr.value]);

      el.removeAttribute(attr.name);
    });

    const keys = Object.keys(obj);

    if (keys.length) {
      el.setAttribute("x-bind-data", JSON.stringify(obj));
    }
  }

  Array.from(el.children).forEach(convertEl);
};

const searchTemp = (template, expr, func) => {
  const rearr = Array.from(template.content.querySelectorAll(expr));

  if (func) {
    rearr.forEach(func);
  }

  return rearr;
};

let isWarned;

const convert = (template) => {
  let temps = {};
  const codeEls = {};

  renderExtends.beforeConvert({
    template,
  });

  searchTemp(template, "code", (code) => {
    const cid = getRandomId();
    code.setAttribute("code-id", cid);

    codeEls[cid] = code.innerHTML;
    code.innerHTML = "";
  });

  template.innerHTML = template.innerHTML.replace(
    /{{(.+?)}}/g,
    (str, match) => {
      return `<xtext expr="${match}"></xtext>`;
    }
  );

  const tempName = template.getAttribute("name");

  if (tempName) {
    const tempChilds = template.content.children;
    if (tempChilds.length > 1) {
      if (!isWarned) {
        const err = getErr("temp_multi_child");
        console.warn(err, {
          content: template.content,
        });
        isWarned = 1;
      }

      const wrapName = `wrapper-${tempName}`;
      template.innerHTML = `<div ${wrapName} style="display:contents">${template.innerHTML}</div>`;
      console.warn(
        getErr("temp_wrap_child", {
          tempName,
          len: tempChilds.length,
          wrapName,
        })
      );
    }
    temps[tempName] = template;
    template.remove();
  }

  searchTemp(template, "x-fill:not([name])", (fillEl) => {
    if (fillEl.querySelector("x-fill:not([name])")) {
      throw getErr("xhear_dbfill_noname");
    }

    if (fillEl.innerHTML.trim()) {
      const tid = `t${getRandomId()}`;
      fillEl.setAttribute("name", tid);

      const temp = document.createElement("template");
      temp.setAttribute("name", tid);
      temp.innerHTML = fillEl.innerHTML;
      fillEl.innerHTML = "";
      fillEl.appendChild(temp);
    }
  });

  searchTemp(template, "x-if,x-else-if,x-else", (condiEl) => {
    const firstChild = condiEl.children[0];
    if (!firstChild || firstChild.tagName !== "TEMPLATE") {
      condiEl.innerHTML = `<template condition>${condiEl.innerHTML}</template>`;
    }
  });

  searchTemp(template, "template", (e) => {
    const newTemps = convert(e);

    Object.keys(newTemps).forEach((tempName) => {
      if (temps[tempName]) {
        throw getErr("xhear_temp_exist", {
          name: tempName,
        });
      }
    });

    temps = { ...temps, ...newTemps };
  });

  Array.from(template.content.children).forEach((el) => convertEl(el));

  // Restore the contents of the code
  for (let [key, value] of Object.entries(codeEls)) {
    searchTemp(template, `[code-id="${key}"]`, (el) => {
      el.removeAttribute("code-id");
      // el.innerHTML = htmlEncode(value);
      el.innerHTML = value;
    });
  }

  renderExtends.afterConvert({
    template,
    temps,
  });

  return temps;
};

const getVal = (val) => {
  if (isFunction(val)) {
    return val();
  }

  return val;
};

const defaultData = {
  prop(...args) {
    let [name, value] = args;

    if (args.length === 1) {
      return this[name];
    }

    value = getVal(value);
    name = hyphenToUpperCase(name);

    this.set(name, value);
  },
  attr(...args) {
    let [name, value] = args;

    const { ele } = this;

    if (args.length === 1) {
      return ele.getAttribute(name);
    }

    value = getVal(value);

    if (value === false) {
      value = null;
    } else if (value === true) {
      value = "";
    }

    if (value === null || value === undefined) {
      ele.removeAttribute(name);
    } else if (ele.getAttribute(name) != value) {
      ele.setAttribute(name, value);
    }
  },
  class(...args) {
    let [name, value] = args;

    if (args.length === 1) {
      return this.ele.classList.contains(name);
    }

    value = getVal(value);

    if (value) {
      this.ele.classList.add(name);
    } else {
      this.ele.classList.remove(name);
    }
  },
  watch(...args) {
    if (args.length < 3) {
      return watchFn.watch.apply(this, args);
    }

    const options = args[2];
    const { beforeArgs, data: target } = options;
    const [selfPropName, targetPropName] = beforeArgs;
    const propName = hyphenToUpperCase(selfPropName);

    const setData = () => {
      let val = this.get(propName);
      target.set(targetPropName, val);
    };

    const wid = this.watch((e) => {
      if (e.hasModified(propName)) {
        setData();
      }
    });

    // Initialize once
    setData();

    return () => {
      this.unwatch(wid);
    };
  },
};

defaultData.prop.always = true;
defaultData.attr.always = true;
defaultData.class.always = true;

defaultData.prop.revoke = ({ target, args, $ele, data }) => {
  const propName = args[0];

  const oldVal = target.get(propName);
  if (isxdata(oldVal)) {
    target.set(propName, {});
  }
};

defaultData.watch.revoke = (e) => {
  e.result();
  const propName = e.beforeArgs[1];

  const oldVal = e.data.get(propName);
  if (isxdata(oldVal)) {
    e.data.set(propName, {});
  }
};

const syncFn = {
  sync(propName, targetName, options) {
    if (!options) {
      throw getErr("xhear_sync_no_options");
    }

    [propName, targetName] = options.beforeArgs;

    propName = hyphenToUpperCase(propName);
    targetName = hyphenToUpperCase(targetName);

    const { data } = options;

    const val = data.get(targetName);

    if (val instanceof Object) {
      const err = getErr("xhear_sync_object_value", { targetName });
      console.warn(err, data);
      throw err;
    }

    this[propName] = data.get(targetName);

    const wid1 = this.watch((e) => {
      if (e.hasModified(propName)) {
        try {
          const value = this.get(propName);
          data.set(targetName, value);
        } catch (err) {
          // Errors are reported when a proxy is revoked.
          // console.warn(err);
        }
      }
    });

    const wid2 = data.watch((e) => {
      if (e.hasModified(targetName)) {
        try {
          const value = data.get(targetName);
          this.set(propName, value);
        } catch (err) {
          // Errors are reported when a proxy is revoked.
          // console.warn(err);
        }
      }
    });

    return () => {
      this.unwatch(wid1);
      if (!dataRevoked(data)) {
        data.unwatch(wid2);
      }
    };
  },
};

syncFn.sync.revoke = (e) => {
  e.result();
};

function getBindOptions(name, func, options) {
  let revoker;
  if (options) {
    const beforeValue = options.beforeArgs[1];

    if (!/[^\d\w_\$\.]/.test(beforeValue)) {
      func = options.data.get(beforeValue);
      if (!func) {
        const tag = options.data.tag;
        const err = getErr("not_found_func", {
          name: beforeValue,
          tag: tag ? `"${tag}"` : "",
        });
        console.warn(err, " target =>", options.data);
        throw err;
      }
      func = func.bind(options.data);
    }

    revoker = () => this.ele.removeEventListener(name, func);
  }

  return { revoker, name, func };
}

const eventFn = {
  on(...args) {
    const { revoker, name, func } = getBindOptions.call(this, ...args);

    this.ele.addEventListener(name, func);

    if (revoker) {
      return revoker;
    }

    return this;
  },
  one(...args) {
    const { revoker, name, func } = getBindOptions.call(this, ...args);

    let callback = (e) => {
      this.off(name, callback);
      func(e);
    };

    this.ele.addEventListener(name, callback);

    if (revoker) {
      return revoker;
    }

    return this;
  },
  off(name, func) {
    this.ele.removeEventListener(name, func);
    return this;
  },
  emit(name, opts) {
    const options = { ...opts };

    let data;
    if (options.hasOwnProperty("data")) {
      data = options.data;
      delete options.data;
    }

    let event;

    if (name instanceof Event) {
      event = name;
    } else if (name) {
      event = new Event(name, { bubbles: true, ...options });
    }

    event.data = data;

    this.ele.dispatchEvent(event);

    return this;
  },
};

eventFn.on.revoke = (e) => {
  e.result();
};

eventFn.one.revoke = (e) => {
  e.result();
};

const originSplice = (ele, start, count, ...items) => {
  const { children } = ele;
  if (start < 0) {
    start += ele.children.length;
  }

  if (count === undefined) {
    count = ele.children.length - start;
  }

  const removes = [];
  for (let i = start, len = start + count; i < len; i++) {
    const target = children[i];
    removes.push(target);
  }

  removes.forEach((el) => el && el.remove());

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
  reverse(...args) {
    const childs = Array.from(this.ele.childNodes);

    arrayFn.reverse.call(childs, ...args);

    const frag = document.createDocumentFragment();

    childs.forEach((ele) => {
      // Identify internal operations to prevent detached corrections
      ele.__internal = 1;
      frag.append(ele);
    });

    this.ele.append(frag);

    childs.forEach((ele) => {
      delete ele.__internal;
    });

    emitUpdate({
      type: "array",
      currentTarget: this,
      target: this,
      args,
      name: "reverse",
    });

    return this;
  },
  sort(...args) {
    const childs = Array.from(this.ele.children).map(eleX);

    arrayFn.sort.call(childs, ...args);

    const frag = document.createDocumentFragment();

    childs.forEach((e) => {
      e.ele.__internal = 1;
      frag.append(e.ele);
    });

    this.ele.append(frag);

    childs.forEach((e) => {
      delete e.ele.__internal;
    });

    emitUpdate({
      type: "array",
      currentTarget: this,
      target: this,
      args,
      name: "sort",
    });

    return this;
  },
};

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

class LikeArray {}

for (let [name, value] of Object.entries(likeArrayFn)) {
  Object.defineProperty(LikeArray.prototype, name, {
    value,
  });
}

const stanz = (data) => {
  return new Stanz(data);
};

Object.assign(stanz, { is: isxdata });

const { defineProperty, assign } = Object;

const hasValueEleNames = ["input", "textarea", "select"];

const setKeys = (keys, $ele) => {
  const { ele } = $ele;

  keys.forEach((k) => {
    if (k in ele) {
      let isNum = false;
      defineProperty($ele, k, {
        enumerable: true,
        get: () => {
          let val = ele[k];
          if (isNum) {
            if (/\D/.test(val)) {
              isNum = false;
            } else {
              val = Number(val);
            }
          }
          return val;
        },
        set: (val) => {
          isNum = typeof val === "number";
          ele[k] = val;
        },
      });
    }
  });
};

const formEleNames = new Set([
  ...hasValueEleNames,
  "option",
  "button",
  "label",
  "fieldset",
  "legend",
  "form",
]);

const bindProp = ($ele, opts = {}) => {
  const { name: keyName, type } = opts;

  const { ele } = $ele;
  let old = ele[keyName];

  $ele.on(type, () => {
    emitUpdate({
      type: "set",
      target: $ele,
      currentTarget: $ele,
      name: keyName,
      value: ele[keyName],
      oldValue: old,
    });

    old = ele[keyName];
  });
};

const initFormEle = ($ele) => {
  const { tag } = $ele;

  if (!formEleNames.has(tag)) {
    return;
  }

  setKeys(["type", "name", "disabled"], $ele);

  switch (tag) {
    case "input":
      initInput($ele);
      break;
    case "textarea":
      setKeys(["value"], $ele);
      bindProp($ele, { name: "value", type: "input" });
      break;
    case "option":
      setKeys(["selected", "value"], $ele);
      break;
    case "select":
      {
        const { ele } = $ele;
        $ele.__unupdate = 1;
        $ele.value = ele.value;
        delete $ele.__unupdate;

        $ele.watch(() => {
          ele.value = $ele.value;
        });
        $ele.on("change", () => {
          $ele.value = ele.value;
        });
      }
      break;
  }
};

const initInput = ($ele) => {
  const type = $ele.attr("type");

  switch (type) {
    case "file":
      setKeys(["multiple", "files"], $ele);
      bindProp($ele, { name: "files", type: "change" });
      break;
    case "checkbox":
      setKeys(["checked", "multiple", "value"], $ele);
      bindProp($ele, { name: "checked", type: "change" });
      break;
    case "radio":
      setKeys(["checked", "value"], $ele);
      bindProp($ele, { name: "checked", type: "change" });
      break;
    case "text":
    default:
      setKeys(["placeholder", "value"], $ele);
      bindProp($ele, { name: "value", type: "input" });
      break;
  }
};

const getFormData = (target, expr) => {
  const data = {};

  target.all(expr).forEach(($el) => {
    const { name, tag, ele } = $el;

    if (tag === "input") {
      switch ($el.type) {
        case "checkbox":
          if (!(name in data)) {
            data[name] = [];
          }

          if (ele.checked) {
            data[name].push(ele.value);
          }
          break;
        case "radio":
          if (ele.checked) {
            data[name] = ele.value;
          }
          break;
        case "file":
          data[name] = ele.files;
          break;
        default:
          data[name] = ele.value;
      }
    } else if (tag === "textarea") {
      data[name] = ele.value;
    } else if (tag === "select") {
      const selectedsOpt = searchEle(ele, `option:checked`);

      if (ele.multiple) {
        data[name] = selectedsOpt.map((e) => e.value || e.textContent);
      } else {
        const [e] = selectedsOpt;
        data[name] = e.value || e.textContent;
      }
    } else {
      // custom element
      data[name] = $el.value;
    }
  });

  return data;
};

var formFn = {
  // This method is still being tested
  formData(expr, opts = { wait: 200 }) {
    const data = stanz({});

    assign(data, getFormData(this, expr || "input,select,textarea"));

    const wid1 = this.watchTick((e) => {
      const newData = getFormData(this, expr || "input,select,textarea");
      mergeObjects(data, newData);
    }, opts.wait);

    const wid2 = data.watchTick((e) => {
      resetValue(this, expr || "input,select,textarea", data);
    });

    const _this = this;

    const oldRevoke = data.revoke;
    data.extend({
      revoke() {
        _this.unwatch(wid1);
        data.unwatch(wid2);
        oldRevoke.call(this);
      },
    });

    return data;
  },
};

function resetValue(el, expr, data) {
  const eles = el.all(expr);

  Object.keys(data).forEach((name) => {
    const targets = eles.filter((e) => e.attr("name") === name);

    if (targets.length === 0) {
      return;
    }

    const val = data[name];
    const target = targets[0];
    const type = target.attr("type");
    if (targets.length === 1) {
      let isUseValue = true;

      if (target.tag === "input" && (type === "radio" || type === "checkbox")) {
        isUseValue = false;
      }

      if (isUseValue) {
        if (target.value !== val) {
          target.value = val;
        }
        return;
      }
    }

    // checkbox or radio
    targets.forEach((e) => {
      switch (e.attr("type")) {
        case "radio":
          if (e.value === val) {
            e.checked = true;
          } else {
            e.checked = false;
          }
          break;
        case "checkbox":
          e.checked = val.includes(e.value);
          break;
      }
    });
  });
}

const cssHandler = {
  set(target, key, value, receiver) {
    target._ele.style[key] = value;
    Reflect.set(target, key, value, receiver);
    return true;
  },
  get(target, key, receiver) {
    if (key === "length") {
      return 0;
    }

    if (key.startsWith && key.startsWith("--")) {
      return getComputedStyle(target._ele).getPropertyValue(key);
    }

    const { style } = target._ele;
    if (Array.from(style).includes(key)) {
      return style[key];
    }

    return getComputedStyle(target._ele)[key];
  },
};

class XhearCSS {
  constructor($el) {
    const obj = {};

    Object.defineProperty(obj, "_ele", {
      enumerable: false,
      get: () => $el.ele,
    });

    const { style } = $el.ele;

    Array.from(style).forEach((key) => {
      obj[key] = style[key];
    });

    return ($el._css = new Proxy(obj, cssHandler));
  }
}

var cssFn = {
  get css() {
    return new XhearCSS(this);
  },
  set css(d) {
    if (getType(d) == "string") {
      this.ele.style = d;
      return;
    }

    let { style } = this;

    // Covering the old style
    let nextKeys = Object.keys(d);

    // Clear the unused key
    Array.from(style).forEach((k) => {
      if (!nextKeys.includes(k)) {
        style[k] = "";
      }
    });

    Object.assign(style, d);
  },
};

function $(expr) {
  if (getType(expr) === "string" && !/<.+>/.test(expr)) {
    const ele = document.querySelector(expr);

    return eleX(ele);
  }

  return createXEle(expr);
}

Object.defineProperties($, {
  // Convenient objects for use as extensions
  extensions: {
    value: {},
  },
});

const COMPS = {};

const renderElement = ({ defaults, ele, template, temps }) => {
  let $ele;

  try {
    const data = {
      ...deepCopyData(defaults.data, defaults.tag),
      ...defaults.attrs,
    };

    defaults.attrs &&
      Object.keys(defaults.attrs).forEach((name) => {
        const value = ele.getAttribute(toDashCase(name));
        if (value !== null && value !== undefined) {
          data[name] = value;
        }
      });

    $ele = eleX(ele);

    defaults.proto && $ele.extend(defaults.proto, { enumerable: false });

    for (let [key, value] of Object.entries(data)) {
      if (!$ele.hasOwnProperty(key)) {
        $ele[key] = value;
      }
    }

    if (defaults.temp) {
      const root = ele.attachShadow({ mode: "open" });

      root.innerHTML = template.innerHTML;

      render({
        target: root,
        data: $ele,
        temps,
      });
    }

    defaults.ready && defaults.ready.call($ele);
  } catch (error) {
    throw getErr(
      "xhear_reander_err",
      {
        tag: ele.tagName.toLowerCase(),
      },
      error
    );
  }

  if (defaults.watch) {
    const wen = Object.entries(defaults.watch);

    $ele.watchTick((e) => {
      for (let [name, func] of wen) {
        const names = name.split(",");

        if (names.length >= 2) {
          if (names.some((name) => e.hasModified(name))) {
            func.call(
              $ele,
              names.map((name) => $ele[name]),
              {
                watchers: e,
              }
            );
          }
        } else {
          if (e.hasModified(name)) {
            func.call($ele, $ele[name], {
              watchers: e,
            });
          }
        }
      }
    });

    for (let [name, func] of wen) {
      const names = name.split(",");
      if (names.length >= 2) {
        func.call(
          $ele,
          names.map((name) => $ele[name]),
          {}
        );
      } else {
        func.call($ele, $ele[name], {});
      }
    }
  }
};

const register = (opts = {}) => {
  const defaults = {
    // Registered component name
    tag: "",
    // Body content string
    temp: "",
    // Initialization data after element creation
    data: {},
    // Values that will not be traversed
    proto: {},
    // Keys bound to attributes
    // attrs: {},
    // The listener function for the element
    // watch: {},
    // Function triggered when the component is created (data initialization complete)
    // created() { },
    // Function triggered after component data initialization is complete (initial rendering completed)
    // ready() { },
    // Functions that are added to the document trigger
    // attached() { },
    // Functions triggered by moving out of the document
    // detached() { },
    // The container element is changed
    // slotchange() { }
    ...opts,
  };

  const { fn, extensions } = $;
  if (fn) {
    // 检查 proto 和 data 上的key，是否和fn上的key冲突
    Object.keys(defaults.data).forEach((name) => {
      if (fn.hasOwnProperty(name)) {
        throw getErr("invalid_key", {
          compName: defaults.tag,
          targetName: "data",
          name,
        });
      }
    });
    Object.keys(defaults.proto).forEach((name) => {
      if (fn.hasOwnProperty(name)) {
        console.warn(
          getErrDesc("invalid_key", {
            compName: defaults.tag,
            targetName: "proto",
            name,
          }),
          opts
        );
      }
    });
  }

  let template, temps, name;

  try {
    validateTagName(defaults.tag);

    defaults.data = deepCopyData(defaults.data, defaults.tag);

    name = capitalizeFirstLetter(hyphenToUpperCase(defaults.tag));

    if (COMPS[name]) {
      throw getErr("xhear_register_exists", { name });
    }

    template = document.createElement("template");
    template.innerHTML = defaults.temp;
    temps = convert(template);
  } catch (error) {
    throw getErr("xhear_register_err", { tag: defaults.tag }, error);
  }

  const getAttrKeys = (attrs) => {
    let attrKeys;

    if (attrs instanceof Array) {
      attrKeys = [...attrs];
    } else {
      attrKeys = Object.keys(attrs);
    }

    return attrKeys;
  };

  const XElement = (COMPS[name] = class extends HTMLElement {
    constructor(...args) {
      super(...args);

      const $ele = eleX(this);

      defaults.created && defaults.created.call($ele);

      if (defaults.attrs) {
        const attrKeys = getAttrKeys(defaults.attrs);

        // fix self attribule value
        $ele.watchTick((e) => {
          attrKeys.forEach((key) => {
            if (e.hasModified(key)) {
              const val = $ele[key];
              const attrName = toDashCase(key);
              const oldVal = this.getAttribute(attrName);
              if (val === null || val === undefined) {
                this.removeAttribute(attrName);
              } else if (oldVal !== val) {
                let reval = val;

                const valType = getType(val);

                if (valType === "number" && oldVal === String(val)) {
                  // Setting the number will cause an infinite loop
                  return;
                }
                if (valType === "object") {
                  // Setting the object will cause an infinite loop
                  reval = JSON.stringify(reval);
                  if (reval === oldVal) {
                    return;
                  }
                }

                this.setAttribute(attrName, reval);
              }
            }
          });
        });

        // The data set before initialization needs to be reflected in attrs
        attrKeys.forEach((key) => {
          if (
            $ele[key] !== null &&
            $ele[key] !== undefined &&
            $ele[key] !== defaults.attrs[key]
          ) {
            this.setAttribute(toDashCase(key), $ele[key]);
          }
        });
      }

      renderElement({
        defaults,
        ele: this,
        template,
        temps,
      });
    }

    connectedCallback() {
      if (isInternal(this)) {
        return;
      }

      const $ele = eleX(this);
      defaults.attached && defaults.attached.call($ele);
      $ele.emit("attached", { bubbles: false });
      extensions.afterAttached && extensions.afterAttached($ele);
    }

    disconnectedCallback() {
      if (isInternal(this)) {
        return;
      }

      const $ele = eleX(this);
      defaults.detached && defaults.detached.call($ele);
      $ele.emit("detached", { bubbles: false });
      extensions.afterDetached && extensions.afterDetached($ele);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      const $ele = eleX(this);

      if (!/[^\d.]/.test(newValue) && typeof $ele[name] === "number") {
        newValue = Number(newValue);
      }

      $ele[hyphenToUpperCase(name)] = newValue;
    }

    static get observedAttributes() {
      return getAttrKeys(defaults.attrs || {}).map((e) => toDashCase(e));
    }
  });

  if (document.readyState !== "loading") {
    customElements.define(defaults.tag, XElement);
  } else {
    const READYSTATE = "readystatechange";
    let f;
    document.addEventListener(
      READYSTATE,
      (f = () => {
        customElements.define(defaults.tag, XElement);
        document.removeEventListener(READYSTATE, f);
      })
    );
  }
};

// 判断元素是否临时脱离节点，防止数组操作导致元素触发detached问题
function isInternal(ele) {
  let target = ele;

  while (target) {
    if (target.__internal) {
      return true;
    }

    target = target.parentNode || target.host;

    if (!target || (target.tagName && target.tagName === "BODY")) {
      break;
    }
  }

  return false;
}

function validateTagName(str) {
  // Check if the string has at least one '-' character
  if (!str.includes("-")) {
    throw getErr("xhear_tag_noline", { str });
  }

  // Check if the string starts or ends with '-'
  if (str.charAt(0) === "-" || str.charAt(str.length - 1) === "-") {
    throw getErr("xhear_validate_tag", { str });
  }

  // Check if the string has consecutive '-' characters
  for (let i = 0; i < str.length - 1; i++) {
    if (str.charAt(i) === "-" && str.charAt(i + 1) === "-") {
      throw getErr("xhear_validate_tag", { str });
    }
  }

  return true;
}

function deepCopyData(obj, tag = "", keyName) {
  if (obj instanceof Set || obj instanceof Map) {
    throw getErr("xhear_regster_data_noset", { tag });
  }

  if (obj instanceof Function) {
    throw getErr("xhear_regster_data_nofunc", { tag, key: keyName });
  }

  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const copy = Array.isArray(obj) ? [] : {};

  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (/^_/.test(key) && obj[key] instanceof Function) {
        // 直接赋值私有属性
        copy[key] = obj[key];
      } else {
        copy[key] = deepCopyData(obj[key], tag, key);
      }
    }
  }

  return copy;
}

class FakeNode extends Comment {
  constructor(markname) {
    const tagText = `Fake Node${markname ? ": " + markname : ""}`;

    super(` ${tagText} --end `);

    this._mark = markname;
    this._inited = false;

    const startCom = new Comment(` ${tagText} --start `);
    startCom.__fake_end = this;

    Object.defineProperty(this, "_start", {
      value: startCom,
    });
  }

  init() {
    if (this._inited) {
      return;
    }

    this.parentNode.insertBefore(this._start, this);
    this._inited = true;
  }

  querySelector(expr) {
    return this.__searchEl(expr, "find");
  }

  querySelectorAll(expr) {
    return this.__searchEl(expr);
  }

  __searchEl(expr, funcName = "filter") {
    const startParent = this.parentNode;
    if (!startParent) return [];

    const childs = this.children;

    return Array.from(startParent.querySelectorAll(expr))[funcName]((e) => {
      let par = e;
      while (true) {
        if (childs.includes(par)) {
          return true;
        }

        par = par.parentNode;

        if (!par) {
          break;
        }
      }
    });
  }

  insertBefore(newEle, target) {
    const { parentNode } = this;

    if (Array.from(parentNode.children).includes(target)) {
      parentNode.insertBefore(newEle, target);
    } else {
      parentNode.insertBefore(newEle, this);
    }
  }

  appendChild(newEle) {
    this.parentNode.insertBefore(newEle, this);
  }

  get children() {
    const childs = [];

    let prev = this;
    while (true) {
      prev = prev.previousSibling;

      if (prev) {
        if (prev instanceof HTMLElement) {
          childs.unshift(prev);
        } else if (prev === this._start) {
          break;
        }
      } else if (this.isConnected) {
        throw getErr("xhear_fakenode_unclose", { name: "children" });
      } else {
        break;
      }
    }

    return childs;
  }

  get childNodes() {
    const childs = [];

    let prev = this;
    while (true) {
      prev = prev.previousSibling;

      if (prev) {
        if (prev === this._start) {
          break;
        }
        childs.unshift(prev);
      } else {
        if (!this.isConnected) {
          break;
        }
        throw getErr("xhear_fakenode_unclose", { name: "childNodes" });
      }
    }

    return childs;
  }

  set innerHTML(val) {
    this.childNodes.forEach((e) => {
      e.remove();
    });

    const temp = document.createElement("template");
    temp.innerHTML = val;

    Array.from(temp.content.childNodes).forEach((e) => {
      this.appendChild(e);
    });
  }

  get innerHTML() {
    const { children } = this;
    let content = "";

    children.forEach((e) => {
      content += e.outerHTML + "\n";
    });

    return content;
  }

  get nextElementSibling() {
    let next = this.nextSibling;

    if (!next) {
      return null;
    }

    if (next.__fake_end) {
      return next.__fake_end;
    }

    if (next && !(next instanceof Element)) {
      next = next.nextElementSibling;
    }

    return next;
  }

  get previousElementSibling() {
    const { _start } = this;
    let prev = _start.previousSibling;

    if (!prev) {
      return null;
    }

    if (prev instanceof FakeNode) {
      return prev;
    }

    return _start.previousElementSibling;
  }
}

// 将temp元素替换到原来的位置上
const replaceTempInit = (_this) => {
  const parent = _this.parentNode;
  if (parent) {
    const parent = _this.parentNode;
    const children = Array.from(_this.content.children);
    children.forEach((e) => {
      parent.insertBefore(e, _this);
    });

    _this.remove();

    if (parent.querySelector("[x-bind-data]")) {
      const regData = getRenderData(parent);

      if (regData) {
        // 重新渲染未绑定元素
        render({
          data: regData.data,
          target: regData.target,
          temps: regData.temps,
        });
      }
    }
  }
};

if (isSafariBrowser()) {
  renderExtends.beforeRender = ({ target }) => {
    let replaces = [];

    while (true) {
      replaces = Array.from(
        target.querySelectorAll('template[is="replace-temp"]')
      );

      if (!replaces.length) {
        break;
      }

      replaces.forEach((temp) => {
        replaceTempInit(temp);
      });
    }
  };
} else {
  class ReplaceTemp extends HTMLTemplateElement {
    constructor() {
      super();
      this.init();
    }

    init() {
      replaceTempInit(this);
    }

    connectedCallback() {
      this.init();
    }
  }

  customElements.define("replace-temp", ReplaceTemp, {
    extends: "template",
  });
}

/**
 * `x-if` first replaces all neighboring conditional elements with token elements and triggers the rendering process once; the rendering process is triggered again after each `value` change.
 * The rendering process is as follows:
 * 1. First, collect all conditional elements adjacent to `x-if`.
 * 2. Mark these elements and wait for the `value` of each conditional element to be set successfully before proceeding to the next step.
 * 3. Based on the marking, perform a judgment operation asynchronously, the element that satisfies the condition first will be rendered; after successful rendering, the subsequent conditional elements will clear the rendered content.
 */


const regOptions = {
  data: {
    value: null,
    __rendered: false,
  },
  watch: {
    value() {
      if (!this._bindend) {
        return;
      }

      this.refreshValue();
    },
  },
  proto: {
    refreshValue() {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        const conditions = [this, ...this._others];

        let isOK = false;

        conditions.forEach((conditionEl) => {
          if (isOK) {
            // A success condition has preceded it, and any subsequent conditional elements should be clear
            conditionEl._clearContent();
            return;
          }

          if (conditionEl.value || conditionEl.tag === "x-else") {
            isOK = true;
            conditionEl._renderContent();
          } else {
            conditionEl._clearContent();
          }
        });
        if (this._fake.parentNode) {
          eleX(this._fake.parentNode).refresh();
        }

        // const fakeParent = eleX(this._fake.parentNode);
        // fakeParent.refresh();
        // fakeParent.host && fakeParent.host.refresh({ unupdate: 1 });
      }, 0);
    },
    _renderContent() {
      if (this.__rendered) {
        return;
      }
      this.__rendered = true;

      const result = getRenderData(this._fake);

      if (!result) {
        return;
      }

      const { target, data, temps } = result;

      if (dataRevoked(data)) {
        return;
      }

      this._fake.innerHTML = this.__originHTML;

      render({ target, data, temps });

      this.emit("rendered", {
        bubbles: false,
      });
    },
    _clearContent() {
      if (!this.__rendered) {
        return;
      }

      this.__rendered = false;

      // revokeAll(this._fake);
      this._fake?.childNodes?.forEach((el) => revokeAll(el));
      this._fake.innerHTML = "";

      this.emit("clear", {
        bubbles: false,
      });
    },
    init() {
      if (this._bindend) {
        return;
      }

      this._bindend = true;
      const fake = (this._fake = new FakeNode(this.tag));
      fake.__revokes = this.ele.__revokes;
      this.before(fake);
      fake.init();
      this.remove();

      // 给 else-if 添加 _xif，给 else 初始化
      if (this.tag === "x-if") {
        const others = (this._others = []);

        let next = fake;
        while (true) {
          next = next.nextElementSibling;

          if (!next || next.tagName == "X-IF") {
            // 下一个还是if的话，就直接跳过遍历的逻辑，因为下一个if后面可能有它们的else
            break;
          }

          switch (next.tagName) {
            case "X-ELSE": {
              const $el = eleX(next);
              if ($el.init) {
                $el.init();
              } else {
                $el._if_ready = 1;
              }

              others.push($el);
              return;
            }
            case "X-ELSE-IF": {
              const $el = eleX(next);

              $el._xif = this;

              others.push($el);
              break;
            }
          }
        }
      }
    },
  },
  created() {
    this.__originHTML = this.$("template[condition]").html;
    this.html = "";
  },
  ready() {
    if (this.ele._bindingRendered) {
      this.init();
    } else {
      this.one("binding-rendered", () => this.init());
    }
  },
};

register({
  tag: "x-if",
  ...regOptions,
});

register({
  tag: "x-else-if",
  ...regOptions,
  watch: {
    value() {
      if (!this._bindend) {
        return;
      }

      if (this._xif) {
        this._xif.refreshValue();
      }
    },
  },
});

register({
  tag: "x-else",
  ...regOptions,
  watch: {},
  ready() {
    if (this._if_ready) {
      this.init();
    }
  },
});

const getRenderData = (target) => {
  while (target && !target.__render_data) {
    target = target.parentNode;
  }

  if (target) {
    return {
      target,
      data: target.__render_data,
      temps: target.__render_temps,
    };
  }

  return null;
};

register({
  tag: "x-fill",
  data: {
    value: null,
  },
  watch: {
    value(value, t) {
      this.refreshValue(t?.watchers);
    },
  },
  proto: {
    refreshValue(watchers) {
      const arrayData = this.value;

      if (!this._bindend) {
        return;
      }

      const childs = this._fake.children;

      if (!arrayData) {
        childs.forEach((e) => revokeAll(e));
        this._fake.innerHTML = "";
        return;
      }

      if (!(arrayData instanceof Array)) {
        console.warn(
          getErr("fill_type", {
            type: getType(arrayData),
          })
        );

        childs &&
          childs.forEach((el) => {
            revokeAll(el);
            el.remove();
          });
        return;
      }

      const regData = getRenderData(this._fake);

      if (!regData) {
        return;
      }

      const { data, temps } = regData;

      const targetTemp = temps[this._name];

      const keyName = this.attr("fill-key") || "xid";

      if (!childs.length) {
        const frag = document.createDocumentFragment();

        arrayData.forEach((e, i) => {
          const $ele = createItem(
            e,
            temps,
            targetTemp,
            data.$host || data,
            i,
            keyName
          );
          frag.appendChild($ele.ele);
        });

        this._fake.appendChild(frag);
      } else {
        if (watchers) {
          const isReplaced = watchers.some((e) => e.path.length <= 1);

          if (!isReplaced) {
            // It is not a replacement, it can be corrected by binding the item internally.
            return;
          }
        }

        const vals = arrayData.slice();
        const valsKeys = new Set(
          vals.map((e) => {
            if (!e) {
              return;
            }

            const val = e[keyName];
            return val === undefined ? e : val;
          })
        );

        const { parentNode } = this._fake;

        if (keyName !== "xid" && vals.length !== valsKeys.size) {
          const err = getErr("fill_key_duplicates");
          console.error(err);
          console.warn(err, {
            parentNode,
            host: eleX(parentNode)?.host?.ele,
          });
        }

        // const positionKeys = childs.map((e) => e._data_xid || e);
        // Delete non-existing projects in advance (used to improve performance, this step can be removed and the above comment is turned on)
        const positionKeys = [];
        for (let i = 0, len = childs.length; i < len; i++) {
          const e = childs[i];
          const key = e._data_xid || e;

          if (!valsKeys.has(key)) {
            // If it no longer exists, delete it in advance.
            revokeAll(e);
            e.remove();
            childs.splice(i, 1);
            len--;
            i--;
          } else {
            positionKeys.push(key);
          }
        }

        let target = this._fake._start;

        const needRemoves = [];

        let count = 0;

        while (target) {
          if (target === this._fake) {
            if (vals.length) {
              // We have reached the end, add all elements directly to the front
              vals.forEach((item) => {
                const $ele = createItem(
                  item,
                  temps,
                  targetTemp,
                  data.$host || data,
                  count,
                  keyName
                );

                count++;

                // target.parentNode.insertBefore($ele.ele, target);
                parentNode.insertBefore($ele.ele, target);
              });
            }
            break;
          }
          if (!(target instanceof Element)) {
            target = target.nextSibling;
            continue;
          }
          const currentVal = vals.shift();
          const isObj = currentVal instanceof Object;
          const $tar = eleX(target);
          const item = $tar.__item;

          if (currentVal === undefined && !vals.length) {
            // There will be no follow-up, just delete it directly
            needRemoves.push(target);
            target = target.nextSibling;
            continue;
          }

          const oldId = positionKeys.indexOf(
            isObj ? currentVal[keyName] : currentVal
          );
          if (oldId > -1) {
            // If the key originally exists, perform key displacement.
            const oldItem = childs[oldId];
            if (
              isObj
                ? currentVal[keyName] !== item.$data[keyName]
                : currentVal !== item.$data
            ) {
              // Adjust position
              oldItem.__internal = 1;
              // target.parentNode.insertBefore(oldItem, target);
              parentNode.insertBefore(oldItem, target);
              delete oldItem.__internal;
              target = oldItem;
            }

            // Update object
            const $old = eleX(oldItem);
            if ($old.__item.$data !== currentVal) {
              $old.__item.$data = currentVal;
            }
            $old.__item.$index = count;
          } else {
            // Add new element
            const $ele = createItem(
              currentVal,
              temps,
              targetTemp,
              data.$host || data,
              count,
              keyName
            );

            // target.parentNode.insertBefore($ele.ele, target);
            parentNode.insertBefore($ele.ele, target);
            target = $ele.ele;
          }

          count++;
          target = target.nextSibling;
        }

        if (needRemoves.length) {
          needRemoves.forEach((e) => {
            revokeAll(e);
            e.remove();
          });
        }
      }

      if (this._fake.parentNode) {
        eleX(this._fake.parentNode).refresh();
      }

      this.emit("rendered", {
        bubbles: false,
      });
    },
    init() {
      if (this._bindend) {
        return;
      }

      this._bindend = true;
      const fake = (this._fake = new FakeNode("x-fill"));

      // 搬动 revokes
      fake.__revokes = this.ele.__revokes;

      this.before(fake);
      fake.init();
      this.remove();

      this.refreshValue();
    },
  },
  ready() {
    this._name = this.attr("name");

    if (!this._name) {
      const err = getErr("xhear_fill_tempname", { name: this._name });
      console.warn(err, this.ele);
      throw err;
    }

    if (this.ele._bindingRendered) {
      this.init();
    } else {
      this.one("binding-rendered", () => this.init());
    }
  },
});

const createItem = ($data, temps, targetTemp, $host, $index, keyName) => {
  const $ele = createXEle(targetTemp.innerHTML);

  const itemData = new Stanz({
    $data,
    // $ele,
    $host,
    $index,
  });

  // tips: 如果$ele被设置为item的子属性，$ele内出现自定义组件，进一步导致改动冒泡，会出现xfill内元素不停渲染的死循环
  Object.defineProperties(itemData, {
    $ele: {
      get() {
        return $ele;
      },
    },
  });

  render({
    target: $ele.ele,
    data: itemData,
    temps,
    // $host,
    isRenderSelf: true,
  });

  const revokes = $ele.ele.__revokes;

  const revoke = () => {
    removeArrayValue(revokes, revoke);
    itemData.revoke();
  };

  revokes.push(revoke);

  $ele.__item = itemData;
  $ele.ele._data_xid = $data?.[keyName] || $data;

  return $ele;
};

const { defineProperties } = Object;

const GET_COMPOSE_PATH = `get-${Math.random()}`;

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

class Xhear extends LikeArray {
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
    return this.ele && this.ele.children.length;
  }

  $(expr) {
    let { ele } = this;
    if (ele instanceof HTMLTemplateElement) {
      ele = ele.content;
    }

    const target = ele.querySelector(expr);
    return target ? eleX(target) : null;
  }

  all(expr) {
    return searchEle(this.ele, expr).map(eleX);
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
    return host instanceof Node ? eleX(host) : null;
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

  parentsUntil(expr) {
    const allParents = this.parents;
    const parents = [];

    const exprIsObj = typeof expr === "object";

    while (allParents.length) {
      const target = allParents.shift();

      if (exprIsObj) {
        if (target === expr || target.ele === expr) {
          break;
        }
      } else if (target.ele.matches(expr)) {
        break;
      }

      parents.push(target);
    }

    return parents;
  }

  get hosts() {
    const hosts = [];
    let target = this;
    while (target.host) {
      target = target.host;
      hosts.push(target);
    }
    return hosts;
  }

  composedPath() {
    let paths = [];
    this.one(GET_COMPOSE_PATH, (e) => {
      paths = e.composedPath();
      e.stopPropagation();
    });
    this.emit(GET_COMPOSE_PATH, {
      composed: true,
    });
    return paths;
  }

  get next() {
    const nextEle = this.ele.nextElementSibling;
    return nextEle ? eleX(nextEle) : null;
  }

  after(val) {
    const { next: nextEl } = this;

    if (nextEl) {
      nextEl.before(val);
    } else {
      this.parent.push(val);
    }
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

  before(val) {
    const $el = createXEle(val);
    this.parent.ele.insertBefore($el.ele, this.ele);
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

  get width() {
    return parseInt(getComputedStyle(this.ele).width) || 0;
  }

  get height() {
    return parseInt(getComputedStyle(this.ele).height) || 0;
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
    if (typeof expr === "string") {
      return this.ele.matches(expr);
    }

    if (expr instanceof Xhear) {
      return this.ele === expr.ele;
    }

    if (expr instanceof Node) {
      return this.ele === expr;
    }
  }

  contains(expr) {
    if (typeof expr === "string") {
      return this.ele.querySelector(expr) !== null;
    }

    if (expr instanceof Xhear) {
      return this.ele.contains(expr.ele);
    }

    if (expr instanceof Node) {
      return this.ele.contains(expr);
    }
  }

  remove() {
    const { parent } = this;
    if (parent) {
      parent.splice(parent.indexOf(this), 1);
    }
    // this.ele.remove();
  }

  clone(bool = true) {
    return eleX(this.ele.cloneNode(bool));
  }

  wrap(content) {
    const $el = createXEle(content);

    const { ele } = this;

    if (!ele.parentNode) {
      throw getErr("xhear_wrap_no_parent");
    }

    ele.parentNode.insertBefore($el.ele, ele);

    ele.__internal = 1;

    $el.ele.appendChild(ele);

    delete ele.__internal;

    return this;
  }

  unwrap() {
    const { ele } = this;

    const target = ele.parentNode;

    if (target.children.length > 1) {
      throw getErr("xhear_unwrap_has_siblings");
    }

    ele.__internal = 1;

    target.parentNode.insertBefore(ele, target);

    target.remove();

    delete ele.__internal;

    return this;
  }
}

const sfn = Stanz.prototype;
const fn = Xhear.prototype;

fn.extend(
  {
    get: sfn.get,
    set: sfn.set,
    toJSON: sfn.toJSON,
    toString: sfn.toString,
    ...watchFn,
    ...eventFn,
    ...defaultData,
    ...syncFn,
    ...formFn,
  },
  {
    enumerable: false,
  }
);

fn.extend(cssFn);

const eleX = (ele) => {
  if (!ele) return null;

  if (ele.__xhear__) {
    return ele.__xhear__;
  }

  return new Xhear({ ele });
};

const objToXEle = (obj) => {
  const data = { ...obj };

  if (!obj.tag) {
    return null;
  }

  const ele = document.createElement(obj.tag);
  delete data.tag;
  const $ele = eleX(ele);

  Object.assign($ele, data);

  return $ele;
};

const temp = document.createElement("template");

const strToXEle = (str) => {
  temp.innerHTML = str;
  const ele = temp.content.children[0] || temp.content.childNodes[0];
  temp.innerHTML = "";

  return eleX(ele);
};

const createXEle = (expr, exprType) => {
  if (expr instanceof Xhear) {
    return expr;
  }

  if (expr instanceof Node || expr === window) {
    return eleX(expr);
  }

  const type = getType(expr);

  switch (type) {
    case "object":
      return objToXEle(expr);
    case "string":
      return strToXEle(expr);
  }
};

const revokeAll = (target) => {
  if (target.__revokes) {
    Array.from(target.__revokes).forEach((f) => f && f());
  }
  target.childNodes &&
    Array.from(target.childNodes).forEach((el) => {
      revokeAll(el);
    });

  const revokes = target?.shadowRoot?.__revokes;

  if (revokes) {
    [...revokes].forEach((f) => f());
  }
};

Object.assign($, {
  stanz,
  Stanz,
  render,
  convert,
  register,
  nextTick,
  fn: Xhear.prototype,
  all: (expr) => searchEle(document, expr).map(eleX),
  frag: () => $(document.createDocumentFragment()),
});

export { $ as default };
