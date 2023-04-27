import Stanz from "../../../stanz/src/main.mjs";
import { hyphenToUpperCase, isArrayEqual } from "../public.mjs";
import { createXEle } from "../util.mjs";
import { render } from "./render.mjs";

export default {
  fill(tempName, key, options) {
    const { data, temps } = options;
    const $host = options.$host || data;

    const targetTemp = temps[hyphenToUpperCase(tempName)];

    const _ele = this.ele;
    const revokes = [];

    const wid = data.watchTick((e) => {
      if (e.hasReplaced(key)) {
        replaceIt({ data, key, _ele, targetTemp, temps, $host });
        return;
      } else if (!e.hasModified(key)) {
        return;
      }

      const target = data.get(key);

      const { children } = _ele;

      const oldArray = Array.from(children).map((e) => e.__render_data.$data);
      const newArray = Array.from(target);

      if (isArrayEqual(oldArray, newArray)) {
        return;
      }

      for (let i = 0, len = target.length; i < len; i++) {
        const current = target[i];
        const cursorEl = children[i];

        if (!cursorEl) {
          const { ele } = createItem(current, targetTemp, temps, $host);
          _ele.appendChild(ele);
          continue;
        }

        const cursorData = cursorEl.__render_data.$data;

        if (current === cursorData) {
          continue;
        }

        if (oldArray.includes(current)) {
          // Data displacement occurs
          const oldEl = Array.from(children).find(
            (e) => e.__render_data.$data === current
          );
          oldEl.__inArray = 1;
          _ele.insertBefore(oldEl, cursorEl);
          delete oldEl.__inArray;
        } else {
          // New elements added
          const { ele } = createItem(current, targetTemp, temps, $host);
          _ele.insertBefore(ele, cursorEl);
        }

        // need to be deleted
        if (!newArray.includes(cursorData)) {
          revokeEl(cursorEl);
          cursorEl.remove();
        }
      }
    });

    replaceIt({ data, key, _ele, targetTemp, temps, $host });

    return () => {
      data.unwatch(wid);
      revokes.forEach((f) => f());
    };
  },
};

const createItem = (d, targetTemp, temps, $host) => {
  const itemData = new Stanz({
    $data: d,
    $host,
  });

  const $ele = createXEle(targetTemp.innerHTML);
  const { ele } = $ele;

  const revoke = render({
    target: ele,
    data: itemData,
    temps,
    $host,
  });

  ele.setAttribute("x-fill-item", 1);

  return { ele, itemData, revoke };
};

const revokeEl = (el) => {
  const { __render_data } = el;

  if (__render_data) {
    __render_data.revoke();
  }

  Array.from(el.querySelectorAll("[x-fill-item]")).forEach(revokeEl);
};

const replaceIt = ({ data, key, _ele, targetTemp, temps, $host }) => {
  const target = data.get(key);

  // clear old data
  Array.from(_ele.children).forEach(revokeEl);

  _ele.innerHTML = "";

  if (!target) {
    return;
  }

  const revokes = [];

  target.forEach((d) => {
    const { ele, revoke } = createItem(d, targetTemp, temps, $host);
    _ele.appendChild(ele);
    revokes.push(revokes);
  });

  return revokes;
};
