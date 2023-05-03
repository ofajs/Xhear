import { nextTick } from "../../../stanz/src/public.mjs";
import { register } from "../register.mjs";
import { render } from "./render.mjs";

const revokeAll = (target) => {
  if (target.__revokes) {
    Array.from(target.__revokes).forEach((f) => f && f());
  }
  target.childNodes &&
    Array.from(target.childNodes).forEach((el) => {
      revokeAll(el);
    });
};

function getConditionEles(_this, isEnd = true) {
  const $eles = [];

  let target = isEnd ? _this.__marked_end : _this.__marked_start;
  while (true) {
    target = isEnd ? target.nextSibling : target.previousSibling;
    if (target instanceof Comment) {
      if (target.__$ele) {
        $eles.push(target.__$ele);
        target = isEnd ? target.__end : target.__start;
      }
    } else if (!(target instanceof Text)) {
      break;
    }
  }

  return $eles;
}
const proto = {
  _getRenderData() {
    let target = this.__marked_end;
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
  },
  _renderMarked() {
    this.__originHTML = this.html;
    this.html = "";

    let markedText = this.__originHTML;
    if (markedText.length > 20) {
      markedText = `${this.tag}: ${markedText
        .trim()
        .slice(0, 20)
        .replace(/\n/g, "")} ...`;
    }

    const markedStart = document.createComment(markedText + " --start");
    const markedEnd = document.createComment(markedText + " --end");
    markedStart.__end = markedEnd;
    markedEnd.__start = markedStart;
    markedEnd.__$ele = markedStart.__$ele = this;
    const { ele } = this;
    ele.parentNode.insertBefore(markedStart, ele);
    ele.parentNode.insertBefore(markedEnd, ele);
    this.__marked_start = markedStart;
    this.__marked_end = markedEnd;

    Object.defineProperties(this.ele, {
      __revokes: {
        set(val) {
          markedStart.__revokes = val;
        },
        get() {
          return markedStart.__revokes;
        },
      },
    });
  },
  _renderContent() {
    const e = this._getRenderData();

    if (!e) {
      return;
    }

    const { target, data, temps } = e;

    const markedEnd = this.__marked_end;

    const temp = document.createElement("template");
    temp.innerHTML = this.__originHTML;
    markedEnd.parentNode.insertBefore(temp.content, markedEnd);

    render({ target, data, temps });
  },
  _revokeRender() {
    const markedStart = this.__marked_start;
    const markedEnd = this.__marked_end;

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
  },
  _refreshCondition() {
    const $eles = [this];

    if (this._refreshing) {
      return;
    }

    switch (this.tag) {
      case "x-if":
        $eles.push(...getConditionEles(this));
        break;
      case "x-else-if":
        $eles.unshift(...getConditionEles(this, false));
        $eles.push(...getConditionEles(this));
        break;
    }

    $eles.forEach((e) => (e._refreshing = true));
    nextTick(() => {
      let isOK = false;
      $eles.forEach(($ele) => {
        delete $ele._refreshing;

        if (isOK) {
          $ele._revokeRender();
          return;
        }

        if ($ele.value || $ele.tag === "x-else") {
          $ele._renderContent();
          isOK = true;
          return;
        }

        $ele._revokeRender();
      });
    });
  },
};

register({
  tag: "x-if",
  data: {
    value: "",
  },
  watch: {
    value() {
      this._refreshCondition();
    },
    // value(val) {
    //   if (val) {
    //     this._renderContent();
    //   } else {
    //     this._revokeRender();
    //   }
    // },
  },
  proto,
  ready() {
    this._renderMarked();
    nextTick(() => this.ele.remove());
  },
});

register({
  tag: "x-else-if",
  data: {
    value: "",
  },
  watch: {
    value() {
      this._refreshCondition();
    },
  },
  proto,
  ready() {
    this._renderMarked();
    nextTick(() => this.ele.remove());
  },
});

register({
  tag: "x-else",
  proto,
  ready() {
    this._renderMarked();
    nextTick(() => this.ele.remove());
  },
});
