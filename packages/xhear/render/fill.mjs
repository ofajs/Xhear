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
          `The value of x-fill component must be of type Array, and the type of the current value is ${getType(
            arrayData
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
            // 不是替换，item内部绑定就可以修正
            return;
          }
        }

        const positionKeys = childs.map((e) => e._data_xid || e);
        let target = this._fake._start.nextElementSibling;

        const vals = arrayData.slice();
        const needRemoves = [];

        let count = 0;

        while (target) {
          if (target === this._fake) {
            if (vals.length) {
              // 已经走到最后，直接往前面添加所有元素
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

                target.parentNode.insertBefore($ele.ele, target);
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
            // 后续都没有了，直接删除
            needRemoves.push(target);
            target = target.nextSibling;
            continue;
          }

          const oldId = positionKeys.indexOf(
            isObj ? currentVal[keyName] : currentVal
          );
          if (oldId > -1) {
            // 原来就有这个key的情况下，进行key位移
            const oldItem = childs[oldId];
            if (
              isObj
                ? currentVal[keyName] !== item.$data[keyName]
                : currentVal !== item.$data
            ) {
              // 调整位置
              oldItem.__internal = 1;
              target.parentNode.insertBefore(oldItem, target);
              delete oldItem.__internal;
              target = oldItem;
            }

            // 更新对象
            const $old = eleX(oldItem);
            if ($old.__item.$data !== currentVal) {
              $old.__item.$data = currentVal;
            }
          } else {
            // 新增元素
            const $ele = createItem(
              currentVal,
              temps,
              targetTemp,
              data.$host || data,
              count,
              keyName
            );

            target.parentNode.insertBefore($ele.ele, target);
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

const createItem = ($data, temps, targetTemp, $host, $index, keyName) => {
  const $ele = createXEle(targetTemp.innerHTML);

  const itemData = new Stanz({
    $data,
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
  $ele.ele._data_xid = $data[keyName] || $data;

  return $ele;
};
