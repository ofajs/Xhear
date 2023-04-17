import { nextTick } from "../stanz/src/public.mjs";
import { createXhear, getNextNode } from "./public.mjs";

export function eleIf({ ele, val }) {
  if (val) {
    const mark = this.__beforeMark;
    if (!mark) {
      return;
    }
    const { parentNode } = mark;
    parentNode.insertBefore(ele, mark);
    this.__beforeMark = null;
    parentNode.removeChild(mark);
  } else {
    const { parentNode } = ele;
    if (!parentNode) {
      return;
    }
    const { __conditionType } = ele;
    const text = ele.textContent.trim().slice(0, 30);
    const comment = (this.__beforeMark = document.createComment(text));
    comment.__conditionType = __conditionType;
    parentNode.insertBefore(comment, ele);
    parentNode.removeChild(ele);
  }
}

export function conditionJudge(ele, type) {
  ele.__conditionType = type;

  // Determine if the previous one is an 'if' or 'ifelse'
  let prevNode = ele;
  do {
    prevNode = prevNode.previousSibling;
  } while (prevNode instanceof Text);

  const prevType = prevNode.__conditionType;
  if (!(prevType === "if" || prevType === "elseIf")) {
    const err = new Error(`The previous element must be if or ifElse`);
    err.target = ele;
    err.prevNode = prevNode;
    throw err;
  }
}

// The "If" condition performs a single judgment
export function refreshCondition(ele) {
  nextTick(() => {
    let allConditionEles = ele.__allConditionEles;

    if (!allConditionEles) {
      allConditionEles = [];
      let target = ele;

      while (target && target.__conditionType) {
        allConditionEles.push(target);
        target = getNextNode(target);
      }

      ele.__allConditionEles = allConditionEles;
    }

    let isOK = 0;
    allConditionEles.forEach((el) => {
      const $el = createXhear(el);

      const { __conditionType, __condition } = el;

      if (isOK) {
        eleIf.call($el, {
          ele: el,
          val: false,
        });
        return;
      } else if (!isOK && el.__conditionType === "else") {
        eleIf.call($el, {
          ele: el,
          val: true,
        });
        return;
      }

      if (__condition) {
        isOK = 1;
      }

      eleIf.call($el, {
        ele: el,
        val: __condition,
      });
    });
  });
}
