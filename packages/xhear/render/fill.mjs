import { register } from "../register.mjs";
import { render } from "./render.mjs";
import { FakeNode } from "./fake-node.mjs";
import Stanz from "../../stanz/main.mjs";
import { createXEle, eleX, revokeAll } from "../util.mjs";
import { removeArrayValue } from "../public.mjs";
import { getRenderData } from "./condition.mjs";

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

      if (!regData) {
        return;
      }

      const { data, temps } = regData;

      const targetTemp = temps[this._name];

      const keyName = this.attr("fill-key") || "xid";
      if (keyName) {
        // debugger;
      }

      if (!childs.length) {
        const frag = document.createDocumentFragment();

        val.forEach((e, i) => {
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
        const positionKeys = childs.map((e) => e._data_xid || e);
        const len = val.length;

        const newFake = new FakeNode("x-fill");
        this._fake.parentNode.insertBefore(newFake, this._fake._start);
        newFake.init();

        for (let i = 0; i < len; i++) {
          const e = val[i];

          const oldIndex = positionKeys.indexOf(e[keyName]);

          if (oldIndex > -1) {
            const oldTarget = childs[oldIndex];
            oldTarget.__internal = 1;
            eleX(oldTarget).__item.$data = e;
            newFake.appendChild(oldTarget);
            delete oldTarget.__internal;
          } else {
            const $ele = createItem(
              e,
              temps,
              targetTemp,
              data.$host || data,
              i,
              keyName
            );

            newFake.appendChild($ele.ele);
          }
        }

        this._fake.remove();
        this._fake = newFake;
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
      this.before(fake);
      fake.init();
      this.remove();

      this.refreshValue();
    },
  },
  ready() {
    this._name = this.attr("name");

    if (!this._name) {
      const desc =
        "The target element does not have a template name to populate";
      console.log(desc, this.ele);
      throw new Error(desc);
    }

    if (this.ele._bindingRendered) {
      this.init();
    } else {
      this.one("binding-rendered", () => this.init());
    }
  },
});

const createItem = (data, temps, targetTemp, $host, $index, keyName) => {
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
  $ele.ele._data_xid = data[keyName] || data;

  return $ele;
};
