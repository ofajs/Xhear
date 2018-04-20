(function(glo) {
    //@base---start
    "use strict";
    //common
    var SMARTKEY = "_s_" + new Date().getTime();
    var SMARTEVENTKEY = SMARTKEY + "_e";
    var STR_function = "function";
    var STR_string = "string";
    var STR_object = "object";
    var STR_undefined = "undefined";
    var UNDEFINED = undefined;
    var DOCUMENT = document;

    //function
    var arrlyslice = Array.prototype.slice;
    var makeArray = function(arrobj) {
        return arrlyslice.call(arrobj);
    };

    //获取类型
    var getType = function(value) {
        return Object.prototype.toString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
    };

    //合并对象
    var extend = function(def) {
        var args = makeArray(arguments).slice(1);
        arrayEach(args, function(opt) {
            for (var key in opt) {
                def[key] = opt[key];
            }
        });
        return def;
    };

    //arr类型的遍历
    var arrayEach = function(arr, func) {
        !(arr instanceof Array) && (arr = makeArray(arr));
        arr.some(function(e, i) {
            return func(e, i) === false;
        });
        return arr;
    };

    //obj类型的遍历
    var objEach = function(obj, func) {
        var i;
        for (i in obj) {
            if (func(i, obj[i]) === false) {
                break;
            };
        }
        return obj;
    }

    //合并数组
    var merge = function(arr1, arr2) {
        var fakeArr2 = makeArray(arr2);
        fakeArr2.unshift(arr1.length, 0);
        arr1.splice.apply(arr1, fakeArr2);
        return arr1;
    };

    //SmartFinder---------start
    //匹配数组中的专用元素并返回
    var fliterDedicatedEles = function(beforeData, selecter) {
        var redata = [];
        switch (selecter) {
            case ":odd":
                redata = beforeData.filter(function(e, i) {
                    return !((i + 1) % 2);
                });
                break;
            case ":even":
                redata = beforeData.filter(function(e, i) {
                    return (i + 1) % 2;
                });
                break;
            case ":parent":
                redata = beforeData.filter(function(e) {
                    return !!e.innerHTML;
                });
                break;
            case ":first":
                redata = [beforeData[0]];
                break;
            case ":last":
                redata = beforeData.slice(-1);
                break;
            case ":header":
                redata = findEles(beforeData, "h1,h2,h3,h4,h5");
                break;
            case ":hidden":
                beforeData.forEach(function(e) {
                    if (getComputedStyle(e).display === "none" || e.type === "hidden") {
                        redata.push(e);
                    }
                });
                break;
            case ":visible":
                beforeData.forEach(function(e) {
                    if (getComputedStyle(e).display != "none" && e.type != "hidden") {
                        redata.push(e);
                    }
                });
                break;
            default:
                var expr_five;
                if (expr_five = selecter.match(/:eq\((.+?)\)/)) {
                    var e1 = parseInt(expr_five[1]);
                    redata = beforeData.slice(e1, e1 > 0 ? e1 + 1 : UNDEFINED);
                    break;
                }
                if (expr_five = selecter.match(/:lt\((.+?)\)/)) {
                    redata = beforeData.slice(0, expr_five[1]);
                    break;
                }
                if (expr_five = selecter.match(/:gt\((.+?)\)/)) {
                    redata = beforeData.slice(parseInt(expr_five[1]) + 1);
                    break;
                }
                if (expr_five = selecter.match(/:has\((.+?)\)/)) {
                    beforeData.forEach(function(e) {
                        var findele = findEles(e, expr_five[1]);
                        if (0 in findele) {
                            redata.push(e);
                        }
                    });
                    break;
                }
                if (expr_five = selecter.match(/:contains\((.+?)\)/)) {
                    beforeData.forEach(function(e) {
                        if (e.innerHTML.search(expr_five[1]) > -1) {
                            redata.push(e);
                        }
                    });
                    break;
                }
        }

        return redata;
    };

    var spe_expr = /(.*)(:even|:odd|:header|:parent|:hidden|:eq\(.+?\)|:gt\(.+?\)|:lt\(.+?\)|:has\(.+?\)|:contains\(.+?\)|:first(?!-)|:last(?!-))(.*)/;
    //查找元素的方法
    var findEles = function(owner, expr) {
        var redata = [];

        expr = expr.trim();

        //判断表达式是否空
        if (!expr) {
            return owner.length ? owner : [owner];
        }

        // 判断是否是数组
        if (0 in owner) {
            arrayEach(owner, function(e) {
                var arr = findEles(e, expr);
                merge(redata, arr);
            });
            return redata;
        }

        //判断是否有专属选择器
        var speMatch = expr.match(spe_expr);

        //存在专属字符进入专属字符通道
        if (speMatch) {
            if (/,/.test(expr)) {
                //带有分组信息需要分开处理
                expr.split(',').forEach(function(e) {
                    merge(redata, findEles(owner, e));
                });
            } else if (expr.match(/(.+?):not\((.+?)\)/)) {
                //not有对专用字符有特殊的处理渠道
                //筛选not关键信息
                //拆分括号
                var notStrArr = expr.replace(/([\(\)])/g, "$1&").split('&');

                //搜索到第一个not后开始计数
                var nCount = 0;
                var nAction = 0;
                var beforestr = "";
                var targetStr = "";
                var afterStr = "";
                notStrArr.forEach(function(e) {
                    if (!nAction) {
                        if (e.search(/:not\(/) > -1) {
                            nAction = 1;
                            nCount++;
                            //加上非not字符串
                            beforestr += e.replace(/:not\(/, "");
                        } else {
                            beforestr += e;
                        }
                    } else {
                        if (e.search(/\(/) > -1) {
                            nCount++;
                        } else if (e.search(/\)/) > -1) {
                            nCount--;
                        }
                        if (nAction === 1 && !nCount) {
                            nAction = 2;
                        } else if (nAction === 2) {
                            afterStr += e;
                        } else {
                            targetStr += e;
                        }
                    }
                });

                //获取相应关键元素
                var ruleInEle = findEles(owner, beforestr);
                var ruleOutEle = findEles(owner, beforestr + targetStr);
                ruleInEle.forEach(function(e) {
                    ruleOutEle.indexOf(e) === -1 && redata.push(e);
                }, this);

                //查找后续元素
                if (afterStr) {
                    redata = findEles(redata, afterStr);
                }
            } else {
                //没有not就好说
                //查找元素后，匹配特有字符
                redata = findEles(owner, speMatch[1]);
                redata = fliterDedicatedEles(redata, speMatch[2]);

                //查找后续元素
                if (speMatch[3]) {
                    redata = findEles(redata, speMatch[3]);
                }
            }
        } else {
            //是否是Text节点
            if (owner instanceof Text) {
                redata = [owner];
            } else if (owner.length && owner instanceof Element) {
                //没有的话直接查找元素
                owner.forEach(function(e) {
                    merge(redata, findEles(e, expr));
                });
            } else {
                //查看看是否有原生querySelectorAll支持但是有缺陷的表达方式
                var matchData;
                if (matchData = expr.match(/^>(\S*) *(.*)/)) {
                    if (1 in matchData) {
                        var expr2 = matchData[1];
                        makeArray(owner.children).forEach(function(e) {
                            judgeEle(e, expr2) && redata.push(e);
                        });
                    }
                } else {
                    redata = owner.querySelectorAll(expr);
                }
            }
        }

        return makeArray(redata);
    };
    //SmartFinder---------end

    //判断元素是否符合条件
    var judgeEle = function(ele, expr) {
        var fadeParent = DOCUMENT.createElement('div');
        if (ele === DOCUMENT) {
            return false;
        }
        fadeParent.appendChild(ele.cloneNode(false));
        return 0 in findEles(fadeParent, expr) ? true : false;
    };

    //转换字符串到html对象
    var transToEles = function(str) {
        var par = DOCUMENT.createElement('div');
        par.innerHTML = str;
        var ch = makeArray(par.childNodes);
        par.innerHTML = "";
        return ch.filter(function(e) {
            var isInText = e instanceof Text;
            if ((isInText && e.textContent && e.textContent.trim()) || !isInText) {
                return e;
            }
        });
    };

    //main
    function smartJQ(selector, context) {
        return this.init(selector, context);
    };

    var prototypeObj = Object.create(Array.prototype);

    //初始化函数
    prototypeObj.init = function(arg1, arg2) {
        //只有一个参数的情况
        var a1type = getType(arg1);
        switch (a1type) {
            case STR_string:
                if (/</.test(arg1)) {
                    //带有生成对象的类型
                    merge(this, transToEles(arg1));
                } else {
                    //查找元素
                    var eles = [];
                    var arg2type = getType(arg2);
                    if (arg2type === STR_string) {
                        //参数2有的情况下
                        var parnodes = findEles(DOCUMENT, arg2);
                        arrayEach(parnodes, function(e) {
                            var tareles = findEles(e, arg1);
                            arrayEach(tareles, function(e) {
                                if (eles.indexOf(e) === -1) {
                                    eles.push(e);
                                }
                            });
                        });
                    } else if (arg2 instanceof Element || arg2 instanceof smartJQ) {
                        eles = findEles(arg2, arg1);
                    } else if (!arg2) {
                        eles = findEles(DOCUMENT, arg1);
                    }
                    merge(this, eles);
                }
                break;
            case STR_function:
                if (DOCUMENT.readyState === "complete") {
                    arg1($)
                } else {
                    DOCUMENT.addEventListener('DOMContentLoaded', function() {
                        arg1($)
                    }, false);
                }
                break;
            default:
                if (arg1 instanceof smartJQ) {
                    return arg1;
                } else if (arg1 instanceof Array) {
                    merge(this, arg1);
                } else if (!arg1) {
                    return $([]);
                } else if (!arg2) {
                    this.push(arg1);
                } else if (arg2) {
                    eles = findEles(arg1, arg2);
                    merge(this, eles);
                }
        }
        return this;
    }

    //init
    var $ = function(selector, context) {
        // if (!selector) {
        //     return $([]);
        // }
        return new smartJQ(selector, context);
    };
    $.fn = $.prototype = smartJQ.fn = smartJQ.prototype = prototypeObj;

    glo.$ = $;
    // glo.smartJQ = smartJQ;

    //在$上的方法
    //随框架附赠的方法
    //@must---$.extend
    //@must---$.makearray
    //@must---$.merge
    //@must---$.type
    extend($, {
        expando: SMARTKEY,
        extend: extend,
        makearray: makeArray,
        merge: merge,
        type: getType
    });
    //@base---end


    extend(prototypeObj, {
        //设置样式
        css: function(name, value) {
            //第一个是对象类型
            if (getType(name) === STR_object) {
                arrayEach(this, function(e) {
                    objEach(name, function(n, v) {
                        // 判断单位是否px
                        var orival = String(getComputedStyle(e)[n]);
                        if (orival.search('px') > -1) {
                            if (String(v).search('px') == -1) {
                                orival += "px";
                            }
                        }
                        e.style[n] = v;
                    });
                });
            } else if (getType(name) === STR_string && value != UNDEFINED) {
                arrayEach(this, function(e) {
                    e.style[name] = value;
                });
            } else if (getType(name) === STR_string && !value) {
                return getComputedStyle(this[0])[name];
            }
            return this;
        },
        offset: function() {
            // if (!options) {
            var tar = this[0];
            var boundingClientRect = tar.getBoundingClientRect();

            return {
                top: boundingClientRect.top + window.pageYOffset,
                left: boundingClientRect.left + window.pageXOffset
            };
            // }
        },
        position: function() {
            //@use---$.fn.css
            //@use---$.fn.offset
            //获取父元素
            var offsetParent = $(this[0].offsetParent);
            // var parentOffset = offsetParent.offset();
            var tarOffset = this.offset();

            var martop = parseFloat(this.css('marginTop'));
            var marleft = parseFloat(this.css('marginLeft'));

            var parentBordertop = parseFloat(offsetParent.css('borderTopWidth'));
            var parentBorderleft = parseFloat(offsetParent.css('borderLeftWidth'));

            return {
                // top: tarOffset.top - parentOffset.top - martop - parentBordertop,
                // left: tarOffset.left - parentOffset.left - marleft - parentBorderleft,
                top: tarOffset.top - martop - parentBordertop,
                left: tarOffset.left - marleft - parentBorderleft
            };
        },
        _sc: function(key, val) {
            return val === UNDEFINED ? this[0][key] : arrayEach(this, function(tar) {
                tar[key] = val;
            });
        },
        scrollTop: function(val) {
            //@use---$.fn._sc
            return this._sc('scrollTop', val);
        },
        scrollLeft: function(val) {
            //@use---$.fn._sc
            return this._sc('scrollLeft', val);
        },
        _wh: function(key, val) {
            //@use---$.fn.css
            switch (getType(val)) {
                case STR_function:
                    return arrayEach(this, function(tar, i) {
                        var $tar = $(tar);
                        var reval = val.call(tar, i, parseFloat($tar.css(key)));
                        reval && $tar[key](reval);
                    });
                case STR_undefined:
                    return parseFloat(this.css(key));
                case "number":
                    val += "px";
                case STR_string:
                    return arrayEach(this, function(tar) {
                        $(tar).css(key, val);
                    });
            }
        },
        height: function(val) {
            //@use---$.fn._wh
            return this._wh("height", val);
        },
        width: function(val) {
            //@use---$.fn._wh
            return this._wh("width", val);
        },
        innerHeight: function() {
            return this[0].clientHeight;
        },
        innerWidth: function() {
            return this[0].clientWidth;
        },
        outerHeight: function() {
            return this[0].offsetHeight;
        },
        outerWidth: function() {
            return this[0].offsetWidth;
        },
        attr: function(name, value) {
            var _this = this;
            switch (getType(name)) {
                case STR_string:
                    if (value === UNDEFINED) {
                        var tar = _this[0];
                        return tar.getAttribute && tar.getAttribute(name);
                    } else {
                        arrayEach(_this, function(tar) {
                            tar.setAttribute && tar.setAttribute(name, value);
                        });
                    }
                    break;
                case STR_object:
                    objEach(name, function(k, v) {
                        arrayEach(_this, function(tar) {
                            tar.setAttribute && tar.setAttribute(k, v);
                        });
                    });
                    break
            }
            return _this;
        },
        removeAttr: function(name) {
            return arrayEach(this, function(tar) {
                tar.removeAttribute(name);
            });
        },
        prop: function(name, value) {
            switch (getType(name)) {
                case STR_string:
                    if (value === UNDEFINED) {
                        var tar = this[0];
                        if (!tar) {
                            return UNDEFINED;
                        }
                        return tar[name];
                    } else if (getType(value) === STR_function) {
                        arrayEach(this, function(e, i) {
                            var revalue = value.call(e, i, e[name]);
                            (revalue != UNDEFINED) && (e[name] = revalue);
                        });
                    } else {
                        arrayEach(this, function(e) {
                            e[name] = value;
                        });
                    }
                    break;
                case STR_object:
                    arrayEach(this, function(e) {
                        objEach(name, function(k, v) {
                            e[k] = v;
                        });
                    });
            }
            return this;
        },
        removeProp: function(name) {
            return arrayEach(this, function(e) {
                // if (e instanceof EventTarget && name in e.cloneNode()) {
                if (e.nodeType && name in e.cloneNode()) {
                    e[name] = "";
                } else {
                    delete e[name];
                }
            });
        },
        html: function(val) {
            //@use---$.fn.prop
            if (val instanceof smartJQ) {
                //市面上有好多插件使用不规范写法，下面针对不规范写法做兼容，有需要以后会去除掉
                arrayEach(this, function(e) {
                    e.innerHTML = "";
                    e.appendChild(val[0]);
                });
            } else {
                return this.prop('innerHTML', val);
            }
        },
        text: function(val) {
            //@use---$.fn.prop
            return this.prop('innerText', val);
        },
        val: function(vals) {
            //@use---$.fn.prop
            switch (getType(vals)) {
                case STR_string:
                    vals = [vals];
                case "array":
                    var mapvals = function(option) {
                        arrayEach(vals, function(val) {
                            var bool = false;
                            if (option.value === val) {
                                bool = true;
                            }
                            if ("selected" in option) {
                                option.selected = bool;
                            } else if ("checked" in option && (option.type === "checkbox" || option.type === "radio")) {
                                option.checked = bool;
                            } else {
                                option.value = val;
                            }
                            if (bool) {
                                return false;
                            }
                        });
                    };
                    arrayEach(this, function(ele, i) {
                        if (0 in ele) {
                            arrayEach(ele, function(option, i) {
                                mapvals(option);
                            });
                        } else {
                            mapvals(ele);
                        }
                    });
                    mapvals = null;
                    return this;
                case STR_undefined:
                    var tar = this[0];
                    if (!tar) {
                        return;
                    }
                    if (tar.multiple) {
                        var rearr = [];
                        arrayEach(tar, function(e) {
                            (e.selected || e.checked) && rearr.push(e.value);
                        });
                        return rearr;
                    }
                default:
                    return this.prop('value', vals);

            }
        },
        addClass: function(name) {
            return arrayEach(this, function(e) {
                e.classList.add(name);
            });
        },
        removeClass: function(name) {
            return arrayEach(this, function(e) {
                e.classList.remove(name);
            });
        },
        toggleClass: function(name) {
            return arrayEach(this, function(e) {
                e.classList.toggle(name);
            });
        },
        hasClass: function(name) {
            var tar = this[0];
            return tar ? makeArray(tar.classList).indexOf(name) > -1 : false;
        },
        //添加元素公用的方法
        _ec: function(ele, targets, func) {
            // targets = $(targets);
            var ele_type = getType(ele);
            if (ele_type === "string") {
                ele = transToEles(ele);
            } else if (ele instanceof Element) {
                ele = [ele];
            } else if (ele_type === STR_function) {
                arrayEach(targets, function(tar, i) {
                    var reobj = ele.call(tar, i, tar.innerHTML);
                    if (getType(reobj) === STR_string) {
                        reobj = transToEles(reobj);
                        arrayEach(reobj, function(e) {
                            func(e, tar);
                        });
                    };
                });
                return;
            }

            //最后的id
            var lastid = targets.length - 1;

            arrayEach(targets, function(tar, i) {
                arrayEach(ele, function(e) {
                    if (i === lastid) {
                        func(e, tar);
                    } else {
                        func(e.cloneNode(true), tar);
                    }
                });
            });
        },
        //元素操作
        append: function(ele) {
            //@use---$.fn._ec
            //判断类型
            prototypeObj._ec(ele, this, function(e, tar) {
                tar.appendChild(e);
            });
            return this;
        },
        appendTo: function(tars) {
            //@use---$.fn.append
            this.append.call($(tars), this);
            return this;
        },
        prepend: function(ele) {
            //@use---$.fn._ec
            prototypeObj._ec(ele, this, function(e, tar) {
                tar.insertBefore(e, tar.firstChild);
            });
            return this;
        },
        prependTo: function(tars) {
            //@use---$.fn.prepend
            this.prepend.call($(tars), this);
            return this;
        },
        after: function(ele) {
            //@use---$.fn._ec
            prototypeObj._ec(ele, this, function(e, tar) {
                var parnode = tar.parentNode;
                if (parnode.lastChild === tar) {
                    parnode.appendChild(e);
                } else {
                    parnode.insertBefore(e, tar.nextSibling);
                }
            });
            return this;
        },
        insertAfter: function(tars) {
            //@use---$.fn.after
            this.after.call($(tars), this);
            return this;
        },
        before: function(ele) {
            //@use---$.fn._ec
            prototypeObj._ec(ele, this, function(e, tar) {
                tar.parentNode.insertBefore(e, tar);
            });
            return this;
        },
        insertBefore: function(tars) {
            //@use---$.fn.before
            this.before.call($(tars), this);
            return this;
        },
        replaceWith: function(newContent) {
            //@use---$.fn.before
            return this.before(newContent).remove();
        },
        replaceAll: function(tar) {
            //@use---$.fn.replaceWith
            tar = $(tar);
            tar.replaceWith(this);
            return this;
        },
        wrap: function(val) {
            //@use---$.fn._ec
            prototypeObj._ec(val, this, function(e, tar) {
                tar.parentNode.insertBefore(e, tar);
                e.appendChild(tar);
            });
            return this;
        },
        unwrap: function() {
            //@use---$.fn.parent
            //@use---$.fn.after
            //@use---$.fn.remove
            var arr = [];
            arrayEach(this, function(e) {
                var par = $(e).parent();
                par.after(e);
                if (arr.indexOf(par[0]) === -1) {
                    arr.push(par[0]);
                }
            });
            $(arr).remove();
            return this;
        },
        wrapAll: function(val) {
            //@use---$.fn.before
            //@use---$.fn.append
            //在第一个前面添加该元素
            if (this[0]) {
                $(this[0]).before(val = $(val));
                arrayEach(this, function(e) {
                    val.append(e);
                });
            }
            return this;
        },
        wrapInner: function(val) {
            //@use---$.fn._ec
            prototypeObj._ec(val, this, function(e, tar) {
                arrayEach(tar.childNodes, function(e2) {
                    e.appendChild(e2);
                });
                tar.appendChild(e);
            });
        },
        empty: function() {
            return arrayEach(this, function(e) {
                e.innerHTML = "";
            });
        },
        remove: function(expr) {
            arrayEach(this, function(e) {
                if (expr) {
                    if (!judgeEle(e, expr)) return;
                }
                e.parentNode.removeChild(e);
            });
        },
        offsetParent: function() {
            var arr = [];
            arrayEach(this, function(e) {
                arr.push(e.offsetParent || DOCUMENT.body);
            });
            return $(arr);
        },
        children: function(expr) {
            var eles = [];
            arrayEach(this, function(e) {
                e.nodeType && arrayEach(e.children, function(e) {
                    if (expr) {
                        judgeEle(e, expr) && eles.push(e);
                    } else {
                        eles.push(e);
                    }
                });
            });
            return $(eles);
        },
        get: function(index) {
            return this[index] || makeArray(this);
        },
        map: function(callback) {
            var arr = [];
            arrayEach(this, function(e, i) {
                var resulte = callback.call(e, i, e);
                (resulte != UNDEFINED) && arr.push(resulte);
            });
            return $(arr);
        },
        slice: function(start, end) {
            return $([].slice.call(this, start, end));
        },
        eq: function(i) {
            //@use---$.fn.slice
            return this.slice(i, i + 1 || UNDEFINED);
        },
        first: function() {
            //@use---$.fn.eq
            return this.eq(0);
        },
        last: function() {
            //@use---$.fn.eq
            return this.eq(-1);
        },
        filter: function(expr) {
            var arr = [];
            switch (getType(expr)) {
                case STR_string:
                    arrayEach(this, function(e) {
                        if (judgeEle(e, expr)) {
                            arr.push(e);
                        }
                    });
                    break;
                case STR_function:
                    arrayEach(this, function(e, i) {
                        var result = expr.call(e, i, e);
                        if (result) {
                            arr.push(e);
                        }
                    });
                    break;
                default:
                    if (expr instanceof smartJQ) {
                        arrayEach(this, function(e) {
                            arrayEach(expr, function(tar) {
                                (e === tar) && arr.push(e);
                            });
                        });
                    } else if (expr.nodeType) {
                        arrayEach(this, function(e) {
                            (e === expr) && arr.push(e);
                        });
                    }
            }
            return $(arr);
        },
        not: function(expr) {
            //@use---$.fn.filter
            return this.filter(function(i, e) {
                return !judgeEle(e, expr);
            });
        },
        is: function(expr) {
            //@use---$.fn.filter
            var tars = this.filter(expr);
            return !!tars.length;
        },
        _np: function(expr, key) {
            var arr = [];
            arrayEach(this, function(tar) {
                tar = tar[key];
                if (!tar || arr.indexOf(tar) != -1 || (expr && !judgeEle(tar, expr))) {
                    return;
                }
                arr.push(tar);
            });
            return $(arr);
        },
        next: function(expr) {
            //@use---$.fn._np
            return this._np(expr, "nextElementSibling");
        },
        prev: function(expr) {
            //@use---$.fn._np
            return this._np(expr, "previousElementSibling");
        },
        parent: function(expr) {
            //@use---$.fn._np
            return this._np(expr, "parentNode");
        },
        _nu: function(key, filter, lastExpr) {
            var arr = [];
            var getEle = function(tar) {
                var nextEle = tar[key];
                if (nextEle) {
                    if (lastExpr) {
                        if ((getType(lastExpr) === STR_string && judgeEle(nextEle, lastExpr)) || lastExpr === nextEle || (lastExpr instanceof Array && lastExpr.indexOf(nextEle) > -1)) {
                            return;
                        }
                    }
                    if ((!filter || judgeEle(nextEle, filter)) && arr.indexOf(nextEle) === -1) {
                        arr.push(nextEle);
                    }
                    getEle(nextEle);
                }
            };
            arrayEach(this, function(tar) {
                getEle(tar);
            });
            getEle = null;
            return $(arr);
        },
        nextUntil: function(lastExpr, filter) {
            //@use---$.fn._nu
            return this._nu('nextElementSibling', filter, lastExpr);
        },
        prevUntil: function(lastExpr, filter) {
            //@use---$.fn._nu
            return this._nu('previousElementSibling', filter, lastExpr);
        },
        parentsUntil: function(lastExpr, filter) {
            //@use---$.fn._nu
            return this._nu('parentNode', filter, lastExpr);
        },
        nextAll: function(filter) {
            //@use---$.fn._nu
            return this._nu('nextElementSibling', filter);
        },
        prevAll: function(filter) {
            //@use---$.fn._nu
            return this._nu('previousElementSibling', filter);
        },
        parents: function(filter) {
            //@use---$.fn._nu
            return this._nu('parentNode', filter, DOCUMENT);
        },
        closest: function(selector, context) {
            //@use---$.fn.parentsUntil
            //@use---$.fn.parent
            var parentEles = $(selector).parent();
            context && parentEles.push(context);
            return this.parentsUntil(parentEles, selector);
        },
        siblings: function(expr) {
            //@use---$.fn.parent
            //@use---$.fn.children
            //@use---$.fn.map
            var _this = this;
            return this.parent().children(expr).map(function() {
                if (_this.indexOf(this) === -1) return this
            });
        },
        find: function(arg) {
            //@use---$.fn.parentsUntil
            var eles = [];
            if (getType(arg) === STR_string) {
                arrayEach(this, function(e) {
                    var arr = findEles(e, arg);
                    arrayEach(arr, function(e) {
                        if (eles.indexOf(e) === -1) {
                            eles.push(e);
                        }
                    });
                });
            } else if (arg instanceof smartJQ || arg.nodeType) {
                arg.nodeType && (arg = [arg]);
                var $this = this;
                arrayEach(arg, function(tar) {
                    var lastele = [].pop.call($(tar).parentsUntil($this));
                    if (lastele != DOCUMENT) {
                        eles.push(lastele);
                    }
                });
            }
            return $(eles);
        },
        has: function(expr) {
            //@use---$.fn.find
            var arr = [];
            arrayEach(this, function(tar) {
                if (0 in $(tar).find(expr)) {
                    arr.push(tar);
                }
            });
            return $(arr);
        },
        each: function(func) {
            return arrayEach(this, function(e, i) {
                func.call(e, i, e);
            });
        },
        index: function(ele) {
            var owner, tar;
            if (!ele) {
                tar = this[0];
                owner = makeArray(tar.parentNode.children);
            } else if (ele.nodeType) {
                tar = ele;
                owner = this;
            } else if (ele instanceof smartJQ) {
                tar = ele[0];
                owner = this;
            } else if (getType(ele) === STR_string) {
                tar = this[0];
                owner = $(ele);
            }
            return owner.indexOf(tar);
        },
        hide: function() {
            return arrayEach(this, function(e) {
                e.style['display'] = "none";
            });
            // return this;
        },
        show: function() {
            return arrayEach(this, function(e) {
                e.style['display'] = "";
            });
            // return this;
        },
        //获取制定对象数据的方法
        _ge: function(obj, keyname) {
            obj[keyname] || Object.defineProperty(obj, keyname, {
                configurable: true,
                writable: true,
                value: {}
            });
            return obj[keyname];
        },
        data: function(name, value) {
            //@use---$.fn._ge
            var smartData;
            switch (getType(name)) {
                case STR_string:
                    if (value === UNDEFINED) {
                        var tar = this[0];
                        if (!tar) {
                            return;
                        }
                        smartData = prototypeObj._ge(tar, SMARTKEY);

                        return smartData[name] || (tar.dataset && tar.dataset[name]) || tar.getAttribute('data-' + name);
                    } else {
                        arrayEach(this, function(tar) {
                            smartData = prototypeObj._ge(tar, SMARTKEY);
                            smartData[name] = value;
                        });
                    }
                    break;
                case STR_object:
                    arrayEach(this, function(tar) {
                        smartData = prototypeObj._ge(tar, SMARTKEY);
                        objEach(name, function(name, value) {
                            smartData[name] = value;
                        });
                    });
                    break;
                case STR_undefined:
                    var tar = this[0];
                    smartData = tar[SMARTKEY] || {};
                    return extend({}, tar.dataset, smartData);
            }
            return this;
        },
        removeData: function(name) {
            return arrayEach(this, function(tar) {
                var smartData = prototypeObj._ge(tar, SMARTKEY);
                delete smartData[name];
            });
        },
        //smartEvent事件触发器
        _tr: function(ele, eventName, newEventObject, triggerData) {
            //@use---$.fn.parents
            var smartEventData = ele[SMARTEVENTKEY];
            if (!smartEventData) return

            var smartEventObjs = smartEventData[eventName];

            var newArr = [];
            smartEventObjs && arrayEach(smartEventObjs, function(handleObj, i) {
                //设置事件对象
                var currentTarget = newEventObject.delegateTarget = ele;

                //是否可以call
                var cancall = 1;

                var delegateFilter = handleObj.s;
                if (delegateFilter) {
                    var targetEle = newEventObject.target,
                        tarparent = $(targetEle).parents(delegateFilter);

                    if (0 in tarparent) {
                        currentTarget = tarparent[0];
                    } else if (judgeEle(targetEle, delegateFilter)) {
                        currentTarget = targetEle;
                    } else {
                        cancall = 0;
                    }
                }

                if (cancall) {
                    //设置事件名
                    newEventObject.type = eventName;

                    //设置数据
                    newEventObject.data = handleObj.d;
                    newEventObject.currentTarget = currentTarget;
                    newEventObject.target || (newEventObject.target = ele);

                    //运行事件函数
                    var f = handleObj.f.bind(currentTarget);
                    triggerData ? f(newEventObject, triggerData) : f(newEventObject);

                    //判断是否阻止事件继续运行下去
                    if (newEventObject._ips) {
                        return false;
                    }
                }

                if (!handleObj.o) {
                    newArr.push(handleObj);
                }
            });
            if (!(0 in newArr)) {
                delete smartEventData[eventName];
            } else {
                smartEventData[eventName] = newArr;
            }
            smartEventObjs = null;
        },
        //注册事件
        on: function(arg1, arg2, arg3, arg4, isOne) {
            //@use---$.fn._tr
            //@use---$.fn._ge
            //@use---$.Event
            var selectors, data, _this = this;

            if (getType(arg1) === STR_object) {
                if (getType(arg2) === STR_string) {
                    selectors = arg2;
                    data = arg3;
                } else {
                    data = arg2;
                }
                objEach(arg1, function(eventName, callback) {
                    _this.on(eventName, selectors, data, callback);
                });
                return;
            }

            var callback, eventArr = arg1.split(" ");

            //判断第二个参数是否字符串，是的话就是目标
            switch (getType(arg2)) {
                case "asyncfunction":
                case STR_function:
                    callback = arg2;
                    break;
                case STR_string:
                    selectors = arg2;
                    if (getType(arg3) === STR_function) {
                        callback = arg3;
                    } else {
                        data = arg3;
                        callback = arg4;
                    }
                    break;
                default:
                    data = arg2;
                    callback = arg3;
                    break;
            }

            arrayEach(eventArr, function(eventName) {
                //判断空
                if (!eventName) return;

                arrayEach(_this, function(tar) {
                    //事件寄宿对象
                    var smartEventData = prototypeObj._ge(tar, SMARTEVENTKEY);
                    var smartEventObj = smartEventData[eventName];

                    if (!smartEventObj) {
                        //设定事件对象
                        smartEventObj = (smartEventData[eventName] = []);

                        //属于事件元素的，则绑定事件
                        // if (tar instanceof EventTarget) {
                        if (tar.nodeType) {
                            tar.addEventListener(eventName, function(oriEvent) {
                                prototypeObj._tr(tar, eventName, $.Event(oriEvent));
                            });
                        }
                    }

                    //添加callback
                    smartEventObj.push({
                        //主体funciton
                        f: callback,
                        //数据data
                        d: data,
                        // 是否执行一次
                        o: isOne,
                        // 选择目标
                        s: selectors
                    });
                });
            });
            return this;
        },
        one: function(event, selector, data, callback) {
            //@use---$.fn.on
            return this.on(event, selector, data, callback, 1);
        },
        //触发事件
        trigger: function(eventName, data) {
            //@use---$.fn._tr
            //@use---$.Event
            return arrayEach(this, function(tar) {
                var event = $.Event(eventName);
                //拥有EventTarget的就触发
                // if (tar instanceof EventTarget) {
                if (tar.nodeType) {
                    var eName = event.type;

                    //判断自身是否有该事件触发
                    if (eName in tar && ("on" + eName) in tar) {
                        tar[eName]();
                        return;
                    }
                    //设置target
                    event.target = tar;

                    //手动模拟事件触发
                    var popTriggerEle = function(ele) {
                        prototypeObj._tr(ele, eName, event, data);

                        //没有阻止冒泡就继续往上触发
                        if (!event.cancelBubble) {
                            var parentNode = ele.parentNode;
                            if (parentNode && parentNode != DOCUMENT) { popTriggerEle(parentNode); }
                        }
                    };

                    //点火
                    popTriggerEle(tar);

                    //内存回收
                    popTriggerEle = null;
                } else {
                    //触发自定义事件
                    prototypeObj._tr(tar, eventName, event, data);
                }
            });
        },
        off: function(types, selector, fn) {
            return arrayEach(this, function(ele) {
                var smartEventData = ele[SMARTEVENTKEY];
                if (!smartEventData) return

                if (!types) {
                    for (var k in smartEventData) {
                        delete smartEventData[k];
                    }
                    return;
                }

                var arg2Type = getType(selector);
                arrayEach(types.split(' '), function(eventName) {
                    switch (getType(eventName)) {
                        case STR_string:
                            var smartEventData_eventName = smartEventData[eventName];
                            if (!selector) {
                                // 全部置空
                                arrayEach(smartEventData[eventName], function(e) {
                                    e.o = 1;
                                });
                                delete smartEventData[eventName];
                            } else if (arg2Type === STR_function) {
                                smartEventData[eventName] = smartEventData_eventName.filter(function(e) {
                                    var rdata = 1;
                                    if (e.f === selector) {
                                        rdata = 0;
                                        e.o = 1;
                                    }
                                    return rdata;
                                });
                            } else if (arg2Type === STR_string) {
                                if (!fn) {
                                    smartEventData[eventName] = smartEventData_eventName.filter(function(e) {
                                        var rdata = 1;
                                        if (e.s === selector) {
                                            rdata = 0;
                                            e.o = 1;
                                        }
                                        return rdata;
                                    });
                                } else {
                                    smartEventData[eventName] = smartEventData_eventName.filter(function(e) {
                                        var rdata = 1;
                                        if (e.s === selector && e.f === fn) {
                                            rdata = 0;
                                            e.o = 1;
                                        }
                                        return rdata;
                                    });
                                }
                            }
                            break;
                        case STR_object:
                            var _this;
                            objEach(eventName, function(k, v) {
                                _this.off(k, v);
                            });
                            return;
                    }
                });
            });
        },
        bind: function(event, data, callback) {
            //@use---$.fn.on
            return this.on(event, data, callback);
        },
        unbind: function(event, callback) {
            //@use---$.fn.off
            return this.off(event, callback)
        },
        triggerHandler: function(eventName, data) {
            //@use---$.fn._tr
            //@use---$.Event
            var tar = this[0];
            tar && prototypeObj._tr(tar, eventName, $.Event(eventName), data);
            return this;
        },
        delegate: function(selector, types, data, fn) {
            //@use---$.fn.on
            return this.on(types, selector, data, fn);
        },
        undelegate: function(selector, types, fn) {
            //@use---$.fn.off
            return this.off(types, selector, fn);
        },
        hover: function(fnOver, fnOut) {
            //@use---$.fn.on
            return this.on('mouseenter', fnOver).on('mouseleave', fnOut || fnOver);
        },
        clone: function(isDeep) {
            //@use---$.fn._tr
            //@use---$.Event
            var arr = [];

            //克隆自定义方法和自定义数据
            var mapCloneEvent = function(ele, tarele) {
                var customData = ele[SMARTKEY],
                    eventData = ele[SMARTEVENTKEY];

                if (eventData) {
                    //事件处理
                    objEach(eventData, function(eventName) {
                        tarele.addEventListener(eventName, function(oriEvent) {
                            prototypeObj._tr(tarele, eventName, $.Event(oriEvent));
                        });
                    });
                    tarele[SMARTEVENTKEY] = extend({}, eventData);
                }

                //设定数据
                customData && (tarele[SMARTKEY] = customData);

                //判断是否有children
                var childs = ele.children;
                var tarchild = tarele.children;
                if (childs.length) {
                    arrayEach(childs, function(e, i) {
                        mapCloneEvent(e, tarchild[i]);
                    });
                }
            };

            arrayEach(this, function(e) {
                var cloneEle = e.cloneNode(true);
                isDeep && mapCloneEvent(e, cloneEle);
                arr.push(cloneEle);
            });

            //回收
            mapCloneEvent = null;

            return $(arr);
        },
        add: function(expr, content) {
            var $this = this;
            arrayEach($(expr, content), function(e) {
                if ($this.indexOf(e) === -1) {
                    $this.push(e);
                }
            });
            return $this;
        },
        contents: function() {
            var arr = [];
            arrayEach(this, function(tar) {
                merge(arr, tar.childNodes);
            });
            return $(arr);
        },
        extend: function(obj) {
            extend(prototypeObj, obj);
        }
    });

    extend($, {
        each: function(obj, func) {
            if ("length" in obj && getType(obj) != STR_function) {
                return arrayEach(obj, function(e, i) {
                    func(i, e);
                });
            } else {
                return objEach(obj, func);
            }
        },
        when: function() {
            //函数容器
            var funcArr = [];
            var reobj = {
                then: function(func) {
                    funcArr.push(func);
                }
            };

            //数据容器
            var datas = [];

            //计数器
            var count = 0;

            //完成函数
            var okfun = function() {
                count--;
                if (count) {
                    return;
                }

                arrayEach(funcArr, function(func) {
                    func.apply(window, datas);
                });

                reobj = funcArr = datas = okfun = null;
            };

            var deferreds = makeArray(arguments);
            arrayEach(deferreds, function(e, i) {
                if (e instanceof $.Deferred) {
                    //属于自带deferreds
                    e.done(function(d) {
                        datas[i] = d;
                        okfun();
                    })
                } else if (window.Promise && e instanceof Promise) {
                    //原生Promise
                    e.then(function(d) {
                        datas[i] = d;
                        okfun();
                    });
                } else if (e._tasks) {
                    //拥有_task属性（animate之类的）
                    e._task.push(okfun);
                } else if (typeof e === STR_object) {
                    //自带对象
                    datas[i] = e;
                    setTimeout(okfun, 0);
                } else {
                    return;
                }
                count++;
            });

            return reobj;
        }
    });

    //@set---$.Event---start
    $.Event = function(oriEvent, props) {
        var _this = this;

        if (!(this instanceof $.Event)) {
            return new $.Event(oriEvent, props);
        } else if (oriEvent instanceof $.Event) {
            return oriEvent;
        }

        if (oriEvent && oriEvent.type) {
            //添加相关属性
            arrayEach(['altKey', 'bubbles', 'cancelable', 'changedTouches', 'ctrlKey', 'detail', 'eventPhase', 'metaKey', 'pageX', 'pageY', 'shiftKey', 'view', 'char', 'charCode', 'key', 'keyCode', 'button', 'buttons', 'clientX', 'clientY', 'offsetX', 'offsetY', 'pointerId', 'pointerType', 'relatedTarget', 'screenX', 'screenY', 'target', 'targetTouches', 'timeStamp', 'toElement', 'touches', 'which'], function(e) {
                (oriEvent[e] != UNDEFINED) && (_this[e] = oriEvent[e]);
            });

            //判断是否自定义事件
            _this.originalEvent = oriEvent;
        } else {
            this.type = oriEvent;
            props && extend(this, props);
        }


        this.returnValue = true;
        this.cancelBubble = false;

        _this.timeStamp || (_this.timeStamp = new Date().getTime());
    };
    //主体event对象
    $.Event.prototype = {
        isDefaultPrevented: function() {
            return this.returnValue === false;
        },
        isPropagationStopped: function() {
            return this.cancelBubble;
        },
        isImmediatePropagationStopped: function() {
            return !!this._ips;
        },
        preventDefault: function() {
            var originalEvent = this.originalEvent;
            originalEvent && originalEvent.preventDefault();
            this.returnValue = false;
        },
        stopPropagation: function() {
            var originalEvent = this.originalEvent;
            originalEvent && originalEvent.stopPropagation();
            this.cancelBubble = true;
        },
        stopImmediatePropagation: function() {
            var originalEvent = this.originalEvent;
            originalEvent && originalEvent.stopImmediatePropagation();
            this._ips = true;
        }
    };
    //@set------end

    //@set---$.fn.blur $.fn.focus $.fn.focusin $.fn.focusout $.fn.resize $.fn.scroll $.fn.click $.fn.dblclick $.fn.mousedown $.fn.mouseup $.fn.mousemove $.fn.mouseover $.fn.mouseout $.fn.mouseenter $.fn.mouseleave $.fn.change $.fn.select $.fn.submit $.fn.keydown $.fn.keypress $.fn.keyup $.fn.contextmenu---start
    //@use---$.fn.on
    //@use---$.fn.trigger
    //设置event
    arrayEach("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "), function(e) {
        prototypeObj[e] = function(callback) {
            callback ? this.on(e, callback) : this.trigger(e);
            return this;
        }
    });
    //@set------end

    //动画
    //@set---$.fn.animate $.fn.stop---start
    //获取立方根的方法
    var getCbrt = (function() {
        if (Math.cbrt) {
            return Math.cbrt;
        } else {
            return function(x) {
                var y = Math.pow(Math.abs(x), 1 / 3);
                return x < 0 ? -y : y;
            };
        }
    })();

    //动画函数主体
    prototypeObj.animate = function(prop, arg2, arg3, arg4) {
        var animateTime = 400,
            easing = 'swing',
            callback;
        var _this = this;
        //以下为增强选项
        var delay = 0,
            progress, start, queue = 1;

        //设置 _task array
        _this._tasks || (_this._tasks = []);

        //对齐参数
        switch (getType(arg2)) {
            case "number":
                animateTime = arg2
                if (getType(arg3) === STR_string) {
                    easing = arg3
                    callback = arg4;
                } else {
                    callback = arg3;
                }
                break;
            case STR_string:
                if (/\D/.test(arg2)) {
                    easing = arg2;
                    callback = arg3;
                    break;
                }
                arg2 = parseFloat(arg2);
            case STR_function:
                callback = arg2;
                break;
            case STR_object:
                arg2.duration && (animateTime = arg2.duration);
                arg2.easing && (easing = arg2.easing);
                arg2.complete && (callback = arg2.complete);
                arg2.delay && (delay = arg2.delay);
                arg2.start && (start = arg2.start);
                arg2.progress && (progress = arg2.progress);
                (arg2.queue != UNDEFINED) && (queue = arg2.queue)
                break;
        }

        //获取动画帧的方法
        var getFrame = function(t) {
            //默认就是得到返回的
            return t;
        };
        //判断是否有动画曲线
        if (easing && easing != "linear") {
            //得到坐标点
            var p1x, p1y, p2x, p2y;

            if (/cubic-bezier/.test(easing)) {
                //替换相应字符串
                easing = easing.replace('cubic-bezier(', "").replace(")", "");
                var easingArr = easing.split(',');
                //得到坐标点
                p1x = parseFloat(easingArr[0]);
                p1y = parseFloat(easingArr[1]);
                p2x = parseFloat(easingArr[2]);
                p2y = parseFloat(easingArr[3]);
            } else {
                switch (easing) {
                    case "ease":
                        p1x = 0.25, p1y = 0.1, p2x = 0.25, p2y = 1;
                        break;
                    case "ease-in":
                        p1x = 0.42, p1y = 0, p2x = 1, p2y = 1;
                        break;
                    case "ease-out":
                        p1x = 0, p1y = 0, p2x = 0.58, p2y = 1;
                        break;
                    case "swing":
                    case "ease-in-out":
                        p1x = 0.42, p1y = 0, p2x = 0.58, p2y = 1;
                        break;
                }
            }

            //筛选到最后，使用盛金公式法求解t
            //区间在0-1之间，t绝对不会出现负数或大于1的情况
            getFrame = function(tt) {
                if (tt === 0 || tt === 1) {
                    return tt;
                }
                var a = 1 + 3 * p1x - 3 * p2x;
                var b = 3 * p2x - 6 * p1x;
                var c = 3 * p1x;
                var d = -tt;

                var A = b * b - 3 * a * c;
                var B = b * c - 9 * a * d;
                var C = c * c - 3 * b * d;
                var delta = B * B - 4 * A * C;

                var t;
                if (delta > 0) {
                    var Y1 = A * b + 3 * a * (-B + Math.sqrt(delta)) / 2;
                    var Y2 = A * b + 3 * a * (-B - Math.sqrt(delta)) / 2;

                    //t只会在区间0-1，综合测试后得到的这个0到1区间的值
                    t = (-b - (getCbrt(Y1) + getCbrt(Y2))) / (3 * a);
                } else {
                    var Y = (2 * A * b - 3 * a * B) / (2 * Math.sqrt(A * A * A));
                    var angle = Math.acos(Y) / 3;
                    t = (-b + Math.sqrt(A) * (Math.cos(angle) - Math.sqrt(3) * Math.sin(angle))) / (3 * a);
                }
                var by = Math.pow(t, 3) + (3 * p1y * t * Math.pow(1 - t, 2)) + (3 * p2y * Math.pow(t, 2) * (1 - t));
                return by;
            };
        }

        var animationId;
        var funArr = [];

        var startTime;
        var animeFun = function(timestamp) {
            //记录开始时间
            startTime || (startTime = timestamp);

            //获取进度时间
            var diffTime = timestamp - startTime;

            //当前进度
            var nowPercentage = (diffTime > animateTime ? animateTime : diffTime) / animateTime;
            nowPercentage = getFrame(nowPercentage)
            funArr.forEach(function(e) {
                e(nowPercentage);
            });

            //运行进度函数
            progress && progress(nowPercentage);

            if (diffTime <= animateTime) {
                animationId = requestAnimationFrame(animeFun);
            } else {
                animateEnd(1);
            }
        };

        var animateEnd = function(isEnd) {
            //清除动画
            cancelAnimationFrame(animationId);

            if (isEnd) {
                funArr.forEach(function(e) {
                    e(1);
                });
                callback && callback();
            }

            //内存回收
            callback = funArr = getFrame = animeFun = null;
            delete _this._aEnd;

            //有下一个任务就运行下一个任务
            if (queue) {
                var nextTask = _this._tasks.shift();
                if (nextTask) {
                    nextTask(0);
                } else {
                    delete _this._tasks;
                    delete _this._isRT;
                }
            }
            _this = null;
        };

        var runanime = function() {
            _this._aEnd = animateEnd;

            //添加运行函数
            arrayEach(_this, function(tar) {
                var computeStyleObj = getComputedStyle(tar);
                objEach(prop, function(name, value) {
                    //获取当前值
                    var nowValue = parseFloat(computeStyleObj[name]);

                    if (nowValue) {
                        //修正值
                        value = parseFloat(value);

                        //获取差值
                        var diffVal = value - nowValue;

                        funArr.push(function(p) {
                            //设置当前值
                            tar.style[name] = nowValue + diffVal * p + "px";
                        });
                    } else {
                        nowValue = tar[name];

                        //获取差值
                        var diffVal = value - nowValue;

                        funArr.push(function(p) {
                            //设置当前值
                            tar[name] = nowValue + diffVal * p;
                        });
                    }
                });
            });

            setTimeout(function() {
                start && start();
                animeFun && animeFun(0);
            }, delay);
        };

        if (!_this._isRT || !queue) {
            runanime();
        } else {
            _this._tasks.push(runanime);
        }

        //设置动画进程开始
        _this._isRT = 1;

        return this;
    };

    prototypeObj.stop = function(clearQueue, gotoEnd) {
        if (clearQueue) {
            this._tasks = [];
        }
        var aEndArg = 0;
        gotoEnd && (aEndArg = 1);
        this._aEnd(aEndArg);
    }
})(window);