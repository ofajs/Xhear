import { register } from "../register.mjs";
import { render } from "./render.mjs";

const proto = {
  _getRenderData() {
    const { parents } = this;
    const t = parents.find((e) => {
      return !!e.ele.__render_data;
    });

    if (t) {
      const { ele } = t;
      return {
        target: ele,
        data: ele.__render_data,
        temps: ele.__render_temps,
      };
    }

    return null;
  },
};

const revokeAll = (target) => {
  if (target.__revokes) {
    // target.__revoke();
    Array.from(target.__revokes).forEach((f) => f && f());
  }
  target.childNodes &&
    Array.from(target.childNodes).forEach((el) => {
      revokeAll(el);
    });
};

register({
  tag: "x-if",
  //   temp: `<style>:host{display:contents;}</style><slot></slot>`,
  data: {
    value: "",
  },
  watch: {
    value(val) {
      const e = this._getRenderData();

      if (!e) {
        const error = new Error(
          `x-if is only allowed within register or render component`
        );
        throw error;
      }

      const { target, data, temps } = e;

      console.log("e => ", e);

      const markedStart = this.__marked_start;
      const markedEnd = this.__marked_end;

      if (val) {
        const el = document.createElement("template");
        el.innerHTML = this.__originHTML;
        const childs = Array.from(el.content.childNodes);
        const frag = document.createDocumentFragment();
        childs.forEach((e) => frag.append(e));
        markedEnd.parentNode.insertBefore(frag, markedEnd);

        // this.html = this.__originHTML;

        render({ target, data, temps });
      } else {
        let target = markedEnd.previousSibling;

        while (true) {
          if (!target || target === markedStart) {
            break;
          }

          revokeAll(target);
          const oldTarget = target;
          target = target.previousSibling;
          oldTarget.remove();
        }

        // revokeAll(this.ele);
        // this.html = "";
      }
    },
  },
  proto,
  ready() {
    this.__originHTML = this.html;
    this.html = "";

    let markedText = this.__originHTML;
    if (markedText.length > 20) {
      markedText = `x-if: ${markedText.slice(0, 20)} ...`;
    }

    const markedStart = document.createComment(markedText + " --start");
    const markedEnd = document.createComment(markedText + " --end");
    const { ele } = this;
    ele.parentNode.insertBefore(markedStart, ele);
    ele.parentNode.insertBefore(markedEnd, ele);
    this.__marked_start = markedStart;
    this.__marked_end = markedEnd;
    // ele.remove();
  },
});
