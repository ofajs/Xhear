
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

XhearEleFn.extend({
    on(...args) {
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
            let eventCall = (e) => {
                let { _para_x_eve_ } = e;

                let event;
                if (_para_x_eve_) {
                    event = _para_x_eve_;

                    // 当target不一致时，修正target
                    if (event.target.ele !== e.target) {
                        event.target = createXhearEle(e.target);
                    }

                    let newKeys = [];

                    let tarEle = e.target;
                    while (tarEle !== e.currentTarget) {
                        let par = tarEle.parentNode;
                        let tarId = Array.from(par.children).indexOf(tarEle);
                        newKeys.unshift(tarId);
                        tarEle = par;
                    }

                    // 重新修正keys
                    event.keys = newKeys;
                } else {
                    event = new XEvent({
                        type: eventName,
                        target: createXhearEle(e.target)
                    });

                    // 事件方法转移
                    event.on("set-bubble", (e2, val) => !val && e.stopPropagation());
                    event.on("set-cancel", (e2, val) => val && e.stopImmediatePropagation());
                    event.preventDefault = e.preventDefault.bind(e);

                    e._para_x_eve_ = event;
                }

                // 设置原始事件对象
                event.originalEvent = e;

                // 触发事件
                this.emitHandler(event);

                // 清空原始事件
                event.originalEvent = null;
            }
            originEve.set(eventName, eventCall);
            this.ele.addEventListener(eventName, eventCall);
        }

        this.addListener({
            type: eventName,
            data,
            callback
        });

        if (selector) {
            // 获取事件寄宿对象
            let eves = getEventsArr(eventName, this);

            eves.forEach(e => {
                if (e.callback == callback) {
                    e.before = (opts) => {
                        let { self, event } = opts;
                        let target = event.target;

                        // 目标元素
                        let delegateTarget = target.parents(selector)[0];
                        if (!delegateTarget && target.is(selector)) {
                            delegateTarget = target;
                        }

                        // 判断是否在selector内
                        if (!delegateTarget) {
                            return 0;
                        }

                        // 通过selector验证
                        // 设置两个关键数据
                        Object.assign(event, {
                            selector,
                            delegateTarget
                        });

                        // 返回可运行
                        return 1;
                    }
                    e.after = (opts) => {
                        let { self, event } = opts;

                        // 删除无关数据
                        delete event.selector;
                        delete event.delegateTarget;
                    }
                }
            });
        }
    },
    off(...args) {
        let eventName = args[0];

        // 获取事件寄宿对象
        let eves = getEventsArr(eventName, this);

        // 继承旧方法
        XData.prototype.off.apply(this, args);

        if (!eves.length) {
            let originEve = this[ORIEVE] || (this[ORIEVE] = new Map());

            // 原生函数注册也干掉
            let oriFun = originEve.get(eventName);
            oriFun && this.ele.removeEventListener(eventName, oriFun);
        }
    },
    trigger(type) {
        let event;

        if (type instanceof Event) {
            event = type;
        } else {
            let E = EventMap.get(type) || Event;
            event = new E(type, {
                bubbles: true,
                cancelable: true
            });
        }

        // 触发事件
        this.ele.dispatchEvent(event);
    }
});