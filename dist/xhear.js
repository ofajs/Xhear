//! xhear - v7.3.2 https://github.com/kirakiray/Xhear  (c) 2018-2023 YAO
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.$ = factory());
})(this, (function () { 'use strict';

  const getRandomId = () => Math.random().toString(32).slice(2);

  const objectToString = Object.prototype.toString;
  const getType$1 = (value) =>
    objectToString
      .call(value)
      .toLowerCase()
      .replace(/(\[object )|(])/g, "");

  const isObject = (obj) => {
    const type = getType$1(obj);
    return type === "array" || type === "object";
  };

  const tickSets = new Set();
  function nextTick(callback) {
    const tickId = `t-${getRandomId()}`;
    tickSets.add(tickId);
    Promise.resolve().then(() => {
      if (tickSets.has(tickId)) {
        callback();
        tickSets.delete(tickId);
      }
    });
    return tickId;
  }

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
            func.call(this, hisArgs);
            hisArgs = [];
            timeout = null;
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

  function dataRevoked(data) {
    try {
      data.xid;
    } catch (err) {
      return isRevokedErr(err);
    }

    return false;
  }

  function isRevokedErr(error) {
    const firstLine = error.stack.split(/\\n/)[0].toLowerCase();
    if (firstLine.includes("proxy") && firstLine.includes("revoked")) {
      return true;
    }

    return false;
  }

  const isFunction = (val) => getType$1(val).includes("function");

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

  // Determine if an element is eligible
  const meetsEle = (ele, expr) => {
    const temp = document.createElement("template");
    temp.content.append(ele.cloneNode());
    return !!temp.content.querySelector(expr);
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
      console.warn("Circular references appear");
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
      const wid = "w-" + getRandomId();

      this[WATCHS].set(wid, callback);

      return wid;
    },

    unwatch(wid) {
      return this[WATCHS].delete(wid);
    },

    watchTick(callback, wait) {
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
          clearData(item, this);
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
    constructor(data) {
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
            const err = new Error(
              `Failed to get data : ${keys.slice(0, i).join(".")} \n${
              error.stack
            }`
            );
            Object.assign(err, {
              error,
              target,
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
            const err = new Error(
              `Failed to get data : ${keys.slice(0, i).join(".")} \n${
              error.stack
            }`
            );
            Object.assign(err, {
              error,
              target,
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
        data = new Stanz(value);
        data._owner.push(receiver);
      }
    }

    const isSame = oldValue === value;

    if (!isSame && isxdata(oldValue)) {
      clearData(oldValue, receiver);
    }

    const reval = succeed(data);

    !isSame &&
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

  const clearData = (val, target) => {
    if (isxdata(val)) {
      const index = val._owner.indexOf(target);
      if (index > -1) {
        val._owner.splice(index, 1);
      } else {
        console.error({
          desc: "This data is wrong, the owner has no boarding object at the time of deletion",
          target,
          mismatch: val,
        });
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
        const err = new Error(`failed to set ${key} \n ${error.stack}`);

        Object.assign(err, {
          key,
          value,
          target: receiver,
          error,
        });

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

  const handler = {
    set(target, key, value, receiver) {
      if (!/\D/.test(String(key))) {
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
    render() {},
  };

  const getRevokes = (target) => target.__revokes || (target.__revokes = []);
  const addRevoke = (target, revoke) => getRevokes(target).push(revoke);

  const convertToFunc = (expr, data, opts) => {
    const funcStr = `
${isRevokedErr.toString()}
const [$event] = $args;
const {data, errCall} = this;
try{
  with(data){
    return ${expr};
  }
}catch(error){
  if(isRevokedErr(error)){
    return;
  }
  if(data.ele && !data.ele.isConnected){
    return;
  }
  if(errCall){
    const result = errCall(error);
    if(result !== false){
      console.error(error);
    }
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
    isRenderSelf,
    ...otherOpts
  }) {
    const content = template && template.innerHTML;

    if (content) {
      target.innerHTML = content;
    }

    const texts = searchEle(target, "xtext");

    const tasks = [];
    const revokes = getRevokes(target);

    texts.forEach((el) => {
      const textEl = document.createTextNode("");
      const { parentNode } = el;
      parentNode.insertBefore(textEl, el);
      parentNode.removeChild(el);

      const func = convertToFunc(el.getAttribute("expr"), data);
      const renderFunc = () => {
        textEl.textContent = func();
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

    if (isRenderSelf && meetsEle(target, `[x-bind-data]`)) {
      eles.unshift(target);
    }

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
                  const stack = `Rendering of target element failed: ${$el.ele.outerHTML} \n  ${error.stack}`;
                  console.error(stack);
                  console.error({ stack, element: $el.ele, target, error });

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
            const err = new Error(
              `Execution of the ${actionName} method reports an error: ${actionName}:${args[0]}="${args[1]}"  \n ${error.stack}`
            );
            err.error = error;
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

    if (tasks.length) {
      if (target.__render_data && target.__render_data !== data) {
        const error = new Error(
          `An old listener already exists and the rendering of this element may be wrong`
        );

        Object.assign(error, {
          element: target,
          old: target.__render_data,
          new: data,
        });

        throw error;
      }

      target.__render_data = data;

      tasks.forEach((f) => f());

      const wid = data.watchTick((e) => {
        if (tasks.length) {
          tasks.forEach((f) => f());
        } else {
          data.unwatch(wid);
        }
      });
    }
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
      if (template.content.children.length > 1) {
        if (!isWarned) {
          console.warn(
            `Only one child element can be contained within a template element. If multiple child elements appear, the child elements will be rewrapped within a <div> element`
          );
          isWarned = 1;
        }

        const wrapName = `wrapper-${tempName}`;
        template.innerHTML = `<div ${wrapName} style="display:contents">${template.innerHTML}</div>`;
        console.warn(
          `The template "${tempName}" contains ${template.content.children.length} child elements that have been wrapped in a div element with attribute "${wrapName}".`
        );
      }
      temps[tempName] = template;
      template.remove();
    }

    searchTemp(template, "x-fill:not([name])", (fillEl) => {
      if (fillEl.querySelector("x-fill:not([name])")) {
        throw `Don't fill unnamed x-fills with unnamed x-fill elements!!!\n${fillEl.outerHTML}`;
      }

      const tid = `t${getRandomId()}`;
      fillEl.setAttribute("name", tid);

      const temp = document.createElement("template");
      temp.setAttribute("name", tid);
      temp.innerHTML = fillEl.innerHTML;
      fillEl.innerHTML = "";
      fillEl.appendChild(temp);
    });

    searchTemp(template, "x-if,x-else-if,x-else", (condiEl) => {
      const firstChild = condiEl.children[0];
      if (!firstChild || firstChild.tagName !== "TEMPLATE") {
        condiEl.innerHTML = `<template condition>${condiEl.innerHTML}</template>`;
      }
    });

    searchTemp(template, "template", (e) => {
      temps = { ...temps, ...convert(e) };
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

      if (args.length === 1) {
        return this.ele.getAttribute(name);
      }

      value = getVal(value);

      if (value === null) {
        this.ele.removeAttribute(name);
      } else {
        this.ele.setAttribute(name, value);
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
  };

  defaultData.prop.always = true;
  defaultData.attr.always = true;
  defaultData.class.always = true;

  defaultData.prop.revoke = ({ target, args, $ele, data }) => {
    const propName = args[0];
    // target[propName] = null;
    target.set(propName, null);
  };

  const syncFn = {
    sync(propName, targetName, options) {
      if (!options) {
        throw `Sync is only allowed within the renderer`;
      }

      [propName, targetName] = options.beforeArgs;

      const { data } = options;

      const val = data.get(targetName);

      if (val instanceof Object) {
        const err = `Object values cannot be synchronized using the sync function : ${targetName}`;
        console.log(err, data);
        throw new Error(err);
      }

      this[propName] = data.get(targetName);

      const wid1 = this.watch((e) => {
        if (e.hasModified(propName)) {
          try {
            const value = this.get(propName);
            data.set(targetName, value);
          } catch (err) {
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
            // console.warn(err);
          }
        }
      });

      return () => {
        this.unwatch(wid1);
        data.unwatch(wid2);
      };
    },
  };

  syncFn.sync.revoke = (e) => {
    e.result();
  };

  const eventFn = {
    on(name, func, options) {
      let revoker;
      if (options) {
        const beforeValue = options.beforeArgs[1];

        if (!/[^\d\w_\$\.]/.test(beforeValue)) {
          func = options.data.get(beforeValue).bind(options.data);
        }

        revoker = () => this.ele.removeEventListener(name, func);
      }

      this.ele.addEventListener(name, func);

      if (revoker) {
        return revoker;
      }

      return this;
    },
    one(name, func, options) {
      const callback = (e) => {
        this.off(name, callback);
        func(e);
      };

      this.on(name, callback, options);

      return this;
    },
    off(name, func) {
      this.ele.removeEventListener(name, func);
      return this;
    },
    emit(name, data, opts) {
      let event;

      if (name instanceof Event) {
        event = name;
      } else if (name) {
        event = new Event(name, { bubbles: true, ...opts });
      }

      data && Object.assign(event, data);

      this.ele.dispatchEvent(event);

      return this;
    },
  };

  eventFn.on.revoke = (e) => {
    e.result();
  };

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
    reverse(...args) {
      const childs = Array.from(this.ele.childNodes);

      arrayFn.reverse.call(childs, ...args);

      const frag = document.createDocumentFragment();

      childs.forEach((ele) => {
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
            if (isNum) {
              return Number(ele[k]);
            }
            return ele[k];
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
        setKeys(["value"], $ele);
        bindProp($ele, { name: "value", type: "change" });
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
        setKeys(["checked", "multiple"], $ele);
        bindProp($ele, { name: "checked", type: "change" });
        break;
      case "radio":
        setKeys(["checked"], $ele);
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

      this.watchTick((e) => {
        assign(data, getFormData(this, expr || "input,select,textarea"));
      }, opts.wait);

      return data;
    },
  };

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
      if (getType$1(d) == "string") {
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

  const COMPS = {};

  const renderElement = ({ defaults, ele, template, temps }) => {
    let $ele;

    try {
      const data = {
        ...deepCopyData(defaults.data),
        ...defaults.attrs,
      };

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
      const err = new Error(
        `Render element error: ${ele.tagName} \n  ${error.stack}`
      );
      err.error = error;
      throw err;
    }

    if (defaults.watch) {
      const wen = Object.entries(defaults.watch);

      $ele.watchTick((e) => {
        for (let [name, func] of wen) {
          if (e.hasModified(name)) {
            func.call($ele, $ele[name], {
              watchers: e,
            });
          }
        }
      });

      for (let [name, func] of wen) {
        func.call($ele, $ele[name], {});
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

    let template, temps;

    try {
      validateTagName(defaults.tag);

      defaults.data = deepCopyData(defaults.data);

      const name = capitalizeFirstLetter(hyphenToUpperCase(defaults.tag));

      if (COMPS[name]) {
        throw `Component ${name} already exists`;
      }

      template = document.createElement("template");
      template.innerHTML = defaults.temp;
      temps = convert(template);
    } catch (error) {
      const err = new Error(
        `Register Component Error: ${defaults.tag} \n  ${error.stack}`
      );
      err.error = error;
      throw err;
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
                if (val === null || val === undefined) {
                  this.removeAttribute(attrName);
                } else {
                  this.setAttribute(attrName, val);
                }
              }
            });
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

        defaults.attached && defaults.attached.call(eleX(this));
      }

      disconnectedCallback() {
        if (isInternal(this)) {
          return;
        }

        defaults.detached && defaults.detached.call(eleX(this));
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
    // Check if the string starts or ends with '-'
    if (str.charAt(0) === "-" || str.charAt(str.length - 1) === "-") {
      throw new Error(`The string "${str}" cannot start or end with "-"`);
    }

    // Check if the string has consecutive '-' characters
    for (let i = 0; i < str.length - 1; i++) {
      if (str.charAt(i) === "-" && str.charAt(i + 1) === "-") {
        throw new Error(
          `The string "${str}" cannot have consecutive "-" characters`
        );
      }
    }

    // Check if the string has at least one '-' character
    if (!str.includes("-")) {
      throw new Error(`The string "${str}" must contain at least one "-"`);
    }

    return true;
  }

  function deepCopyData(obj) {
    if (obj instanceof Set || obj instanceof Map) {
      throw "The data of the registered component should contain only regular data types such as String, Number, Object and Array. for other data types, please set them after ready.";
    }

    if (obj instanceof Function) {
      throw `Please write the function in the 'proto' property object.`;
    }

    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    const copy = Array.isArray(obj) ? [] : {};

    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = deepCopyData(obj[key]);
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
        } else {
          throw `This is an unclosed FakeNode`;
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
          throw `This is an unclosed FakeNode`;
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

      if (prev instanceof FakeNode) {
        return prev;
      }

      return _start.previousElementSibling;
    }
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
        }, 0);
      },
      _renderContent() {
        if (this.__rendered) {
          return;
        }
        this.__rendered = true;

        const { target, data, temps } = getRenderData(this._fake);

        if (dataRevoked(data)) {
          return;
        }

        this._fake.innerHTML = this.__originHTML;

        render({ target, data, temps });
      },
      _clearContent() {
        this.__rendered = false;

        revokeAll(this._fake);
        this._fake.innerHTML = "";
      },
      init() {
        if (this._bindend) {
          return;
        }

        this._bindend = true;
        const fake = (this._fake = new FakeNode(this.tag));
        this.before(fake);
        fake.init();
        this.remove();

        // 给 else-if 添加 _xif，给 else 初始化
        if (this.tag === "x-if") {
          const others = (this._others = []);

          let next = fake;
          while (true) {
            next = next.nextElementSibling;

            if (!next) {
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
      value() {
        this.refreshValue();
      },
    },
    proto: {
      refreshValue() {
        const val = this.value;

        if (!this._bindend) {
          return;
        }

        const childs = this._fake.children;

        if (!val) {
          childs.forEach((e) => revokeAll(e));
          this._fake.innerHTML = "";
          return;
        }

        if (!(val instanceof Array)) {
          console.warn(
            `The value of x-fill component must be of type Array, and the type of the current value is ${getType(
            val
          )}`
          );

          childs &&
            childs.forEach((el) => {
              revokeAll(el);
              el.remove();
            });
          return;
        }

        const regData = getRenderData(this._fake);

        const xids = childs.map((e) => e._data_xid);

        const { data, temps } = regData;

        const targetTemp = temps[this._name];

        // Adjustment of elements in order
        const len = val.length;
        let currentEl;
        for (let i = 0; i < len; i++) {
          const e = val[i];

          const oldIndex = xids.indexOf(e.xid);

          if (oldIndex > -1) {
            if (oldIndex === i) {
              // No data changes
              currentEl = childs[i];
              continue;
            }

            // position change
            const target = childs[oldIndex];
            const $target = eleX(target);
            // fix data index
            $target.__item.$index = i;
            target.__internal = 1;
            if (i === 0) {
              this._fake.insertBefore(target, childs[0]);
            } else {
              this._fake.insertBefore(target, currentEl.nextElementSibling);
            }
            currentEl = target;
            delete target.__internal;
            continue;
          }

          // new data
          const $ele = createItem(e, temps, targetTemp, data.$host || data, i);
          if (!currentEl) {
            if (childs.length) {
              this._fake.insertBefore($ele.ele, childs[0]);
            } else {
              this._fake.appendChild($ele.ele);
            }
          } else {
            this._fake.insertBefore($ele.ele, currentEl.nextElementSibling);
          }
          currentEl = $ele.ele;
        }

        const newChilds = this._fake.children;

        if (len < newChilds.length) {
          newChilds.slice(len).forEach((e) => {
            e.remove();
            revokeAll(e);
          });
        }
      },
      init() {
        if (this._bindend) {
          return;
        }
        this._bindend = true;
        const fake = (this._fake = new FakeNode("x-fill"));
        this.before(fake);
        fake.init();
        this.remove();

        this.refreshValue();
      },
    },
    ready() {
      this._name = this.attr("name");

      if (this.ele._bindingRendered) {
        this.init();
      } else {
        this.one("binding-rendered", () => this.init());
      }
    },
  });

  const createItem = (data, temps, targetTemp, $host, $index) => {
    const $ele = createXEle(targetTemp.innerHTML);

    const itemData = new Stanz({
      $data: data,
      $ele,
      $host,
      $index,
    });

    render({
      target: $ele.ele,
      data: itemData,
      temps,
      $host,
      isRenderSelf: true,
    });

    const revokes = $ele.ele.__revokes;

    const revoke = () => {
      removeArrayValue(revokes, revoke);
      itemData.revoke();
    };

    revokes.push(revoke);

    $ele.__item = itemData;
    $ele.ele._data_xid = data.xid;

    return $ele;
  };

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

    // get css() {
    //   return getComputedStyle(this.ele);
    // }

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

    clone(bool = true) {
      return eleX(this.ele.cloneNode(bool));
    }

    wrap(content) {
      const $el = createXEle(content);

      const { ele } = this;

      if (!ele.parentNode) {
        throw `The target has a sibling element, so you can't use unwrap`;
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
        throw `The element itself must have a parent`;
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

    const type = getType$1(expr);

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

  function $(expr) {
    if (getType$1(expr) === "string" && !/<.+>/.test(expr)) {
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

  Object.assign($, {
    stanz,
    render,
    convert,
    register,
    fn: Xhear.prototype,
    all: (expr) => searchEle(document, expr).map(eleX),
  });

  return $;

}));
