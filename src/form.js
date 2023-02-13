// Normalize the form component because forms are so commonly used
// Methods for rendering form elements
const renderInput = (xele) => {
  let type = xele.attr("type") || "text";
  const { ele } = xele;

  let d_opts = {
    type: {
      enumerable: true,
      get: () => type,
    },
    name: {
      enumerable: true,
      get: () => ele.name,
    },
    value: {
      enumerable: true,
      get() {
        return ele.hasOwnProperty("__value") ? ele.__value : ele.value;
      },
      set(val) {
        // Conversion of input numbers to characters
        ele.value = ele.__value = val;

        emitUpdate(xele, {
          xid: xele.xid,
          name: "setData",
          args: ["value", val],
        });
      },
    },
    disabled: {
      enumerable: true,
      get() {
        return ele.disabled;
      },
      set(val) {
        ele.disabled = val;
      },
    },
    // error message
    msg: {
      writable: true,
      value: null,
    },
    [CANSETKEYS]: {
      value: new Set(["value", "disabled", "msg", ...xEleDefaultSetKeys]),
    },
  };

  switch (type) {
    case "radio":
    case "checkbox":
      Object.assign(d_opts, {
        checked: {
          enumerable: true,
          get() {
            return ele.checked;
          },
          set(val) {
            ele.checked = val;
          },
        },
        name: {
          enumerable: true,
          get() {
            return ele.name;
          },
        },
      });

      // radio or checkbox does not have the property msg
      delete d_opts.msg;

      xele.on("change", (e) => {
        emitUpdate(xele, {
          xid: xele.xid,
          name: "setData",
          args: ["checked", ele.checked],
        });
      });

      d_opts[CANSETKEYS].value.add("checked");
      break;
    case "file":
      Object.assign(d_opts, {
        accept: {
          enumerable: true,
          get() {
            return ele.accept;
          },
        },
      });
      break;
    case "text":
    default:
      xele.on("input", (e) => {
        delete ele.__value;

        emitUpdate(xele, {
          xid: xele.xid,
          name: "setData",
          args: ["value", ele.value],
        });
      });
      break;
  }

  defineProperties(xele, d_opts);
};

class FromXData extends XData {
  constructor(obj, { selector, delay, _target }) {
    super(obj, "root");

    this._selector = selector;
    this._target = _target;
    this._delay = delay;

    let isInit = 0;

    let backupData;

    let watchFun = () => {
      const eles = this.eles();
      const obj = getFromEleData(eles, this);

      const objKeys = Object.keys(obj);
      Object.keys(this)
        .filter((e) => {
          return !objKeys.includes(e);
        })
        .forEach((k) => {
          delete this[k];
        });

      Object.assign(this, obj);

      backupData = this.toJSON();

      if (!isInit) {
        return;
      }

      verifyFormEle(eles);
    };

    let timer;
    this._wid = _target.watch(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        watchFun();
      }, this._delay);
    });

    // Data initialization
    watchFun();

    isInit = 1;

    // Reverse data binding
    this.watchTick((e) => {
      let data = this.toJSON();

      Object.entries(data).forEach(([k, value]) => {
        let oldVal = backupData[k];

        if (
          value !== oldVal ||
          (typeof value == "object" &&
            typeof oldVal == "object" &&
            JSON.stringify(value) !== JSON.stringify(oldVal))
        ) {
          this.eles(k).forEach((ele) => {
            switch (ele.type) {
              case "checkbox":
                if (value.includes(ele.value)) {
                  ele.checked = true;
                } else {
                  ele.checked = false;
                }
                break;
              case "radio":
                if (ele.value == value) {
                  ele.checked = true;
                } else {
                  ele.checked = false;
                }
                break;
              case "text":
              default:
                ele.value = value;
                break;
            }
          });
        }
      });

      backupData = data;
    });
  }

  // Get form elements
  eles(propName) {
    let eles = this._target.all(this._selector);

    if (propName) {
      return eles.filter((e) => e.name === propName);
    }

    return eles;
  }
}

// Get form data from an elements
const getFromEleData = (eles, oldData) => {
  const obj = {};

  eles.forEach((ele) => {
    const { name, type, value } = ele;

    switch (type) {
      case "radio":
        if (ele.checked) {
          obj[name] = value;
        }
        break;
      case "checkbox":
        let tar_arr =
          obj[name] || (obj[name] = oldData[name]) || (obj[name] = []);
        if (ele.checked) {
          if (!tar_arr.includes(ele.value)) {
            tar_arr.push(value);
          }
        } else if (tar_arr.includes(ele.value)) {
          // Delete if included
          tar_arr.splice(tar_arr.indexOf(ele.value), 1);
        }
        break;
      case "text":
      default:
        obj[name] = value;
    }
  });

  return obj;
};

const verifyFormEle = (eles) => {
  // Re-run the verification
  eles.forEach((e) => {
    const event = new CustomEvent("verify", {
      bubbles: false,
    });
    event.msg = "";
    event.formData = this;
    event.$target = e;

    e.trigger(event);

    if (!e.hasOwnProperty("msg")) {
      return;
    }

    const { msg } = event;
    const msg_type = getType(msg);

    // msg can only be Error or a string
    if (msg_type == "string") {
      e.msg = msg || null;
    } else if (msg_type == "error") {
      if (getType(e.msg) !== "error" || e.msg.message !== msg.message) {
        e.msg = msg;
      }
    } else {
      console.warn({
        target: e,
        msg,
        desc: `msg can only be Error or String`,
      });
    }
  });
};

extend(XEle.prototype, {
  // Plug-in methods specifically for forms
  form(opts) {
    const defs = {
      selector: "input,textarea,select",
      delay: 100,
    };

    if (getType(opts) === "string") {
      defs.selector = opts;
    } else {
      Object.assign(defs, opts);
    }

    // Returned object data
    const formdata = new FromXData(
      {},
      {
        selector: defs.selector,
        delay: defs.delay,
        _target: this,
      }
    );

    return formdata;
  },
});
