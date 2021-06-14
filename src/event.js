// DOM自带事件，何必舍近求远
const getEventsMap = (target) => {
    return target[EVENTS] ? target[EVENTS] : (target[EVENTS] = new Map());
}

const MOUSEEVENT = glo.MouseEvent || Event;
const TOUCHEVENT = glo.TouchEvent || Event;

// 修正 Event Class 用的数据表
const EventMap = new Map([
    ["click", MOUSEEVENT],
    ["mousedown", MOUSEEVENT],
    ["mouseup", MOUSEEVENT],
    ["mousemove", MOUSEEVENT],
    ["mouseenter", MOUSEEVENT],
    ["mouseleave", MOUSEEVENT],
    ["touchstart", TOUCHEVENT],
    ["touchend", TOUCHEVENT],
    ["touchmove", TOUCHEVENT]
]);

// 触发原生事件
const triggerEvenet = (_this, name, data, bubbles = true) => {
    let TargeEvent = EventMap.get(name) || CustomEvent;

    const event = name instanceof Event ? name : new TargeEvent(name, {
        bubbles,
        cancelable: true
    });

    event.data = data;

    // 触发事件
    return _this.ele.dispatchEvent(event);
}

extend(XEle.prototype, {
    on(name, selector, callback) {
        if (isFunction(selector)) {
            callback = selector;
            selector = undefined;
        }
        else {
            const real_callback = callback;
            const { ele } = this;
            callback = (event) => {
                let path;
                if (event.path) {
                    path = event.path;
                } else {
                    path = createXEle(event.target).parents(null, ele).map(e => e.ele);
                    path.unshift(event.target);
                }

                path.some(pTarget => {
                    if (pTarget == ele) {
                        return true;
                    }

                    if (createXEle(pTarget).is(selector)) {
                        event.selector = pTarget;
                        real_callback(event);
                        delete event.selector;
                    }
                });
            }
        }

        this.ele.addEventListener(name, callback);
        const eid = "e_" + getRandomId()
        getEventsMap(this).set(eid, {
            name, selector, callback
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
            }
        } else {
            func = selector;
            selector = (e) => {
                func(e);
                this.off(eid);
            }
        }

        eid = this.on(name, selector, callback);

        return eid;
    },
    trigger(name, data) {
        return triggerEvenet(this, name, data);
    },
    triggerHandler(name, data) {
        return triggerEvenet(this, name, data, false);
    }
});

// 常用事件封装
["click", "focus", "blur"].forEach(name => {
    extend(XEle.prototype, {
        [name](callback) {
            if (isFunction(callback)) {
                this.on(name, callback);
            } else {
                // callback 就是 data
                return this.trigger(name, callback);
            }
        }
    });
});