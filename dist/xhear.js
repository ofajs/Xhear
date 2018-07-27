((glo) => {
    "use strict";

    // 全局存在 jQuery 的情况下，就不瞎折腾了
    if (glo.$) {
        return;
    }

    // COMMON
    const DOCUMENT = document;
    const STR_string = "string";
    const STR_array = "array";

    const FALSE = !1;
    const TRUE = !0;
    const UNDEFINED = undefined;

    // function
    // 获取类型
    let objToString = Object.prototype.toString;
    const getType = value => objToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');

    // 是否函数(包括异步函数)
    const isFunction = v => getType(v).search('function') > -1;

    const isString = v => getType(v) === "string";

    // 是否 undefined
    const isUndefined = v => v === undefined;

    // 是否像数组（包括数组）
    const isArrayLike = obj => !isUndefined(obj) && getType(obj.length) === "number" && obj.length >= 0 && !isFunction(obj) && !isString(obj);

    const isElement = obj => obj instanceof Element;

    const {
        defineProperty,
        assign
    } = Object;

    // 生成数组
    const makeArray = arr => Array.from(arr);

    // 获得随机id
    const getRandomId = () => Math.random().toString(32).substr(2);

    // 合并数组
    const merge = (mainArr, arr2) => mainArr.splice(mainArr.length, 0, ...arr2);

    // 删除数组内的某项
    const removeByArr = (arr, tar) => {
        let id = arr.indexOf(tar);
        if (id > -1) {
            arr.splice(id, 1);
        }
    }

    // 遍历
    const each = (arr, func) => arr.some((e, i) => func(e, i) === FALSE);

    // 获取样式
    const getStyle = getComputedStyle;

    // 拆分空格参数
    const splitSpace = (value, func) => {
        let vArr = value.split(' ');
        each(vArr, e => func(e));
    }

    // 关键key
    const XQUEKEY = "XQUE_" + getRandomId();
    const XQUEEVENTKEY = XQUEKEY + "_event";

    // 单个参数的拆分固定式
    // getFunc 非必须
    // isReturnGetFunc 是否返回 getFunc 函数
    const singleIn = (targets, value, func, getFunc, isReturnGetFunc) => {
        // 获取值的类型
        let v_isFunc = isFunction(value);

        if (!isUndefined(value)) {
            // 遍历对象
            each(targets, (e, i) => {
                // 获取值
                let before_val;
                if (v_isFunc) {
                    before_val = value.call(e, i, getFunc && getFunc(e));
                } else {
                    before_val = value;
                }
                if (!isUndefined(before_val)) {
                    func(e, before_val, i);
                }
            });
        } else {
            // 属于获取值
            if (isReturnGetFunc) {
                return getFunc(targets[0]);
            }
        }

        return targets;
    }

    // 两个参数的拆分固定式
    const pairIn = (targets, args, setCall, getCall) => {
        // 获取两个参数
        let [arg1, arg2] = args;

        // 获取第一个参数的类型
        let a1Type = getType(arg1);

        if (a1Type == "object") {
            // 对象类型，遍历代入
            for (let i in arg1) {
                each(targets, e => {
                    setCall(e, i, arg1[i]);
                });
            }
        } else if (isFunction(arg2)) {
            // 如果参数2是函数
            each(targets, (e, i) => {
                arg2.call(e, i, getCall(e, arg1));
            });
        } else if (isUndefined(arg2)) {
            // 不存在第二个参数，属于返回值
            return getCall(targets[0], arg1);
        } else {
            //普通类型，直接代入
            each(targets, e => {
                setCall(e, ...args);
            });
        }

        // 返回targets
        return targets;
    }

    // 修正数字类型变成像素字符串
    const fixNumber = value => (getType(value) == "number") ? (value + "px") : value;

    // main function
    // 查找元素
    const findElement = (selector, context = DOCUMENT) => makeArray(context.querySelectorAll(selector));

    // 转换元素
    const parseDom = (str) => {
        let par = DOCUMENT.createElement('div');
        par.innerHTML = str;
        let childs = makeArray(par.childNodes);
        return childs.filter(function (e) {
            let isInText = e instanceof Text;
            if (!isInText || (e.textContent && e.textContent.trim())) {
                return e;
            }
        });
    };

    // 判断元素是否符合条件
    const meetsEle = (ele, expr) => {
        if (ele === expr) {
            return !0;
        }
        let fadeParent = DOCUMENT.createElement('div');
        if (ele === DOCUMENT) {
            return false;
        }
        fadeParent.appendChild(ele.cloneNode(false));
        return 0 in findElement(expr, fadeParent) ? true : false;
    }

    // 获取元素的数据
    const getData = ele => ele[XQUEKEY] || (ele[XQUEKEY] = {});

    // 获取事件数据对象
    const getEventData = ele => ele[XQUEEVENTKEY] || (ele[XQUEEVENTKEY] = {});

    // main
    // 主体class
    // 只接受数组
    function XQue(elems = []) {
        merge(this, elems);
    }

    // 从属数组类型
    let xQuePrototype = Object.create(Array.prototype);

    // 合并方法
    assign(xQuePrototype, {
        // addClass(val) {
        //     return singleIn(this, val, (target, value) => {
        //         splitSpace(value, value => {
        //             target.classList.add(value);
        //         });
        //     }, target => target.classList.value);
        // },
        // removeClass(val) {
        //     return singleIn(this, val, (target, value) => {
        //         splitSpace(value, value => {
        //             target.classList.remove(value);
        //         });
        //     }, target => target.classList.value);
        // },
        // toggleClass(val) {
        //     return singleIn(this, val, (target, value) => {
        //         splitSpace(value, value => {
        //             target.classList.toggle(value);
        //         });
        //     }, target => target.classList.value);
        // },
        attr(...args) {
            return pairIn(this, args, (target, key, value) => {
                target.setAttribute(key, value);
            }, (target, key) => target.getAttribute(key));
        },
        removeAttr(val) {
            return singleIn(this, val, (target, value) => {
                splitSpace(value, value => {
                    target.removeAttribute(value);
                });
            });
        },
        prop(...args) {
            return pairIn(this, args, (target, key, value) => {
                target[key] = value;
            }, (target, key) => target[key]);
        },
        removeProp(val) {
            return singleIn(this, val, (target, value) => {
                splitSpace(value, value => {
                    delete target[value];
                });
            });
        },
        data(...args) {
            return pairIn(this, args, (target, key, value) => {
                getData(target)[key] = value;
            }, (target, key) => {
                let data = {};
                assign(data, target.dataset);
                assign(data, getData(target));
                return data[key];
            });
        },
        removeData(val) {
            return singleIn(this, val, (target, value) => {
                splitSpace(value, value => {
                    delete getData(target)[value];
                });
            });
        },
        css(...args) {
            return pairIn(this, args, (target, key, value) => {
                if (String(getStyle(target)[key]).indexOf('px') > -1) {
                    value = fixNumber(value);
                }
                target.style[key] = value;
            }, (target, key) => getStyle(target)[key]);
        },
        text(val) {
            return singleIn(this, val, (target, value) => {
                target.textContent = value;
            }, target => target.textContent, 1);
        },
        html(val) {
            return singleIn(this, val, (target, value) => {
                target.innerHTML = value;
            }, target => target.innerHTML, 1);
        },
        val(val) {
            // let r = singleIn(this, val, (target, value) => {
            //     target.value = value;
            // }, (target) => {
            //     return target.value
            // }, 1);
            // return r;
            return singleIn(this, val, (target, value) => {
                target.value = value;
            }, target => target.value, 1);
        },
        each(callback) {
            each(this, (e, i) => {
                callback.call(e, i, e);
            });
            return this;
        },
        index(ele) {
            let owner, tar;
            if (!ele) {
                tar = this[0];
                owner = makeArray(tar.parentNode.children);
            } else if (ele.nodeType) {
                tar = ele;
                owner = this;
            } else if (ele instanceof $) {
                tar = ele[0];
                owner = this;
            } else if (getType(ele) === STR_string) {
                tar = this[0];
                owner = $(ele);
            }
            return owner.indexOf(tar);
        },
        extend(obj) {
            assign(xQuePrototype, obj);
        }
    });

    // class操作
    let classControlObj = {
        addClass(target, value) {
            target.classList.add(value);
        },
        removeClass(target, value) {
            target.classList.remove(value);
        },
        toggleClass(target, value) {
            target.classList.toggle(value);
        }
    };

    for (let funcName in classControlObj) {
        // 获取函数
        let func = classControlObj[funcName];

        // 初始化操作
        xQuePrototype[funcName] = function (val) {
            return singleIn(this, val, (target, value) => {
                splitSpace(value, value => {
                    func(target, value);
                });
            }, target => target.classList.value);
        };
    }

    const eachContext = (context, callback) => {
        if (isArrayLike(context)) {
            each(makeArray(context), ele => {
                callback(ele);
            });
        } else {
            callback(context);
        }
    }

    // 外部方法
    let $ = function (selector, context) {
        // 获取type
        let type = getType(selector);

        // 元素
        let elems = [];

        // 针对不同类型做处理
        switch (type) {
            case STR_string:
                if (selector.search('<') > -1) {
                    elems = parseDom(selector);
                } else {
                    eachContext(context, ele => {
                        let eles = findElement(selector, ele);
                        merge(elems, eles);
                    });
                }
                break;
            case STR_array:
                elems = selector;
                break;
            default:
                if (selector instanceof Element) {
                    elems = [selector];
                } else if (isArrayLike(selector)) {
                    // 类数组
                    elems = makeArray(selector);
                } else if (isFunction(selector)) {
                    // 属于函数
                    if (DOCUMENT.readyState === "complete") {
                        selector($)
                    } else {
                        DOCUMENT.addEventListener('DOMContentLoaded', function () {
                            selector($)
                        }, false);
                    }
                    elems = [DOCUMENT];
                } else if (selector) {
                    if (context && isElement(selector)) {
                        eachContext(context, ele => {
                            let selectorTagName = selector.tagName.toLowerCase();
                            let findEles = findElement(selectorTagName, ele);
                            each(findEles, e => {
                                (selector === e) && (elems.push(e));
                            });
                        });
                    } else {
                        // 其他类型
                        elems = [selector];
                    }
                }
        }

        return new XQue(elems);
    }

    // 修正为元素
    const fixToEle = (tars, val, func) => {
        // 获取需要添加目标元素的长度
        let tarLen = tars.length;

        return singleIn(tars, val, (target, value) => {
            // 获取 value 类型
            let valueType = getType(value);

            // 减去长度计量器
            tarLen--;

            // 最后要添加进去的类型
            let eles = value;

            // 根据不同数据类型进行转换
            if (valueType === STR_string) {
                // 转换字符串类型
                eles = parseDom(value);
            } else if (isElement(value)) {
                // 判断是否元素，是的话进行克隆
                eles = [value];
            }

            // 修正元素数组
            if (tarLen > 0) {
                eles = [].map.call(eles, e => e.cloneNode(true));
            }

            // 全部添加进去
            each(eles, ele => {
                func(target, ele);
            });
        }, target => target.innerHTML);
    }

    // 映射$实例数据
    const mapClone = (cloneEle, ele) => {
        // 自定义数据
        cloneEle[XQUEKEY] = assign({}, getData(ele));

        // 自定义事件
        let eveData = getEventData(ele);
        let cloneEveData = getEventData(cloneEle);

        for (let eventName in eveData) {
            let eves = eveData[eventName];
            let cloneEves = cloneEveData[eventName] = [];

            each(eves, eData => {
                let cloneEData = assign({}, eData);
                cloneEves.push(cloneEData);
                cloneEle.addEventListener(eventName, cloneEData.handle);
            });
        }
    }

    // 映射子元素
    const mapCloneToChilds = (cloneEle, ele) => {
        let cloneChilds = Array.from(cloneEle.children);
        let childs = ele.children;

        each(cloneChilds, (cloneEle, i) => {
            let ele = childs[i];
            mapClone(cloneEle, ele);

            // 递归
            mapCloneToChilds(cloneEle, ele);
        });

    }

    // 节点操控方法
    Object.assign(xQuePrototype, {
        append(val) {
            return fixToEle(this, val, (target, ele) => {
                target.appendChild(ele);
            });
        },
        prepend(val) {
            return fixToEle(this, val, (target, ele) => {
                target.insertBefore(ele, target.firstChild);
            });
        },
        before(val) {
            return fixToEle(this, val, (target, ele) => {
                target.parentNode.insertBefore(ele, target);
            });
        },
        after(val) {
            return fixToEle(this, val, (target, ele) => {
                var parnode = target.parentNode;
                if (parnode.lastChild === target) {
                    parnode.appendChild(ele);
                } else {
                    parnode.insertBefore(ele, target.nextSibling);
                }
            });
        },
        wrap(val) {
            return fixToEle(this, val, (target, ele) => {
                target.parentNode.insertBefore(ele, target);
                ele.appendChild(target);
            });
        },
        unwrap() {
            var arr = [];
            each(this, function (e) {
                var par = e.parentNode;
                par.parentNode.insertBefore(e, par);
                if (arr.indexOf(par) === -1) {
                    arr.push(par);
                }
            });
            $(arr).remove();
            return this;
        },
        wrapInner(val) {
            return fixToEle(this, val, (target, ele) => {
                each(makeArray(target.childNodes), function (e2) {
                    ele.appendChild(e2);
                });
                target.appendChild(ele);
            });
        },
        wrapAll(val) {
            if (isString(val)) {
                val = parseDom(val);
            }
            let tar = this.eq(0);
            tar.before(val = $(val));
            each(this, e => val.append(e));
            return this;
        },
        replaceWith(val) {
            return this.before(val).remove();
        },
        empty() {
            each(this, e => {
                e.innerHTML = "";
            });
        },
        remove(expr) {
            each(this, e => {
                if (expr) {
                    if (!meetsEle(e, expr)) return;
                }
                e.parentNode.removeChild(e);
            });
        },
        clone(withData, deepData) {
            return this.map((i, ele) => {
                let cloneEle = ele.cloneNode(TRUE);

                // 深复制当前元素
                if (withData) {
                    mapClone(cloneEle, ele);
                }

                // 深复制子元素
                if (deepData) {
                    mapCloneToChilds(cloneEle, ele);
                }
                return cloneEle;
            });
        }
    });

    let dom_in_turn_Obj = {
        append: "appendTo",
        prepend: "prependTo",
        after: "insertAfter",
        before: "insertBefore",
        replaceWith: "replaceAll"
    };

    for (let k in dom_in_turn_Obj) {
        // 获取要定义的函数名
        let funcName = dom_in_turn_Obj[k];

        // 参数调转
        xQuePrototype[funcName] = function (content) {
            $(content)[k](this);
        }
    }

    // 盒模型相关方法
    // width height innerWidth innerHeight outerWidth outerHeight
    // 获取样式像素值
    const getStylePx = (target, styleName) => parseFloat(getStyle(target)[styleName]);

    each([{
        'Width': ['left', 'right']
    }, {
        'Height': ['top', 'bottom']
    }], obj => {
        for (let fName in obj) {
            // 小写名
            let lowCaseFName = fName.toLowerCase();

            // 设置小写值方法
            xQuePrototype[lowCaseFName] = function (value) {
                return singleIn(this, value, (target, value) => {
                    value = fixNumber(value);
                    target.style[lowCaseFName] = value;
                }, target => getStylePx(target, lowCaseFName), 1);
            }

            // 获取目标关键词
            let keyArr = obj[fName];

            // 带关卡性的获取值
            // 原始值必带，首个参数是target，往后顺序是是否需要 padding border margin
            let getFunc = (target, hasPadding, hasBorder, hasMargin) => {
                // 原始值
                let oriVal = getStylePx(target, lowCaseFName);

                each(keyArr, k => {
                    // padding
                    hasPadding && (oriVal += getStylePx(target, 'padding-' + k));

                    // border
                    hasBorder && (oriVal += getStylePx(target, 'border-' + k + "-width"));

                    // margin
                    hasMargin && (oriVal += getStylePx(target, 'margin-' + k));
                });

                return oriVal;
            }

            // 获取inner值方法
            let innerFunc = xQuePrototype['inner' + fName] = function () {
                return getFunc(this[0], 1);
            }

            xQuePrototype['outer' + fName] = function (bool) {
                return getFunc(this[0], 1, 1, bool);
            }
        }
    });

    Object.assign(xQuePrototype, {
        // 已取消使用offset设定定位的方法，请用好的css布局来调整定位
        offset() {
            // 获取目标
            let tar = this[0];
            let top = 0,
                left = 0;
            do {
                top += tar.offsetTop;
                left += tar.offsetLeft;
                tar = tar.offsetParent;
            } while (tar)

            return {
                top,
                left
            };
        },
        position() {
            let tar = this[0];
            return {
                top: tar.offsetTop,
                left: tar.offsetLeft
            };
        },
        scrollTop(val) {
            return singleIn(this, val, (target, value) => {
                target.scrollTop = value;
            }, target => target.scrollTop, 1);
        },
        scrollLeft(val) {
            return singleIn(this, val, (target, value) => {
                target.scrollLeft = value;
            }, target => target.scrollLeft, 1);
        }
    });

    const filterBase = (tars, val, meetcall, notmeetcall) => {
        let arr = [];
        if (isString(val)) {
            each(tars, ele => {
                if (meetsEle(ele, val)) {
                    meetcall && meetcall(arr, ele);
                } else {
                    notmeetcall && notmeetcall(arr, ele);
                }
            });
        } else if (isArrayLike(val)) {
            each(tars, ele => {
                each(val, val => {
                    if (ele === val) {
                        meetcall && meetcall(arr, ele);
                    } else {
                        notmeetcall && notmeetcall(arr, ele);
                    }
                });
            });
        } else if (isElement(val)) {
            each(tars, ele => {
                if (val === ele) {
                    meetcall && meetcall(arr, ele);
                } else {
                    notmeetcall && notmeetcall(arr, ele);
                }
            });
        } else if (isFunction(val)) {
            each(tars, (ele, i) => {
                if (val.call(ele, i, ele)) {
                    meetcall && meetcall(arr, ele);
                } else {
                    notmeetcall && notmeetcall(arr, ele);
                }
            });
        }
        return $(arr);
    }

    const propKey = (expr, key, tars) => {
        let arr = [];
        each(tars, tar => {
            tar = tar[key];
            if (!tar || arr.indexOf(tar) != -1 || (expr && !meetsEle(tar, expr))) {
                return;
            }
            arr.push(tar);
        });
        return $(arr);
    }

    const nuExpr = (tars, key, filter, lastExpr) => {
        let arr = [];
        let getEle = tar => {
            let nextEle = tar[key];
            if (nextEle) {
                if (lastExpr) {
                    if ((getType(lastExpr) === STR_string && meetsEle(nextEle, lastExpr)) || lastExpr === nextEle || (lastExpr instanceof Array && lastExpr.indexOf(nextEle) > -1)) {
                        return;
                    }
                }
                if ((!filter || meetsEle(nextEle, filter)) && arr.indexOf(nextEle) === -1) {
                    arr.push(nextEle);
                }
                getEle(nextEle);
            }
        };
        each(tars, tar => {
            getEle(tar);
        });
        getEle = null;
        return $(arr);
    };

    assign(xQuePrototype, {
        slice(...args) {
            let newArr = [].slice.call(this, ...args);
            return $(newArr);
        },
        eq(index) {
            return this.slice(index, index + 1 || undefined);
        },
        first() {
            return this.eq(0);
        },
        last() {
            return this.eq(-1);
        },
        get(index) {
            if (isUndefined(index)) {
                return makeArray(this);
            } else {
                return this[index];
            }
        },
        hasClass(val) {
            // 默认没有
            let hasClass = !1;
            each(this, e => {
                e.classList.contains(val) && (hasClass = !0);
            });
            return hasClass;
        },
        // 筛选器
        filter(val) {
            return filterBase(this, val, (arr, ele) => arr.push(ele));
        },
        // 否定版的筛选器
        not(val) {
            return filterBase(this, val, 0, (arr, ele) => arr.push(ele));
        },
        // 是否存在表达式内的元素
        is(val) {
            return 0 in this.filter(val);
        },
        map(callback) {
            let arr = [];
            each(this, (e, i) => {
                arr.push(callback(i, e));
            });
            return $(arr);
        },
        find(expr) {
            return $(expr, this);
        },
        has(expr) {
            let arr = [];
            each(this, e => {
                (0 in $(expr, e)) && (arr.push(e));
            });
            return $(arr);
        },
        children(expr) {
            let eles = [];
            each(this, e => {
                e.nodeType && each(makeArray(e.children), e => {
                    if (expr) {
                        meetsEle(e, expr) && eles.push(e);
                    } else {
                        eles.push(e);
                    }
                });
            });
            return $(eles);
        },
        next(expr) {
            return propKey(expr, "nextElementSibling", this);
        },
        prev(expr) {
            return propKey(expr, "previousElementSibling", this);
        },
        parent(expr) {
            return propKey(expr, "parentNode", this);
        },
        nextAll(filter) {
            return nuExpr(this, 'nextElementSibling', filter);
        },
        prevAll(filter) {
            return nuExpr(this, 'previousElementSibling', filter);
        },
        parents(filter) {
            return nuExpr(this, 'parentNode', filter, DOCUMENT);
        },
        nextUntil(lastExpr, filter) {
            return nuExpr(this, 'nextElementSibling', filter, lastExpr);
        },
        prevUntil(lastExpr, filter) {
            return nuExpr(this, 'previousElementSibling', filter, lastExpr);
        },
        parentsUntil(lastExpr, filter) {
            return nuExpr(this, 'parentNode', filter, lastExpr);
        },
        closest(selector) {
            var parentEles = $(selector).parent();
            return this.parentsUntil(parentEles, selector);
        },
        siblings(expr) {
            let _this = this;
            return this.parent().children(expr).filter(function () {
                if (_this.indexOf(this) === -1) return true;
            });
        },
        offsetParent() {
            let arr = [];
            each(this, e => {
                arr.push(e.offsetParent || DOCUMENT.body);
            });
            return $(arr);
        }
    });

    // jQuery 专用 Event原型对象
    let eventPrototype = {
        preventDefault() {
            this._pD();
        },
        isDefaultPrevented() {
            return this.defaultPrevented;
        },
        stopPropagation() {
            this._sP();
        },
        isPropagationStopped() {
            return this.cancelBubble;
        },
        stopImmediatePropagation() {
            this.isImmediatePropagationStopped = () => TRUE;
            this._sIP();
        },
        isImmediatePropagationStopped: () => FALSE
    };

    // 初始化Event成jQuery.Event那样
    const initEvent = event => {
        if (!event._pD) {
            Object.defineProperties(event, {
                _pD: {
                    value: event.preventDefault
                },
                _sP: {
                    value: event.stopPropagation
                },
                _sIP: {
                    value: event.stopImmediatePropagation
                }
            });
            Object.assign(event, eventPrototype);
        }
        return event;
    }

    let MOUSEEVENT = MouseEvent;
    let TOUCHEVENT = TouchEvent;
    // 修正 Event class 用的数据表
    let eventsMap = {
        click: MOUSEEVENT,
        mousedown: MOUSEEVENT,
        mouseup: MOUSEEVENT,
        mousemove: MOUSEEVENT,
        mouseenter: MOUSEEVENT,
        mouseleave: MOUSEEVENT,
        touchstart: TOUCHEVENT,
        touchend: TOUCHEVENT,
        touchmove: TOUCHEVENT
    };

    // 优先执行原生方法的方法名
    let realEvents = ['focus', 'blur'];

    // 生成Event
    let createEvent = $.Event = (type, eventInit) => {
        let TarEvent = eventsMap[type] || Event;
        return initEvent(new TarEvent(type, eventInit));
    };

    // 获取事件数据
    const getEventTypeData = (ele, type) => {
        let data = getEventData(ele);
        return data[type] || (data[type] = []);
    };

    // 触发事件
    const trigger = (eles, type, data, isHandle) => {
        each(eles, ele => {
            if (isElement(ele)) {
                // 优先型的主动触发事件判断
                // 没有数据绑定
                if (!isHandle && !data && realEvents.indexOf(type) > -1 && isFunction(ele[type])) {
                    ele[type]();
                    return;
                }

                let event;
                if (type instanceof Event) {
                    event = type;
                } else {
                    // 获取事件对象
                    if (!isHandle) {
                        event = createEvent(type, {
                            bubbles: TRUE,
                            cancelable: TRUE
                        });
                    } else {
                        event = new Event(type, {
                            bubbles: FALSE,
                            cancelable: TRUE
                        });
                    }
                }

                data && defineProperty(event, '_argData', {
                    value: data
                });

                // 触发事件
                ele.dispatchEvent(event);
            } else {
                // 自定义数据
                // 获取事件对象
                let eveArr = getEventTypeData(ele, type);

                // 新的事件数组
                let newArr = [];

                let isBreak = 0;
                // 遍历事件数组
                each(eveArr, fData => {
                    // 不是一次性的就加入
                    if (!fData.isOne) {
                        newArr.push(fData);
                    }

                    // 是否弹出
                    if (isBreak) {
                        return;
                    }

                    // 生成 event对象
                    let event = createEvent(type);

                    // 参数修正
                    let args = [event];
                    if (data) {
                        args.push(data);
                    }

                    // 判断是否有on上的data
                    let onData = fData.data;
                    if (!isUndefined(onData)) {
                        event.data = onData;
                    }

                    // 触发callback
                    fData.fn(...args);

                    // 删除数据
                    delete event.data;

                    // 判断是否不用进行下去了
                    if (event.isImmediatePropagationStopped()) {
                        isBreak = 1;
                    }
                });

                // 重新设置事件对象数据
                let eventBase = getEventData(ele);
                eventBase[type] = newArr;
            }
        });
        return eles;
    };

    // 事件注册
    const on = (eles, events, selector, data, fn, isOne) => {
        // 事件字符串拆分
        events = events.split(' ');

        // 修正变量
        if (isFunction(selector)) {
            fn = selector;
            selector = data = UNDEFINED;
        } else {
            // 判断selector是data还是selector
            if (isString(selector)) {
                // 是selector
                // 判断data是 fn 还是 data
                if (isFunction(data)) {
                    fn = data;
                    data = UNDEFINED;
                }
            } else {
                fn = data;
                data = selector;
                selector = UNDEFINED;
            }
        }

        // 没有注册函数就别瞎搅和了
        if (!fn) {
            console.error('no function =>', fn);
            return;
        }

        each(eles, ele => {
            each(events, eventName => {
                // 事件函数寄存对象
                let funcData = {
                    fn,
                    isOne,
                    data,
                    selector
                };

                // 属于事件元素
                if (isElement(ele)) {
                    let eventHandle = function (e) {
                        // 初始化事件对象
                        initEvent(e);

                        // 自定义函数数据
                        !isUndefined(data) && (e.data = data);

                        // 原始数据
                        e.originalEvent = e;

                        let argData = e._argData;
                        if (argData && !isArrayLike(argData)) {
                            argData = [argData];
                        }

                        // 目标
                        let tar = this;

                        // 是否可以运行
                        let canRun = 1;

                        if (selector) {
                            let currentTarget = $(e.target).parents(selector);
                            if (0 in currentTarget) {
                                tar = currentTarget[0];
                            } else if (meetsEle(e.target, selector)) {
                                tar = e.target;
                            } else {
                                canRun = 0;
                            }
                        }

                        if (canRun) {
                            // 执行事件函数
                            if (argData) {
                                fn.call(tar, e, ...argData);
                            } else {
                                fn.call(tar, e);
                            }
                        }

                        // 删除事件实例上的自定义数据
                        delete e.data;
                        delete e.originalEvent;

                        // 判断是否一次性事件
                        if (isOne) {
                            ele.removeEventListener(eventName, eventHandle);
                        }
                    }

                    // 寄存eventHandle
                    funcData.handle = eventHandle;

                    ele.addEventListener(eventName, eventHandle);
                }

                // 获取事件数组对象
                let eventArr = getEventTypeData(ele, eventName);

                // 添加入事件数组
                eventArr.push(funcData);
            });
        });

        return eles;
    }

    const off = (eles, events, selector, fn) => {
        if (events) {
            // 事件字符串拆分
            events = events.split(' ');

            // 判断 是不是selector
            if (!fn && isFunction(selector)) {
                fn = selector;
                selector = UNDEFINED;
            }
        }

        each(eles, ele => {
            // eventBase
            let eventBase = getEventData(ele);

            if (!events) {
                if (isElement(ele)) {
                    for (let eventName in eventBase) {
                        let eveArr = eventBase[eventName];
                        each(eveArr, tar => {
                            ele.removeEventListener(eventName, tar.handle);
                        });
                    }
                }
                // 注销全部事件
                ele[XQUEEVENTKEY] = {};
                return;
            }

            each(events, eventName => {
                let eveArr = getEventTypeData(ele, eventName);

                if (isElement(ele)) {
                    if (fn) {
                        let tar = eveArr.find(function (e) {
                            return e.fn === fn && e.selector === selector;
                        });

                        if (tar) {
                            // 注销事件并移除函数
                            ele.removeEventListener(eventName, tar.handle);
                            removeByArr(eveArr, tar);
                        }
                    } else {
                        // 注销所有事件
                        each(eveArr, tar => {
                            ele.removeEventListener(eventName, tar.handle);
                        });
                        // 清空数组
                        eventBase[eventName] = [];
                    }
                } else {
                    if (fn) {
                        // 移除函数
                        removeByArr(eveArr, fn);
                    } else {
                        // 清空数组
                        eventBase[eventName] = [];
                    }
                }
            });
        });

        return eles;
    }

    Object.assign(xQuePrototype, {
        // 注册事件
        on(events, selector, data, fn) {
            // 事件注册
            return on(this, events, selector, data, fn);
        },
        one(events, data, fn) {
            // 事件注册
            return on(this, events, UNDEFINED, data, fn, 1);
        },
        off(events, selector, fn) {
            return off(this, events, selector, fn);
        },
        trigger(type, data) {
            return trigger(this, type, data);
        },
        triggerHandler(type, data) {
            return trigger(this, type, data, 1);
        },
        bind(types, data, fn) {
            return this.on(types, data, fn);
        },
        unbind(types, fn) {
            return this.off(types, fn);
        },
        hover(fnOver, fnOut) {
            return this.on('mouseenter', fnOver).on('mouseleave', fnOut || fnOver);
        }
    });

    // 一众事件
    each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "), function (eventName) {
        xQuePrototype[eventName] = function (callback) {
            callback ? this.on(eventName, callback) : this.trigger(eventName);
            return this;
        }
    });

    // 使用xhr和promise实现的ajax，和jQuery的ajax不一样，它是返回promise实例，但比fetch api多了pending状态监听
    let ajaxDefaults = {
        url: "",
        type: "GET",
        data: "",
        crossDomain: FALSE,
        dataType: "",
        headers: {},
        timeout: 100000,
        username: null,
        password: null,
        contentType: "json"
    };

    const ajax = (options) => {
        let defaults = assign({}, ajaxDefaults);
        assign(defaults, options);

        // 转大写
        defaults.type = defaults.type.toUpperCase();

        let {
            url,
            contentType,
            data
        } = defaults;

        // 修正form数据类型
        if (data instanceof FormData) {
            contentType = "form";
        } else if (contentType.indexOf('form') > -1) {
            // 转换 object to Formdata
            let fdata = new FormData();
            for (let name in data) {
                fdata.append(name, data[name]);
            }
            data = fdata;
        }

        switch (defaults.type) {
            case "GET":
                // get是没有的
                contentType = "";
                // 转换数据
                let dataUrlencode = objectToUrlencode(data);
                url += (url.indexOf("?") > -1 ? url += "&" : "?") + dataUrlencode;
                data = null;
                break;
            case "POST":
                let charsetutf8 = '; charset=UTF-8';
                // 修正contentType
                // application/json; multipart/form-data; application/x-www-form-urlencoded; text/xml;
                if (contentType.indexOf('json') > -1) {
                    contentType = "application/json" + charsetutf8;
                    data = JSON.stringify(data);
                } else if (contentType.indexOf('urlencoded') > -1) {
                    contentType = "application/x-www-form-urlencoded" + charsetutf8;
                    data = objectToUrlencode(data);
                } else if (contentType.indexOf('form') > -1) {
                    contentType = "multipart/form-data" + charsetutf8;
                } else if (contentType.indexOf('xml') > -1) {
                    contentType = "text/xml" + charsetutf8;
                }
                break;
        }

        // 事件寄存对象
        let eveObj = $({});

        // 实例
        var oReq = new XMLHttpRequest();
        // 要返回回去的promise
        let reP = new Promise((res, rej) => {
            // 设置请求
            oReq.open(defaults.type, url, TRUE, defaults.username, defaults.password);

            // 设置 header
            let {
                headers
            } = defaults;
            for (let k in headers) {
                oReq.setRequestHeader(k, headers[k]);
            }

            // 设置contentType
            contentType && oReq.setRequestHeader("Content-Type", contentType);

            // 设置返回数据类型
            oReq.responseType = defaults.dataType;

            // 跨域是否带上cookie
            oReq.withCredentials = defaults.crossDomain;

            // 超时时间设定
            oReq.timeout = defaults.timeout;

            // 设置callback
            oReq.addEventListener('load', e => {
                let {
                    target
                } = e;

                let {
                    response
                } = e.target;

                // 修正返回数据类型
                let responseContentType = target.getResponseHeader('content-type');
                if (responseContentType && responseContentType.indexOf("application/json") > -1 && typeof response != "object") {
                    response = JSON.parse(response);
                }
                res(response);
            }, FALSE);
            oReq.addEventListener('error', e => {
                rej();
            }, FALSE);
            oReq.addEventListener("progress", e => {
                eveObj.trigger('loading', e);
            }, FALSE);
            oReq.upload && oReq.upload.addEventListener("progress", e => {
                eveObj.trigger('uploading', e);
            }, FALSE);
        });

        assign(reP, {
            // 加载中
            loading(func) {
                eveObj.on('loading', (e, data) => func(data));
                return reP;
            },
            // 上传中
            uploading(func) {
                eveObj.on('uploading', (e, data) => func(data));
                return reP;
            },
            // 发送前
            beforeSend(func) {
                // 直接进去函数
                func(oReq);
                return reP;
            }
        });

        // 异步发送请求
        setTimeout(() => {
            data ? oReq.send(data) : oReq.send();
        }, 0);

        // 返回参数
        reP.options = defaults;

        return reP;
    }

    // 转换成urlencode
    const objectToUrlencode = (obj, headerStr = "", isParam) => {
        let str = "";
        for (let k in obj) {
            let val = obj[k];
            if (typeof val === "object") {
                if (headerStr) {
                    str += objectToUrlencode(val, `${headerStr}[${k}]`, isParam);
                } else {
                    str += objectToUrlencode(val, k, isParam);
                }
            } else {
                if (headerStr) {
                    if (obj instanceof Array) {
                        k = "";
                    }
                    k = headerStr + `[${k}]`;
                }
                if (!isParam) {
                    k = encodeURIComponent(k);
                    val = encodeURIComponent(val);
                }
                str += `${k}=${val}&`;
            }
        }

        if (!headerStr) {
            // 去掉最后的 &
            str = str.replace(/&$/g, "");
        }
        return str;
    }

    const ajaxSetup = (options) => {
        assign(ajaxDefaults, options);
    }

    assign($, {
        ajax,
        ajaxSetup,
        param(obj) {
            return objectToUrlencode(obj, "", 1)
        }
    });

    each(['get', 'post'], name => {
        $[name] = (url, data, dataType) => {
            let options = {
                url,
                type: name.toUpperCase(),
                data
            }
            dataType && (options.dataType = dataType);
            return ajax(options);
        }
    });

    assign(xQuePrototype, {
        show() {
            each(this, ele => {
                ele.style.display = "";
            });
            return this;
        },
        hide() {
            each(this, ele => {
                ele.style.display = "none";
            });
            return this;
        }
    });

    // 修正原型链
    $.prototype = $.fn = XQue.prototype = xQuePrototype;

    assign($, {
        extend(...args) {
            if (args.length === 1) {
                let obj = args[0];
                if (getType(obj) == "object") {
                    assign($, obj);
                }
            } else {
                return assign(...args);
            }
        },
        merge,
        type: getType
    });

    // 暴露到外部
    glo.Xque = glo.$ = $;
})(window);
((glo) => {
    "use strict";

    // start
    // 获取旧的主体
    let _$ = glo.$;

    // 原来的原型链
    let $fn = _$.fn;

    // 基础tag记录器
    let tagDatabase = {};

    // debugger
    glo.tagDatabase = tagDatabase;

    const {
        assign,
        create,
        defineProperty,
        defineProperties
    } = Object;

    // function
    let isUndefined = val => val === undefined;
    let isRealValue = val => val !== undefined && val !== null;
    const hasAttr = (e, attrName) => {
        if (!e.getAttribute) {
            return !!0;
        }
        let attr = e.getAttribute(attrName);
        if (attr !== null && attr !== undefined) {
            return !!1;
        }
    };

    // 获取类型
    let objectToString = Object.prototype.toString;
    const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');

    const each = (arr, func) => Array.from(arr).forEach(func);

    // 获取随机id
    const getRandomId = () => Math.random().toString(32).substr(2);

    //改良异步方法
    const nextTick = (() => {
        let isTick = false;
        let nextTickArr = [];
        return (fun) => {
            if (!isTick) {
                isTick = true;
                setTimeout(() => {
                    for (let i = 0; i < nextTickArr.length; i++) {
                        nextTickArr[i]();
                    }
                    nextTickArr = [];
                    isTick = false;
                }, 0);
            }
            nextTickArr.push(fun);
        };
    })();

    // COMMON
    // 随机字符串
    const RANDOMID = "_" + getRandomId();
    const SWATCH = RANDOMID + "_watchs";
    const SWATCHGET = SWATCH + "_get";
    const OBSERVERKEYS = RANDOMID + "_observer";
    const XHEAROBJKEY = getRandomId() + "_xhearobj";
    const ATTACHED_KEY = getRandomId() + "_attached";
    const SHADOW_DESCRIPT_CANNOTUSE = 'shadow element can\'t use ';
    // const XDATA_DATAOBJ = getRandomId() + "xdatas";


    // business fucntion 
    const getTagData = (ele) => {
        let tagname = ele.tagName.toLowerCase();
        return tagDatabase[tagname];
    }

    // 生成专用shear对象
    const createShearObject = (ele) => {
        let xvData = ele[XHEAROBJKEY];
        let e = create(xvData);
        e.push(ele);
        return e;
    }

    // 生成普通继承的$实例
    const inCreate$ = arr => {
        let reObj = create(shearInitPrototype);
        reObj.splice(-1, 0, ...arr);
        if (arr.prevObject) {
            reObj.prevObject = arr.prevObject;
        }
        return reObj;
    }

    // 通用实例生成方法
    const createShear$ = arr => {
        if (arr.length == 1 && arr[0][XHEAROBJKEY]) {
            return createShearObject(arr[0]);
        }
        return inCreate$(arr);
    }

    // 渲染所有的sv-ele元素
    const renderAllSvEle = (jqObj) => {
        // 自己是不是sv-ele
        if (jqObj.is('[xv-ele]')) {
            jqObj.each((i, e) => {
                renderEle(e);
            });
        }

        // 查找有没有 sv-ele
        _$('[xv-ele]', Array.from(jqObj)).each((i, e) => {
            renderEle(e);
        });
    }

    // 新jq实例原型对象
    let shearInitPrototype = create($fn);

    // 元素自定义组件id
    let rid = 100;

    const renderEle = (ele) => {
        if (!hasAttr(ele, 'xv-ele')) {
            return;
        }

        // 从库中获取注册数据
        let regData = getTagData(ele);

        // 判断是否存在注册数据
        if (!regData) {
            console.warn('no exist tag', ele);
            return;
        }
        let $ele = _$(ele);

        // 获取子元素
        let childs = Array.from(ele.childNodes);

        // 填充代码
        ele.innerHTML = regData.temp;

        // 生成renderId
        let renderId = ++rid;

        // 初始化对象
        let xhearOriObj = new regData.XHear();
        xhearOriObj._canEmitWatch = 1;
        // xhearOriObj._exkeys = [];
        let xhearObj = new Proxy(xhearOriObj, XObjectHandler);
        ele[XHEAROBJKEY] = xhearObj;

        let xhearEle = createShearObject(ele);

        // 设置渲染id
        $ele.removeAttr('xv-ele').attr('xv-render', renderId);
        $ele.find(`*`).attr('xv-shadow', renderId);

        // 渲染依赖sx-ele
        _$(`[xv-ele][xv-shadow="${renderId}"]`, ele).each((i, e) => {
            renderEle(e);
        });

        // 转换 xv-span 元素
        _$(`xv-span[xv-shadow="${renderId}"]`, ele).each((i, e) => {
            // 替换xv-span
            var textnode = document.createTextNode("");
            e.parentNode.insertBefore(textnode, e);
            e.parentNode.removeChild(e);

            // 文本数据绑定
            var svkey = e.getAttribute('svkey');

            xhearObj.watch(svkey, d => {
                textnode.textContent = d;
            });
        });

        // 放回内容
        let xvContentEle = _$(`[xv-content][xv-shadow="${renderId}"]`, ele);
        if (0 in xvContentEle) {
            // 定义$content属性
            defineProperty(xhearObj, '$content', {
                enumerable: true,
                get() {
                    return createShear$(xvContentEle);
                }
            });

            // 添加svParent
            xvContentEle.prop('svParent', ele);

            // 添加子元素
            xvContentEle.append(childs);

            // 判断是否监听子节点变动
            if (regData.childChange) {
                let observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        let {
                            addedNodes,
                            removedNodes
                        } = mutation;
                        let obsEvent = {};
                        (0 in addedNodes) && (obsEvent.addedNodes = Array.from(addedNodes));
                        (0 in removedNodes) && (obsEvent.removedNodes = Array.from(removedNodes));
                        regData.childChange(createShearObject(ele), obsEvent);
                    });
                });

                // 监听节点
                observer.observe(xvContentEle[0], {
                    attributes: false,
                    childList: true,
                    characterData: false,
                    subtree: false,
                });

                // 设置监听属性
                xhearObj.__obs = observer;
            }
        }

        // 写入其他定义节点
        _$(`[xv-tar][xv-shadow="${renderId}"]`, ele).each((i, e) => {
            let eName = _$(e).attr('xv-tar');
            defineProperty(xhearObj, '$' + eName, {
                enumerable: true,
                get() {
                    return createShear$([e]);
                }
            });
        });

        // 等下需要设置的data
        let rData = assign({}, regData.data);

        // attrs 上的数据
        regData.attrs.forEach(kName => {
            // 获取属性值并设置
            let attrVal = $ele.attr(kName);
            if (isRealValue(attrVal)) {
                rData[kName] = attrVal;
            }

            // 绑定值
            xhearObj.watch(kName, d => {
                // 绑定值
                $ele.attr(kName, d);
            });
        });

        // props 上的数据
        regData.props.forEach(kName => {
            let attrVal = $ele.attr(kName);
            isRealValue(attrVal) && (rData[kName] = attrVal);
        });


        // 绑定xv-module
        _$(`[xv-module][xv-shadow="${renderId}"]`, ele).each((i, tar) => {
            let $tar = _$(tar);
            let kName = $tar.attr('xv-module');

            // 绑定值
            xhearObj.watch(kName, val => {
                tar.value = val;
            });

            // 监听改动
            if (tar[XHEAROBJKEY]) {
                tar[XHEAROBJKEY].watch("value", val => {
                    // kName;
                    // tar;
                    xhearObj[kName] = val;
                });
            } else {
                $tar.on('change input', (e) => {
                    xhearObj[kName] = tar.value;
                });
            }
        });

        // 设置渲染完成
        $ele.removeAttr('xv-ele').attr('xv-render', renderId);

        // 补充rData
        let watchData = regData.watch;
        if (watchData) {
            for (let k in watchData) {
                if (!(k in rData)) {
                    rData[k] = undefined;
                }
            }
        }

        // 设置keys
        xhearOriObj._exkeys = Object.keys(rData);

        // watch监听
        if (watchData) {
            for (let k in watchData) {
                let tar = watchData[k];

                // 两个callback
                let getCallback, setCallback;

                switch (getType(tar)) {
                    case "function":
                        setCallback = tar;
                        break;
                    case "object":
                        getCallback = tar.get;
                        setCallback = tar.set;
                        break;
                }

                getCallback && watchGetter(xhearObj, k, getCallback.bind(xhearEle));
                setCallback && xhearObj.watch(k, setCallback.bind(xhearEle));
            }
        }

        // 存在 value key
        if ('value' in rData) {
            defineProperty(ele, 'value', {
                get() {
                    return xhearObj.value;
                },
                set(d) {
                    xhearObj.value = d;
                }
            });
        }

        // 先铺设数据
        // xhearObj.set();
        // each(Object.keys(rData), k => {
        //     xhearObj[k] = undefined;
        // });

        // 设置数据
        for (let k in rData) {
            isRealValue(rData[k]) && (xhearObj[k] = rData[k]);
        }

        // 触发callback
        regData.inited && regData.inited.call(ele, xhearEle);

        // attached callback
        if (regData.attached && ele.getRootNode() === document && !ele[ATTACHED_KEY]) {
            regData.attached.call(ele, xhearEle);
            ele[ATTACHED_KEY] = 1;
        }
    }

    // 还原给外部的$
    let $ = function (...args) {
        let reObj = _$(...args);
        let [arg1, arg2] = args;

        // 优化操作，不用每次都查找节点
        // 判断传进来的参数是不是字符串
        if ((getType(arg1) == "string" && arg1.search('<') > -1) || arg1 instanceof Element) {
            renderAllSvEle(reObj);
        }

        // 去除 shadow 元素
        let arg2_svShadow;
        if (arg2) {
            if (arg2.getAttribute) {
                arg2_svShadow = arg2.getAttribute('xv-shadow');
            } else if (arg2.attr) {
                arg2_svShadow = arg2.attr('xv-shadow');
            }
        }
        if (arg2_svShadow) {
            reObj = filterShadow(reObj, arg2_svShadow);
        } else {
            reObj = filterShadow(reObj);
        }

        // 生成实例
        reObj = createShear$(reObj);

        return reObj;
    };
    $.prototype = $fn;
    assign($, {
        init: (...args) => createShear$(args)
    }, _$);

    let isXData = (obj) => (obj instanceof XObject) || (obj instanceof XArray);

    // 将xdata转换成字符串
    let XDataToObject = (xdata) => {
        let reObj = xdata;
        if (xdata instanceof Array) {
            reObj = [];
            xdata.forEach(e => {
                if (isXData(e)) {
                    reObj.push(XDataToObject(e));
                } else {
                    reObj.push(e);
                }
            });
        } else if (xdata instanceof Object) {
            reObj = {};
            for (let k in xdata) {
                let tar = xdata[k];
                if (isXData(tar)) {
                    reObj[k] = XDataToObject(tar);
                } else {
                    reObj[k] = tar;
                }
            }
        }
        return reObj;
    }

    // 同步数据的方法
    const syncData = (xdata1, xdata2, options) => {
        let type = getType(options)
        let func1, func2;

        // 数据同步
        switch (type) {
            case "string":
                func1 = e => {
                    let key = e.key[0];
                    if (options === key) {
                        xdata2.entrend(e);
                    }
                }
                func2 = e => {
                    let key = e.key[0];
                    if (options === key) {
                        xdata1.entrend(e);
                    }
                }
                break;
            case "array":
                func1 = e => {
                    let key = e.key[0];
                    if (options.indexOf(key) > -1) {
                        xdata2.entrend(e);
                    }
                }
                func2 = e => {
                    let key = e.key[0];
                    if (options.indexOf(key) > -1) {
                        xdata1.entrend(e);
                    }
                }
                break;
            case "object":
                let keys1 = Object.keys(options),
                    keys2 = Object.values(options);
                func1 = e => {
                    // 获取对应key
                    let key = e.key[0];

                    if (keys1.indexOf(key) > -1) {
                        // 深复制
                        e = Object.assign({}, e);

                        // 修正keyname
                        e.key[0] = keys2[keys1.indexOf(key)];

                        xdata2.entrend(e);
                    }
                }
                func2 = e => {
                    // 获取对应key
                    let key = e.key[0];

                    if (keys2.indexOf(key) > -1) {
                        // 深复制
                        e = Object.assign({}, e);

                        // 修正keyname
                        e.key[0] = keys1[keys2.indexOf(key)];

                        xdata1.entrend(e);
                    }
                }
                break;
            default:
                func1 = e => xdata2.entrend(e);
                func2 = e => xdata1.entrend(e);
        }

        // 数据绑定逻辑
        xdata1.trend(func1);
        xdata2.trend(func2);

        // 行动id
        let behaviorId = getRandomId();

        xdata1._syncs.push({
            bid: behaviorId,
            type,
            func: func1,
            opp: xdata2,
        });
        xdata2._syncs.push({
            bid: behaviorId,
            type,
            func: func2,
            opp: xdata1,
        });
    }

    const unSyncData = (xdata1, xdata2, options) => {
        let type = getType(options);

        // 获取相应的对象
        let tar = xdata1._syncs.find(e => e.opp === xdata2 && e.type === type);

        // 有目标，取出相应id的对象
        if (tar) {
            let {
                bid
            } = tar;

            let id_1 = xdata1._syncs.find(e => e.bid == bid);
            let id_2 = xdata2._syncs.find(e => e.bid == bid);

            xdata1._syncs.splice(id_1, 1);

            let tar2 = xdata2._syncs.splice(id_2, 1);
            tar2 = tar2[0]

            xdata1.untrend(tar.func);
            xdata2.untrend(tar2.func);
        }
    }

    // 触发改动
    let emitChange = (data, key, val, oldVal, type = "update", eOption) => {
        // 判断能否触发
        if (!data._canEmitWatch) {
            return;
        }

        // uphost通行
        if (type !== "uphost" && val === oldVal) {
            return;
        }

        // 对象级数据更新，判断对象是否相等
        if (type == "update" && isXData(val) && isXData(oldVal) && val.stringify() === oldVal.stringify()) {
            return;
        }

        let watchArr = data._watch[key];
        if (watchArr) {
            watchArr.forEach(func => {
                let watchOptions = {
                    oldVal,
                    type
                }
                // if (type == 'uphost') {
                watchOptions.uphost = assign({}, eOption);
                // } else if (type == "uparray") {
                //     watchOptions.uparray = assign({}, eOption);
                //     delete watchOptions.oldVal;
                // }
                func(val, watchOptions);
            });
        }

        data['_obs'].forEach(func => {
            let obsOption = {
                target: data,
                type,
                key,
                val,
                oldVal
            };
            // if (type == 'uphost') {
            obsOption.uphost = assign({}, eOption);
            // } else if (type == "uparray") {
            //     obsOption.uparray = assign({}, eOption);
            //     delete obsOption.oldVal;
            // }
            func(obsOption);
        });

        let {
            _host
        } = data;

        // 触发变动参数监听
        if (type !== "uphost") {
            // 只有根节点才有权trend
            let {
                _trend,
                _host
            } = data;

            // key数组
            let trendKeys = [];

            let aKey = key;

            while (_trend) {
                // 加入key
                trendKeys.unshift(aKey);

                let options = {
                    key: trendKeys,
                    val: XDataToObject(val),
                    oldVal: XDataToObject(oldVal),
                    type
                };

                // if (type == "uparray") {
                //     options.uparray = eOption;
                // }

                _trend.forEach(func => {
                    func(assign({}, options));
                });

                if (_host) {
                    let tar = _host.target[_host.key];

                    // 触发uphost
                    emitChange(_host.target, _host.key, tar, tar, "uphost", options)

                    _trend = _host.target._trend;
                    aKey = _host.key;
                    _host = _host.target._host;
                } else {
                    _trend = null
                }
            }
        }
    }

    // 代理对象
    let XObjectHandler = {
        set(target, key, value, receiver) {
            if (!/^_.+/.test(key)) {
                // 获取旧值
                let oldVal = target[key];

                let type = target.hasOwnProperty(key) ? "update" : "new";

                // 不能设置xdata
                if (isXData(value)) {
                    // throw `cann't set xdata`;
                    value = value.toObject();
                }

                // 判断value是否object
                value = createXData(value, target._root || target, target, key);

                // 继承行为
                let reValue = !0;

                if (target._exkeys) {
                    if (target._exkeys.indexOf(key) > -1) {
                        // 只修改准入值
                        target[key] = value;

                        // 触发改动事件
                        emitChange(target, key, value, oldVal, type);
                    } else {
                        reValue = Reflect.set(target, key, value, receiver);
                    }
                } else {
                    reValue = Reflect.set(target, key, value, receiver);

                    // 触发改动事件
                    emitChange(target, key, value, oldVal, type);
                }

                // 返回行为值
                return reValue;
            } else {
                return Reflect.set(target, key, value, receiver);
            }
        },
        deleteProperty(target, key) {
            if (!/^_.+/.test(key)) {
                // 获取旧值
                let oldVal = target[key];

                // 默认行为
                let reValue = Reflect.deleteProperty(target, key);

                // 触发改动事件
                emitChange(target, key, undefined, oldVal, "delete");

                return reValue;
            } else {
                return Reflect.deleteProperty(target, key);
            }
        }
    }

    // 主体xObject
    function XObject(root, host, key) {
        defineProperties(this, {
            '_id': {
                value: getRandomId()
            },
            '_obs': {
                value: []
            },
            '_trend': {
                value: []
            },
            '_syncs': {
                value: []
            },
            // 可以特殊绕过的key
            // '_exkeys': {
            //     value: []
            // },
            '_watch': {
                value: {}
            },
            '_canEmitWatch': {
                writable: !0,
                value: 0
            },
            'isRoot': {
                value: !!root
            }
        });

        if (root) {
            defineProperty(this, '_root', {
                value: root
            });
            defineProperty(this, '_host', {
                value: {
                    target: host,
                    key
                }
            });
        } else {
            defineProperty(this, '_cache', {
                value: {}
            });
        }
    }

    // 定位trendData
    const detrend = (tar, trendData) => {
        let lastId = trendData.key.length - 1;
        let reTar, reKey;
        trendData.key.forEach((key, i) => {
            // 没有对象就别再执行了
            if (tar instanceof Object && i <= lastId) {

                // 最后那个才设置
                if (i == lastId) {
                    reTar = tar;
                    reKey = key;
                }

                // 修正对象
                tar = tar[key];
            }
        });

        return [reTar, reKey];
    }

    const seekByProp = (tarObj, value, prop) => {
        let reobj = [];

        if (isXData(tarObj)) {
            // 查询是否相等
            if (value && tarObj[prop] === value) {
                reobj.push(tarObj);
            } else if (tarObj instanceof XArray) {
                // 继续递归
                reobj = seekData(tarObj, value, prop);
            } else if (!value) {
                // 不存在value
                if (tarObj.hasOwnProperty(prop)) {
                    reobj.push(tarObj);
                }
            }
        }

        return reobj;
    }

    // 查找对象
    const seekData = (data, value, prop = "_id") => {
        let reobj = [];
        if (data instanceof XObject) {
            if (prop == "_id") {
                for (let k in data) {
                    reobj = seekByProp(data[k], value, prop);
                    if (0 in reobj) {
                        break;
                    }
                }
            } else {
                for (let k in data) {
                    let temp = seekByProp(data[k], value, prop);
                    reobj.splice(reobj.length, 0, ...temp);
                }
            }
        } else if (data instanceof XArray) {
            if (prop == "_id") {
                data.some(tar => {
                    reobj = seekByProp(tar, value, prop);
                    if (0 in reobj) {
                        return true;
                    }
                });
            } else {
                data.forEach(tar => {
                    let temp = seekByProp(tar, value, prop);
                    reobj.splice(reobj.length, 0, ...temp);
                });
            }
        }

        return reobj;
    }

    let XObjectFn = {
        // 监听
        watch(key, func) {
            switch (getType(key)) {
                case "string":
                    let watchArr = this._watch[key] || (this._watch[key] = []);
                    func && watchArr.push(func);
                    break;
                case "object":
                    for (let i in key) {
                        this.watch(i, key[i]);
                    }
                    break;
            }
            return this;
        },
        // 取消监听
        unwatch(key, func) {
            switch (getType(key)) {
                case "string":
                    let watchArr = this._watch[key] || (this._watch[key] = []);
                    let id = watchArr.indexOf(func);
                    id > -1 && watchArr.splice(id, 1);
                    break;
                case "object":
                    for (let i in key) {
                        this.watch(i, key[i]);
                    }
                    break;
            }
            return this;
        },
        // 视奸
        observe(func) {
            func && this['_obs'].push(func);
            return this;
        },
        // 注销
        unobserve(func) {
            let id = this['_obs'].indexOf(func);
            (id > -1) && this['_obs'].splice(id, 1);
            return this;
        },
        // 完全重置对象（为了使用同一个内存对象）
        reset(value, options) {
            if (options) {
                // 清空选项
                if (options.watch) {
                    for (let k in this._watch) {
                        delete this._watch[k];
                    }
                }
                if (options.obs) {
                    this._obs.length = 0;
                }
                if (options.trend) {
                    this._trend.length = 0;
                }
                if (sync) {
                    this._syncs.length = 0;
                }
            }

            // 删除后重新设置
            for (let k in this) {
                delete this[k];
            }
            assign(this, value);
        },
        // 监听数据变动字符串流
        trend(func) {
            func && this['_trend'].push(func);
            return this;
        },
        // 流入变动字符串流数据
        entrend(trendData) {
            let [tar, key] = detrend(this, trendData);

            switch (trendData.type) {
                case "delete":
                    // 删除
                    delete tar[key];
                    break;
                default:
                    //默认update和new
                    tar[key] = trendData.val;
            }

            return this;
        },
        // 取消数据变动字符串流监听
        untrend(func) {
            let id = this['_trend'].indexOf(func);
            (id > -1) && this['_trend'].splice(id, 1);
            return this;
        },
        // 同步数据
        sync(xdata, options) {
            xdata.reset(this.toObject());
            syncData(this, xdata, options);
            return this;
        },
        // 取消数据绑定
        unsync(xdata, options) {
            unSyncData(this, xdata, options);
            return this;
        },
        // 转换数据
        transData(options) {
            let defaults = {
                // 自身key监听
                key: "",
                // 目标数据对象
                target: "",
                // 目标key
                targetKey: "",
                // 数据对接对象
                // trans: {}
            };
            assign(defaults, options);

            let {
                key,
                target,
                targetKey,
                trans
            } = defaults;

            // 判断是否有trans
            if (defaults.trans) {
                // 生成翻转对象
                let resverObj = {};
                for (let k in trans) {
                    resverObj[trans[k]] = k;
                }

                // 监听
                this.watch(key, d => {
                    d = trans[d];
                    target[targetKey] = d;
                });
                target.watch(targetKey, d => {
                    d = resverObj[d];
                    this[key] = d;
                });
            }
        },
        // 转换成普通对象
        toObject() {
            let reObj = XDataToObject(this);
            return reObj;
        },
        // 转换成json字符串
        // 会保留数组数据
        stringify() {
            let obj = XDataToObject(this);
            let reObj = JSON.stringify(obj);
            return reObj;
        },
        // 查找相应prop的数据对象
        seek(prop) {
            let reData;
            let propMatch = prop.match(/\[.+?\]/g);
            if (propMatch) {
                // 临时函数
                let temFunc = (i, tempArr) => {
                    // 替换成当前数组
                    if (i === 0) {
                        reData = tempArr;
                    } else {
                        // 替换数组
                        let newArr = [];

                        // 取并集
                        tempArr.forEach(e => {
                            if (reData.indexOf(e) > -1) {
                                newArr.push(e);
                            }
                        });

                        // 替换
                        reData = newArr;
                    }
                }

                propMatch.forEach((e, i) => {
                    if (e.search('=') > -1) {
                        let props = e.match(/\[(.+?)=(.+?)\]/);
                        let key = props[1],
                            value = props[2];
                        let tempArr = seekData(this, value, key);

                        temFunc(i, tempArr);
                    } else {
                        let key = e.replace('[', "").replace(']', "").replace('=', "");
                        let tempArr = seekData(this, undefined, key);

                        temFunc(i, tempArr);
                    }
                });

                temFunc = null;
            } else {
                reData = seekData(this, prop)[0];
            }
            return reData;
        }
    };

    // 设置在 prototype 上
    for (let k in XObjectFn) {
        defineProperty(XObject.prototype, k, {
            value: XObjectFn[k]
        });
    }

    // 生成对象
    let createXObject = (obj, root, host, key) => {
        // 转换对象数据
        let xobj = new XObject(root, host, key);

        let reObj = new Proxy(xobj, XObjectHandler)

        // 合并数据
        assign(reObj, obj);

        // 打开阀门
        xobj._canEmitWatch = 1;

        // 返回代理对象
        return reObj;
    }

    function XArray(...args) {
        XObject.apply(this, args);
    }

    let XArrayFn = Object.create(Array.prototype);

    for (let k in XObjectFn) {
        defineProperty(XArrayFn, k, {
            value: XObjectFn[k]
        });
    }

    XArray.prototype = XArrayFn;

    // 生成数组型对象
    let createXArray = (arr, root, host, key) => {
        let xarr = new XArray(root, host, key);

        let reObj = new Proxy(xarr, XObjectHandler);

        // 合并数据
        Array.prototype.splice.call(reObj, 0, 0, ...arr);

        // 打开阀门
        xarr._canEmitWatch = 1;

        return reObj;
    }

    let createXData = (obj, root, host, key) => {
        switch (getType(obj)) {
            case "object":
                return createXObject(obj, root, host, key);
            case "array":
                return createXArray(obj, root, host, key);
        }
        return obj;
    }

    $.xdata = obj => createXData(obj);
    $.detrend = detrend;

    // function

    // 原型对象
    let XHearFn = Object.create(shearInitPrototype);

    // 设置svRender
    XHearFn.svRender = !0;

    // 合并数据
    // assign(XHearFn, XDataFn);
    for (let k in XObjectFn) {
        defineProperty(XHearFn, k, {
            value: XObjectFn[k]
        });
    }

    defineProperty(XHearFn, 'set', {
        value(key, value) {
            let id = this._exkeys.indexOf(key);
            if (id === -1) {
                this._exkeys.push(key);
            }
            this[key] = value;
        }
    });

    const register = (options) => {
        let defaults = {
            // 自定义标签名
            tag: "",
            // 正文内容字符串
            temp: "",
            // 属性绑定keys
            attrs: [],
            props: [],
            // 默认数据
            data: {},
            // 直接监听属性变动对象
            watch: {},
            // 原型链上的方法
            // proto: {},
            // 初始化完成后触发的事件
            // inited() {},
            // 添加进document执行的callback
            // attached() {},
            // 删除后执行的callback
            // detached() {}
        };

        assign(defaults, options);

        let {
            proto,
            props,
            temp,
            tag
        } = defaults;

        // 添加value定值
        props.push('value');

        // 生成新的数据对象
        let XHear = function (...args) {
            XObject.apply(this, args);
        }

        let inXHearFn = XHearFn;

        // 判断是否有公用方法
        if (proto) {
            inXHearFn = create(XHearFn);
            assign(inXHearFn, proto);
        }

        // 赋值原型对象
        XHear.prototype = inXHearFn;

        // 去除无用的代码（注释代码）
        temp = temp.replace(/<!--.+?-->/g, "");

        //准换自定义字符串数据
        var textDataArr = temp.match(/{{.+?}}/g);
        textDataArr && textDataArr.forEach((e) => {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                temp = temp.replace(e, `<xv-span svkey="${key[1].trim()}"></xv-span>`);
            }
        });

        // 加入tag数据库
        tagDatabase[tag] = assign({}, defaults, {
            XHear,
            temp
        })

        // 渲染已存在tag
        _$(defaults.tag + '[xv-ele]').each((i, e) => {
            renderEle(e);
        });
    }

    $.register = register;

    const filterShadow = ($eles, exShadowId) => {
        // 去除 shadow 元素
        let hasShadow = 0,
            newArr = [],
            {
                prevObject
            } = $eles;

        if (exShadowId) {
            $eles.each((i, e) => {
                if (hasAttr(e, 'xv-shadow') && e.getAttribute('xv-shadow') == exShadowId) {
                    newArr.push(e);
                    hasShadow = 1;
                }
            });
        } else {
            $eles.each((i, e) => {
                if (hasAttr(e, 'xv-shadow')) {
                    hasShadow = 1;
                } else {
                    newArr.push(e);
                }
            });
        }

        if (hasShadow) {
            $eles = _$(newArr);
            // 还原prevObject
            if (prevObject) {
                $eles.prevObject = prevObject;
            }
        }

        return $eles;
    }

    // 覆盖还原 xv-ele 数据
    const matchCloneData = (tarEle, referEle) => {
        // 生成当前元素
        let tagname = tarEle[0].tagName.toLowerCase();

        // 映射data
        let tarData = tagDatabase[tagname];

        // 获取关键key
        let keyArr = new Set([...Object.keys(tarData.data), ...tarData.props, ...tarData.attrs]);

        // 还原数据
        each(keyArr, (e) => {
            tarEle[e] = referEle[e];
        });
    }

    // 还原克隆xv-ele元素成html模式
    // 用的都是$fn.find
    const reduceCloneSvEle = (elem) => {
        let renderId = elem.attr('xv-render');

        if (renderId) {
            // 清除所有非 xv-content 的 xv-shadow 元素
            elem.find(`[xv-shadow="${renderId}"]:not([xv-content])`).remove();

            // 将剩余的 xv-content 还原回上一级去
            elem.find(`[xv-shadow="${renderId}"][xv-content]`).each((i, e) => {
                // 获取子元素数组
                _$(e).before(e.childNodes).remove();
            });
        }

        // 判断是否有子xv-ele元素，并还原
        let childsSvEle = elem.find('[xv-render]');
        childsSvEle.each((i, e) => {
            reduceCloneSvEle(_$(e));
        });
    };

    // 修正content的xv-shadow属性
    const fixShadowContent = (_this, content) => {
        // 获取content类型
        let contentType = getType(content);

        // 如果自己是影子元素
        if (_this.is('[xv-shadow]')) {
            // 获取shadowId
            let svid = _this.attr('xv-shadow');
            if ((contentType == "string" && content.search('<') > -1)) {
                let contentEle = _$(content)
                contentEle.attr('xv-shadow', svid);
                contentEle.find('*').attr('xv-shadow', svid);
                content = "";
                each(contentEle, (e) => {
                    content += e.outerHTML;
                });
            } else
            if (contentType instanceof Element) {
                _$(content).attr('xv-shadow', svid);
            } else if (content instanceof $) {
                _$(Array.from(content)).attr('xv-shadow', svid);
            }
        }
        return content;
    }

    // 筛选出自身对象
    const fixSelfToContent = (_this) => {
        if (_this.is('[xv-render]')) {
            _this = _this.map((i, e) => {
                let re = e;
                let xvData = e[XHEAROBJKEY];
                while (xvData && xvData.$content) {
                    re = xvData.$content[0];
                    xvData = re.xvData;
                }
                return re;
            });
        }
        return _this;
    };

    // 修正其他节点操控的方法
    assign(shearInitPrototype, {
        add(...args) {
            let obj = args[0];
            if (obj instanceof glo.$ && obj.is('xv-shadow')) {
                throw SHADOW_DESCRIPT_CANNOTUSE + 'add';
            }
            return $fn.add.apply(this, args);
        },
        attr(...args) {
            let [aName, aValue] = args;
            if (aValue && this.is('[xv-render]')) {
                this.each((i, e) => {
                    let tagdata = getTagData(e);
                    if (tagdata) {
                        // 查找attr内是否有他自己
                        if (tagdata.attrs.indexOf(aName) > -1) {
                            e[XHEAROBJKEY][aName] = aValue;
                            return;
                        }
                    }
                    $fn.attr.apply(_$(e), args);
                });
            } else {
                return $fn.attr.apply(this, args);
            }
        },
        clone(...args) {
            if (this.is('[xv-shadow]')) {
                throw SHADOW_DESCRIPT_CANNOTUSE + 'clone';
            }
            if (this.svRender) {
                // 获取原先的html
                // shearInitPrototype.html
                let b_html = this.html();

                // 将所有 xv-render 变成 xv-ele
                let temDiv = _$(`<div>${b_html}</div>`);
                // $fn.find
                temDiv.find('[xv-render]').each((i, e) => {
                    _$(e).removeAttr('xv-render').attr('xv-ele', "");
                });
                b_html = temDiv.html();

                // 生成当前元素
                let tagname = this[0].tagName.toLowerCase();

                // 生成克隆元素
                let cloneEle = this[0].cloneNode();
                _$(cloneEle).removeAttr('xv-render').attr('xv-ele', "").html(b_html);
                renderEle(cloneEle);
                let tar = createShearObject(cloneEle);

                // 还原数据
                matchCloneData(tar, this);

                // 判断content是否还有xv-ele，渲染内部
                let bRenderEles = _$('[xv-render]:not([xv-shadow])', this);
                if (0 in bRenderEles) {
                    let aRenderEles = _$('[xv-render]:not([xv-shadow])', tar);
                    // 确认数量匹配
                    if (aRenderEles.length == bRenderEles.length) {
                        aRenderEles.each((i, e) => {
                            // 获取对方
                            let referEle = bRenderEles[i];

                            // 确认tag匹配
                            if (referEle.tagName !== e.tagName) {
                                console.warn('cloned xv-ele data does not match');
                                return false;
                            }

                            // 通过匹配
                            matchCloneData(createShearObject(e), createShearObject(referEle));
                        });
                    }
                }

                return tar;
            } else {
                let isSvRender = this.is('[xv-render]');
                let hasSvRender = 0 in this.find('[xv-render]');
                if (isSvRender || hasSvRender) {
                    // 抽出来
                    let tar = _$(Array.from(this));

                    // 直接克隆一份
                    let cloneEle = tar.clone(...args);

                    // 还原克隆元素内的svele
                    reduceCloneSvEle(cloneEle);

                    // 重新渲染克隆元素
                    cloneEle.find('[xv-render]').removeAttr('xv-render').attr('xv-ele', "");
                    renderAllSvEle(cloneEle);

                    tar.each((i, e) => {
                        if (hasAttr(e, 'xv-render')) {
                            cloneEle[i] = createShearObject(e).clone()[0];
                        }
                    });

                    // 还原克隆方法
                    let cloneFun = (expr) => {
                        let cloneSvRenderEle = cloneEle.find(expr);
                        if (0 in cloneSvRenderEle) {
                            let oriSvRenderEle = tar.find(expr);

                            if (cloneSvRenderEle.length == oriSvRenderEle.length) {
                                // 逐个克隆还原回去
                                oriSvRenderEle.each((i, e) => {
                                    matchCloneData(createShearObject(cloneSvRenderEle[i]), createShearObject(e));
                                });
                            }
                        }
                    };

                    // 还原克隆svele
                    cloneFun('[xv-render]:not([xv-shadow])');
                    cloneFun('[xv-render][xv-shadow]');

                    this.prevObject && (cloneEle.prevObject = this);

                    return createShear$(cloneEle);
                } else {
                    $fn.clone.apply(this, args);
                }
            }
        },
        empty() {
            $fn.empty.call(fixSelfToContent(this));
            return this;
        },
        parent(expr) {
            let rearr = this.map((i, e) => {
                let re = e.parentNode;
                while (re.svParent) {
                    re = re.svParent;
                }
                return re;
            });
            let reobj = createShear$(Array.from(new Set(rearr)));
            if (expr) {
                reobj = reobj.filter(expr);
            }
            return reobj;
        },
        // parents需要重做
        parents(expr) {
            let rearr = [];
            this.each((i, e) => {
                let par = e.parentNode;
                while (par && par !== document) {
                    while (par.svParent) {
                        par = par.svParent;
                    }
                    rearr.push(par);
                    par = par.parentNode;
                }
            });
            let reobj = createShear$(Array.from(new Set(rearr)));
            if (expr) {
                reobj = reobj.filter(expr);
            }
            return reobj;
        },
        parentsUntil(expr) {
            let rearr = [];

            this.each((i, e) => {
                let par = e.parentNode;
                while (par && par !== document) {
                    while (par.svParent) {
                        par = par.svParent;
                    }
                    if (expr && _$(par).is(expr)) {
                        break;
                    }
                    rearr.push(par);
                    par = par.parentNode;
                }
            });

            return createShear$(new Set(rearr));
        },
        // unwrap需要重做
        unwrap() {
            let pNode = _$(this).parent();
            if (pNode.is('[xv-content]')) {
                pNode.each((i, e) => {
                    let {
                        svParent
                    } = e;
                    if (svParent) {
                        svParent = _$(svParent);
                    } else {
                        svParent = _$(e);
                    }
                    let childs = e.childNodes;
                    each(childs, (e_child) => {
                        svParent.before(e_child);
                    });
                    svParent.remove();
                });
            } else {
                $fn.unwrap.call(this);
            }
            return this;
        },
        // 查找所有元素（包含影子元素）
        findReal(...args) {
            return createShear$($fn.find.apply(this, args));
        },
        // 只查找自己的影子元素
        findShadow(...args) {
            let reObj = $fn.find.apply(this, args);
            reObj = filterShadow(reObj, this.attr('xv-render'));
            return createShear$(reObj);
        }
    });

    // 修正影子content
    each(['after', 'before', 'wrap', 'wrapAll', 'replaceWith'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (content) {
            // 继承旧的方法
            oldFunc.call(this, fixShadowContent(this, content));

            renderAllSvEle(this.parent());

            // 返回对象
            return this;
        });
    });

    // 紧跟after before wrap 步伐
    each(['insertAfter', 'insertBefore', 'replaceAll'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (content) {
            // 影子元素不能做这个操作
            if (this.is('[xv-shadow]')) {
                throw SHADOW_DESCRIPT_CANNOTUSE + kName;
            }

            // 继承旧的方法
            oldFunc.call(fixShadowContent(_$(content), this), content);

            // 返回对象
            return this;
        });
    });

    // 修正影子content，引向$content
    each(['append', 'prepend', 'wrapInner'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (content) {

            // 继承旧的方法
            oldFunc.call(fixSelfToContent(this), fixShadowContent(this, content));

            renderAllSvEle(this);

            return this;
        });
    });

    // 紧跟append 和 prepend 步伐
    each(['appendTo', 'prependTo'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (content) {
            // 影子元素不能做这个操作
            if (this.is('[xv-shadow]')) {
                throw SHADOW_DESCRIPT_CANNOTUSE + kName;
            }

            let $con = _$(content);

            if ($con.is('[xv-shadow]')) {
                fixShadowContent($con, this);
            }

            // 继承旧的方法
            oldFunc.call(this, fixSelfToContent($con));

            return this;
        });
    });

    // 超找子元素型方法
    // 引向$content，影子过滤，修正成svele
    each(['find', 'children'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (expr) {
            let reObj = oldFunc.call(fixSelfToContent(this), expr);

            let svData = (reObj.length == 1) && reObj[0][XHEAROBJKEY];

            if (svData) {
                reObj = createShearObject(reObj[0]);
            } else {
                if (this.is('[xv-shadow]')) {
                    reObj = filterShadow(reObj, this.attr('xv-shadow'));
                } else {
                    // 如果前一级不是xv-shaodw，就去除查找后的带xv-shadow
                    reObj = filterShadow(reObj);
                }
                reObj = createShear$(reObj);
            }

            return reObj;
        });
    });

    // 筛选型方法
    // 修正成svele （筛选型方法）
    each(['eq', 'first', 'last', 'filter', 'has', 'not', 'slice', 'next', 'nextAll', 'nextUntil', 'prev', 'prevAll', 'prevUntil', 'siblings'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (...args) {
            let reObj = $fn[kName].apply(this, args);
            reObj = createShear$(reObj);
            return reObj;
        });
    });

    // html text
    each(['html', 'text'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function (content) {
            // 需要返回的对象
            let reObj = this;

            // 为了获取html来的
            if (isUndefined(content)) {
                let elem = _$(reObj[0]);

                // 判断是否存在 shear控件
                // $fn.find
                if (0 in elem.find('[xv-shadow]')) {
                    // 先复制一个出来
                    let cloneElem = _$(elem[0].cloneNode(true));

                    // 还原元素
                    reduceCloneSvEle(cloneElem);

                    // 返回
                    return oldFunc.call(cloneElem);
                } else {
                    return oldFunc.call(elem);
                }
            } else {
                // 直接继承
                if (kName !== 'text') {
                    content = fixShadowContent(this, content);
                }

                reObj = oldFunc.call(fixSelfToContent(this), content);
                // reObj = oldFunc.call(fixSelfToContent(this));

                renderAllSvEle(this);

                // 返回对象
                return reObj;
            }
        });
    });

    (() => {
        // 判断有没有pushStack
        let {
            pushStack
        } = $fn;
        if (pushStack) {
            shearInitPrototype.pushStack = function (...args) {
                return createShear$(pushStack.apply(this, args));
            }
        }
    })();

    // init
    const xhear = {
        register
    };

    glo.xhear = xhear;

    glo.$ = $;

    // ready
    // 页面进入之后，进行一次渲染操作
    _$(() => {
        const attachedFun = (ele) => {
            if (ele[ATTACHED_KEY]) {
                return;
            }
            let tagdata = getTagData(ele);
            tagdata.attached && tagdata.attached.call(ele, createShearObject(ele));
            ele[ATTACHED_KEY] = 1;
        }

        const detachedFunc = (ele) => {
            // 确认是移出 document 的元素
            if (ele.getRootNode() != document) {
                let tagdata = getTagData(ele);
                tagdata.detached && tagdata.detached.call(ele, createShearObject(ele));

                // 防止内存不回收
                // 清除svParent
                _$('[xv-content]', ele).each((i, e) => {
                    delete e.svParent;
                });

                // 清空observer属性
                let xvData = ele[XHEAROBJKEY];

                if (xvData) {
                    xvData.__obs && xvData.__obs.disconnect();
                    delete xvData.__obs;
                    delete ele[XHEAROBJKEY];
                }
            }
        }

        // attached detached 监听
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((e) => {
                let {
                    addedNodes,
                    removedNodes
                } = e;

                // 监听新增元素
                if (addedNodes && 0 in addedNodes) {
                    each(addedNodes, (ele) => {
                        if (ele[XHEAROBJKEY]) {
                            attachedFun(ele);
                        }

                        if (ele instanceof Element) {
                            // 触发已渲染的attached
                            each(ele.querySelectorAll('[xv-render]'), e => {
                                attachedFun(e);
                            });
                        }
                    });
                }

                // 监听去除元素
                if (removedNodes && 0 in removedNodes) {
                    each(removedNodes, (ele) => {
                        if (ele[XHEAROBJKEY]) {
                            detachedFunc(ele);
                        }

                        _$('[xv-render]', ele).each((i, e) => {
                            detachedFunc(e);
                        });
                    });
                }
            });
        });
        observer.observe(document.body, {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true,
        });

        // 初始渲染一次
        _$('[xv-ele]').each((i, e) => {
            renderEle(e);
        });
    });

    // 初始css
    _$('head').append('<style>[xv-ele]{display:none}</style>');

})(window);