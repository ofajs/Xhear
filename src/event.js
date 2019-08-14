Object.defineProperties(XhearEle.prototype, {
    on: {
        value(...args) {
            let eventName = args[0],
                selector,
                callback,
                data;

            // 判断是否对象传入
            if (getType(eventName) == "object") {
                let eveOnObj = eventName;
                eventName = eveOnObj.event;
                callback = eveOnObj.callback;
                data = eveOnObj.data;
                selector = eveOnObj.selector;
            } else {
                // 判断第二个参数是否字符串，字符串当做selector处理
                switch (getType(args[1])) {
                    case "string":
                        selector = args[1];
                        callback = args[2];
                        data = args[3];
                        break;
                    default:
                        callback = args[1];
                        data = args[2];
                }
            }

            let originEve = this[ORIEVE] || (this[ORIEVE] = new Map());

            if (!originEve.has(eventName)) {
                let eventCall = () => { }
                originEve.set(eventName, eventCall);
                this.ele.addEventListener(eventName, eventCall);
            }

            this.addListener({
                type: eventName,
                data,
                callback
            });
        }
    }
});