// All registered components
const Components = {};
const ComponentResolves = {};

// get component
const getComp = (name) => {
  name = attrToProp(name);

  // Return directly if you have registration
  if (Components[name]) {
    return Components[name];
  }

  // Creating Mounted Components
  let pms = new Promise((res) => {
    ComponentResolves[name] = res;
  });
  Components[name] = pms;

  return pms;
};

// render elements
const renderXEle = async ({ xele, defs, temps, _this }) => {
  Object.assign(xele, defs.data, defs.attrs);

  defs.created && defs.created.call(xele);

  if (defs.temp) {
    // Add shadow root
    const sroot = _this.attachShadow({ mode: "open" });

    sroot.innerHTML = defs.temp;

    // Rendering elements
    renderTemp({
      host: xele,
      xdata: xele,
      content: sroot,
      temps,
    });

    // Child elements have changes that trigger element rendering
    xele.shadow &&
      xele.shadow.watchTick((e) => {
        if (e.some((e2) => e2.path.length > 1)) {
          emitUpdate(xele, {
            xid: xele.xid,
            name: "forceUpdate",
          });
        }
      }, 10);

    const links = sroot.querySelectorAll("link");
    if (links && links.length) {
      await Promise.all(
        Array.from(links).map((linkEle) => {
          return new Promise((resolve, reject) => {
            if (linkEle.sheet) {
              resolve();
            } else {
              let succeedCall, errCall;
              linkEle.addEventListener(
                "load",
                (succeedCall = (e) => {
                  linkEle.removeEventListener("load", succeedCall);
                  linkEle.removeEventListener("error", errCall);
                  resolve();
                })
              );
              linkEle.addEventListener(
                "error",
                (errCall = (e) => {
                  linkEle.removeEventListener("load", succeedCall);
                  linkEle.removeEventListener("error", errCall);
                  reject({
                    desc: "link load error",
                    ele: linkEle,
                    target: xele.ele,
                  });
                })
              );
            }
          });
        })
      );
    }
  }

  defs.ready && defs.ready.call(xele);

  // atributes listening
  if (!isEmptyObj(defs.attrs)) {
    const { ele } = xele;
    // First determine if there is a value to get
    Object.keys(defs.attrs).forEach((k) => {
      if (ele.hasAttribute(k)) {
        xele[k] = ele.getAttribute(k);
      }
    });

    xele.watchTick((e) => {
      _this.__set_attr = 1;
      Object.keys(defs.attrs).forEach((key) => {
        let val = xele[key];
        if (val === null || val === undefined) {
          _this.removeAttribute(propToAttr(key));
        } else {
          _this.setAttribute(propToAttr(key), xele[key]);
        }
      });
      delete _this.__set_attr;
    });
  }

  // The watch function triggers
  let d_watch = defs.watch;
  if (!isEmptyObj(d_watch)) {
    xele.watchKey(d_watch, true);
  }
};

// The revoke function has been run
const RUNNDEDREVOKE = Symbol("runned_revoke");

// Registering component functions
const register = (opts) => {
  const defs = {
    // Registered component name
    tag: "",
    // Body content string
    temp: "",
    // Keys bound to attributes
    attrs: {},
    // Initialization data after element creation
    data: {},
    // The listener function for the element
    watch: {},
    // Methods merged into the prototype
    proto: {},
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
  };

  Object.assign(defs, opts);

  let temps;

  if (defs.temp) {
    const d = transTemp(defs.temp, defs.tag);
    defs.temp = d.html;
    temps = d.temps;
  }

  // Generate a new XEle class
  let compName = attrToProp(opts.tag);

  // const CustomXEle = Components[compName] = class extends XEle {
  const CustomXEle = class extends XEle {
    constructor(ele) {
      super(ele);

      ele.isCustom = true;
    }

    // Forced view refresh
    forceUpdate() {
      emitUpdate(this, {
        xid: this.xid,
        name: "forceUpdate",
      });
    }
    // Recycle all data within the element (prevent garbage collection failure)
    revoke() {
      if (this[RUNNDEDREVOKE]) {
        return;
      }
      this[RUNNDEDREVOKE] = 1;
      Object.values(this).forEach((child) => {
        if (!(child instanceof XEle) && isxdata(child)) {
          clearXDataOwner(child, this[XDATASELF]);
        }
      });

      removeElementBind(this.shadow.ele);
    }
  };

  extend(CustomXEle.prototype, defs.proto);

  const cansetKeys = getCansetKeys(defs);

  // Extending CANSETKEYS
  defineProperties(CustomXEle.prototype, {
    [CANSETKEYS]: {
      writable: true,
      value: new Set([...xEleDefaultSetKeys, ...cansetKeys]),
    },
  });

  // Registering native components
  const XhearElement = class extends HTMLElement {
    constructor(...args) {
      super(...args);

      this.__xEle__ = new CustomXEle(this);

      const xele = createXEle(this);

      renderXEle({
        xele,
        defs,
        temps,
        _this: this,
      }).then((e) => {
        if (this.__x_connected) {
          this.setAttribute("x-render", 1);
        } else {
          this.x_render = 1;
        }
      });
    }

    connectedCallback() {
      // console.log("connectedCallback => ", this);
      if (this.x_render) {
        this.setAttribute("x-render", this.x_render);
      }
      this.__x_connected = true;
      if (defs.attached && !this.__x_runned_connected) {
        nextTick(() => {
          if (this.__x_connected && !this.__x_runned_connected) {
            this.__x_runned_connected = true;
            defs.attached.call(createXEle(this));
          }
        });
      }
    }

    // adoptedCallback() {
    //     console.log("adoptedCallback => ", this);
    // }

    disconnectedCallback() {
      // console.log("disconnectedCallback => ", this);
      this.__x_connected = false;
      if (defs.detached && !this.__x_runnded_disconnected) {
        nextTick(() => {
          if (!this.__x_connected && !this.__x_runnded_disconnected) {
            this.__x_runnded_disconnected = true;
            defs.detached.call(createXEle(this));
          }
        });
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (this.__set_attr) return;

      createXEle(this)[attrToProp(name)] = newValue;
    }

    static get observedAttributes() {
      return Object.keys(defs.attrs).map((e) => propToAttr(e));
    }
  };

  customElements.define(defs.tag, XhearElement);

  // Setup registration complete
  if (ComponentResolves[compName]) {
    ComponentResolves[compName](CustomXEle);
    delete ComponentResolves[compName];
  } else {
    Components[compName] = Promise.resolve(CustomXEle);
  }
};

// Get the settable keys according to defaults
const getCansetKeys = (defs) => {
  const { attrs, data, watch, proto } = defs;

  const keys = [
    ...Object.keys(attrs),
    ...Object.keys(data),
    ...Object.keys(watch),
  ];

  const protoDesp = Object.getOwnPropertyDescriptors(proto);
  Object.keys(protoDesp).forEach((keyName) => {
    let { set } = protoDesp[keyName];

    if (set) {
      keys.push(keyName);
    }
  });

  return keys;
};

// Convert temp into a renderable template
const transTemp = (temp, regTagName) => {
  // Removing commented code
  temp = temp.replace(/<!--.+?-->/g, "");

  // Custom String Conversion
  var textDataArr = temp.match(/{{.+?}}/g);
  textDataArr &&
    textDataArr.forEach((e) => {
      var key = /{{(.+?)}}/.exec(e);
      if (key) {
        // temp = temp.replace(e, `<span :text="${key[1]}"></span>`);
        temp = temp.replace(e, `<x-span prop="${encodeURI(key[1])}"></x-span>`);
      }
    });

  const tsTemp = document.createElement("template");
  tsTemp.innerHTML = temp;

  // Fix temp:xxx template on native elements
  let addTemps = [],
    removeRegEles = [];

  Array.from(tsTemp.content.querySelectorAll("*")).forEach((ele) => {
    const bindData = {};

    // Properties that need to be removed
    const needRemoveAttrs = [];

    Array.from(ele.attributes).forEach((attrObj) => {
      let { name, value } = attrObj;

      // Template Extraction
      let tempMatch = /^temp:(.+)/.exec(name);
      if (tempMatch) {
        let [, tempName] = tempMatch;
        let tempEle = document.createElement("template");
        tempEle.setAttribute("name", tempName);
        ele.removeAttribute(name);
        tempEle.innerHTML = ele.outerHTML;
        addTemps.push(tempEle);
        removeRegEles.push(ele);
        return true;
      }

      let command;
      let target;

      if (/^#/.test(name)) {
        command = "cmd";
        target = name.replace(/^#/, "");
      } else if (/^@/.test(name)) {
        command = "on";
        target = name.replace(/^@/, "");
      } else if (name.includes(":")) {
        // Fixed with command separator
        let m_arr = name.split(":");

        if (m_arr.length == 2) {
          // Assign values if the template is correct
          command = m_arr[0];
          target = m_arr[1];

          if (command === "") {
            // Fix Attribute Binding
            command = "prop";
          }
        } else {
          // Error in binding identification
          throw {
            desc: "template binding mark error",
            target: ele,
            expr: name,
          };
        }
      }

      if (command) {
        let data = bindData[command] || (bindData[command] = {});
        if (command == "on") {
          data[target] = {
            name: value,
          };
        } else if (target) {
          data[target] = value;
        }
        needRemoveAttrs.push(name);
      }
    });

    if (needRemoveAttrs.length) {
      // ele.setAttribute("bind-data", JSON.stringify(bindData));
      // ele.setAttribute('bind-keys', Object.keys(bindData).join(" "));

      // Restore original properties
      Object.keys(bindData).forEach((bName) => {
        let data = bindData[bName];
        if (bName == "cmd") {
          Object.keys(data).forEach((dName) => {
            ele.setAttribute(`x-cmd-${dName}`, data[dName]);
          });
        } else {
          ele.setAttribute(`x-${bName}`, JSON.stringify(data));
        }
      });

      needRemoveAttrs.forEach((name) => ele.removeAttribute(name));
    }
  });

  if (addTemps.length) {
    addTemps.forEach((ele) => {
      tsTemp.content.appendChild(ele);
    });
    removeRegEles.forEach((ele) => {
      tsTemp.content.removeChild(ele);
    });
  }

  // Convert template data
  Array.from(tsTemp.content.querySelectorAll("template")).forEach((e) => {
    e.innerHTML = transTemp(e.innerHTML).html;
  });

  // fix x-cmd-if elements
  wrapIfTemp(tsTemp);

  // get templates
  let temps = new Map();

  Array.from(tsTemp.content.querySelectorAll(`template[name]`)).forEach((e) => {
    temps.set(e.getAttribute("name"), {
      ele: e,
      code: e.content.children[0].outerHTML,
    });
    e.parentNode.removeChild(e);
  });

  // Inspection of the template
  if (temps.size) {
    for (let [key, e] of temps.entries()) {
      const { children } = e.ele.content;
      if (children.length !== 1) {
        throw {
          name: key,
          html: e.code,
          tag: regTagName,
          desc: "register error, only one element must exist in the template",
        };
      } else {
        if (children[0].getAttribute("x-cmd-if")) {
          throw {
            name: key,
            html: e.code,
            tag: regTagName,
            desc: "register error, cannot use if on template first element",
          };
        }
      }
    }
  }

  return {
    temps,
    html: tsTemp.innerHTML,
  };
};

// Wrap the template around the x-cmd-if element
const wrapIfTemp = (tempEle) => {
  let iEles = tempEle.content.querySelectorAll(
    "[x-cmd-if],[x-cmd-else-if],[x-cmd-else],[x-cmd-await],[x-cmd-then],[x-cmd-catch]"
  );

  iEles.forEach((ele) => {
    if (ele.tagName.toLowerCase() == "template") {
      return;
    }

    let ifTempEle = document.createElement("template");
    [
      "x-cmd-if",
      "x-cmd-else-if",
      "x-cmd-else",
      "x-cmd-await",
      "x-cmd-then",
      "x-cmd-catch",
    ].forEach((name) => {
      let val = ele.getAttribute(name);

      if (val === null) {
        return;
      }

      ifTempEle.setAttribute(name, val);
      ele.removeAttribute(name);
    });

    ele.parentNode.insertBefore(ifTempEle, ele);
    ifTempEle.content.appendChild(ele);
  });

  // The internal template is also wrapped
  Array.from(tempEle.content.querySelectorAll("template")).forEach(wrapIfTemp);
};
