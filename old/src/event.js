const getEventsMap = (target) => {
  return target[EVENTS] ? target[EVENTS] : (target[EVENTS] = new Map());
};

const MOUSEEVENT = glo.MouseEvent || Event;
const TOUCHEVENT = glo.TouchEvent || Event;

const EventMap = new Map([
  ["click", MOUSEEVENT],
  ["mousedown", MOUSEEVENT],
  ["mouseup", MOUSEEVENT],
  ["mousemove", MOUSEEVENT],
  ["mouseenter", MOUSEEVENT],
  ["mouseleave", MOUSEEVENT],
  ["touchstart", TOUCHEVENT],
  ["touchend", TOUCHEVENT],
  ["touchmove", TOUCHEVENT],
]);

// Trigger native events
const triggerEvenet = (_this, name, data, options = {}) => {
  let TargeEvent = EventMap.get(name) || CustomEvent;

  const event =
    name instanceof Event
      ? name
      : new TargeEvent(name, {
          bubbles: true,
          cancelable: true,
          ...options,
        });

  event.data = data;

  return _this.ele.dispatchEvent(event);
};

extend(XEle.prototype, {
  on(name, selector, callback) {
    if (isFunction(selector)) {
      callback = selector;
      selector = undefined;
    } else {
      const real_callback = callback;
      const { ele } = this;
      callback = (event) => {
        let path;
        if (event.path) {
          path = event.path;
        } else {
          path = createXEle(event.target)
            .parents(null, ele)
            .map((e) => e.ele);
          path.unshift(event.target);
        }

        path.some((pTarget) => {
          if (pTarget == ele) {
            return true;
          }

          if (createXEle(pTarget).is(selector)) {
            event.selector = pTarget;
            real_callback(event);
            delete event.selector;
          }
        });
      };
    }

    this.ele.addEventListener(name, callback);
    const eid = "e_" + getRandomId();
    getEventsMap(this).set(eid, {
      name,
      selector,
      callback,
    });
    return eid;
  },
  off(eid) {
    let d = getEventsMap(this).get(eid);

    if (!d) {
      return false;
    }

    this.ele.removeEventListener(d.name, d.callback);
    this[EVENTS].delete(eid);
    return true;
  },
  one(name, selector, callback) {
    let eid, func;
    if (typeof selector == "string") {
      func = callback;
      callback = (e) => {
        func(e);
        this.off(eid);
      };
    } else {
      func = selector;
      selector = (e) => {
        func(e);
        this.off(eid);
      };
    }

    eid = this.on(name, selector, callback);

    return eid;
  },
  trigger(name, data, options = {}) {
    return triggerEvenet(this, name, data, options);
  },
  triggerHandler(name, data) {
    return triggerEvenet(this, name, data, {
      bubbles: false,
    });
  },
});

// Wrapping common events
["click", "focus", "blur"].forEach((name) => {
  extend(XEle.prototype, {
    [name](callback) {
      if (isFunction(callback)) {
        this.on(name, callback);
      } else {
        return this.trigger(name, callback);
      }
    },
  });
});
