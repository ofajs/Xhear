import { isFunction } from "../stanz/src/public.mjs";
import { createXhear } from "./public.mjs";

const searchEle = (el, expr) => Array.from(el.querySelectorAll(expr));

const convertToFunc = (expr, data) => {
  return new Function(`with(this){return ${expr};}`).bind(data);
};

export function render({ data, content, target }) {
  if (content) {
    target.innerHTML = content;
  }

  const texts = target.querySelectorAll("xtext");

  const tasks = [];

  data.watchTick(() => {
    tasks.forEach((func) => func());
  });

  Array.from(texts).forEach((el) => {
    const textEl = document.createTextNode("asd");
    const { parentNode } = el;
    parentNode.insertBefore(textEl, el);
    parentNode.removeChild(el);

    const func = convertToFunc(el.getAttribute("expr"), data);
    tasks.push(() => {
      textEl.textContent = func();
    });
  });

  const eles = searchEle(target, `[x-bind-data]`);

  eles.forEach((el) => {
    const bindData = JSON.parse(el.getAttribute("x-bind-data"));

    const $el = createXhear(el);

    for (let [actionName, arr] of Object.entries(bindData)) {
      arr.forEach((args) => {
        try {
          const { once } = $el[actionName];

          const func = () => {
            $el[actionName](...args, { isExpr: true, data });
          };

          if (once) {
            // The render function will only be executed once
            func();
          } else {
            tasks.push(func);
          }
        } catch (error) {
          // throw {
          //   desc: `This method does not exist : ${actionName}`,
          //   error,
          // }

          console.error({
            desc: `This method does not exist : ${actionName}`,
            error,
          });
        }
      });
    }

    el.removeAttribute("x-bind-data");
  });

  tasks.forEach((func) => func());
}

export function convert(el) {
  const { tagName } = el;
  if (tagName === "TEMPLATE") {
    let content = el.innerHTML;
    const matchs = content.match(/{{.+?}}/g);

    matchs.forEach((str) => {
      content = content.replace(
        str,
        `<xtext expr="${str.replace(/{{(.+?)}}/, "$1")}"></xtext>`
      );
    });

    el.innerHTML = content;

    convert(el.content);
  } else if (tagName) {
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

  if (el.children) {
    Array.from(el.children).forEach((el) => {
      convert(el);
    });
  }
}

const getVal = (val) => {
  if (isFunction(val)) {
    return val();
  }

  return val;
};

export default {
  _convertExpr(options = {}, expr) {
    const { isExpr, data } = options;

    if (!isExpr) {
      return expr;
    }

    return convertToFunc(expr, data);
  },
  prop(name, value, options) {
    value = this._convertExpr(options, value);
    value = getVal(value);

    this[name] = value;
  },
  attr(name, value, options) {
    value = this._convertExpr(options, value);
    value = getVal(value);

    this.ele.setAttribute(name, value);
  },
};
