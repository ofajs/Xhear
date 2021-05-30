// DOM自带事件，何必舍近求远
const getEventsMap = (target) => {
    return target[EVENTS] ? target[EVENTS] : (target[EVENTS] = new Map());
}

extend(XEle.prototype, {
    on(name, selector, callback) {
        if (isFunction(selector)) {
            callback = selector;
            selector = undefined;
            this.ele.addEventListener(name, callback);
            const eid = "e_" + getRandomId()
            getEventsMap(this).set(eid, {
                name, selector, callback
            });
            return eid;
        }
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
    emit(name, data) {

    },
    emitHandler(name, data) {

    }
});