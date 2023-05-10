import { nextTick } from "../../stanz/src/public.mjs";
import {
  hyphenToUpperCase,
  capitalizeFirstLetter,
  toDashCase,
} from "./public.mjs";
import { convert, render } from "./render/render.mjs";
import { eleX } from "./util.mjs";

const COMPS = {};

export const register = (opts = {}) => {
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

  validateTagName(defaults.tag);

  const name = capitalizeFirstLetter(hyphenToUpperCase(defaults.tag));

  if (COMPS[name]) {
    throw `Component ${name} already exists`;
  }

  const template = document.createElement("template");
  template.innerHTML = defaults.temp;
  const temps = convert(template);

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

      $ele.extend(defaults.proto, { enumerable: false });

      if (defaults.attrs) {
        const attrKeys = getAttrKeys(defaults.attrs);

        // fix self attribule value
        $ele.watchTick((e) => {
          attrKeys.forEach((key) => {
            if (e.hasModified(key)) {
              this.setAttribute(toDashCase(key), $ele[key]);
            }
          });
        });
      }

      const data = {
        ...defaults.data,
        ...defaults.attrs,
      };

      for (let [key, value] of Object.entries(data)) {
        if (!$ele.hasOwnProperty(key)) {
          $ele[key] = value;
        }
      }

      if (defaults.temp) {
        const root = this.attachShadow({ mode: "open" });

        root.innerHTML = template.innerHTML;

        render({
          target: root,
          data: $ele,
          temps,
        });
      }

      defaults.ready && defaults.ready.call($ele);

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
    }

    connectedCallback() {
      defaults.attached &&
        !isInArray(this) &&
        defaults.attached.call(eleX(this));
    }

    disconnectedCallback() {
      defaults.detached &&
        !isInArray(this) &&
        defaults.detached.call(eleX(this));
    }

    attributeChangedCallback(name, oldValue, newValue) {
      const $ele = eleX(this);

      if (!/[^\d.]/.test(newValue) && typeof $ele[name] === "number") {
        newValue = Number(newValue);
      }

      $ele[name] = newValue;
    }

    static get observedAttributes() {
      return getAttrKeys(defaults.attrs || {}).map((e) => toDashCase(e));
    }
  });

  customElements.define(defaults.tag, XElement);
};

function isInArray(ele) {
  let target = ele;

  while (target) {
    if (target.__inArray) {
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
