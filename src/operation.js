// 覆盖还原 sv-ele 数据
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

// 还原克隆sv-ele元素成html模式
// 用的都是$fn.find
const reduceCloneSvEle = (elem) => {
    let renderId = elem.attr('sv-render');

    if (renderId) {
        // 清除所有非 sv-content 的 sv-shadow 元素
        elem.find(`[sv-shadow="${renderId}"]:not([sv-content])`).remove();

        // 将剩余的 sv-content 还原回上一级去
        elem.find(`[sv-shadow="${renderId}"][sv-content]`).each((i, e) => {
            // 获取子元素数组
            _$(e).before(e.childNodes).remove();
        });
    }

    // 判断是否有子sv-ele元素，并还原
    let childsSvEle = elem.find('[sv-render]');
    childsSvEle.each((i, e) => {
        reduceCloneSvEle(_$(e));
    });
};

// 修正content的sv-shadow属性
const fixShadowContent = (_this, content) => {
    // 获取content类型
    let contentType = getType(content);

    // 如果自己是影子元素
    if (_this.is('[sv-shadow]')) {
        // 获取shadowId
        let svid = _this.attr('sv-shadow');
        if ((contentType == "string" && content.search('<') > -1)) {
            let contentEle = _$(content)
            contentEle.attr('sv-shadow', svid);
            contentEle.find('*').attr('sv-shadow', svid);
            content = "";
            each(contentEle, (e) => {
                content += e.outerHTML;
            });
        } else
        if (contentType instanceof Element) {
            _$(content).attr('sv-shadow', svid);
        } else if (content instanceof $) {
            _$(Array.from(content)).attr('sv-shadow', svid);
        }
    }
    return content;
}

// 筛选出自身对象
const fixSelfToContent = (_this) => {
    if (_this.is('[sv-render]')) {
        _this = _this.map((i, e) => {
            let re = e;
            let {
                _svData
            } = e;
            while (_svData && _svData.$content) {
                re = _svData.$content[0];
                _svData = re._svData;
            }
            return re;
        });
    }
    return _this;
};

// 将指向$content修正到parent上
// 判断是否带了shadowId的子元素
// const fixContentToParent = (ele, shadowId) => {
//     if (ele.is('[sv-content]')) {
//         ele = ele.map((i, e) => {
//             let re = e;
//             while (re.svParent) {
//                 re = re.svParent;
//             }
//             return re;
//         });
//     }
//     return ele;
// }

// 修正其他节点操控的方法
assign(shearInitPrototype, {
    add(...args) {
        let obj = args[0];
        if (obj instanceof glo.$ && obj.is('sv-shadow')) {
            throw SHADOW_DESCRIPT_CANNOTUSE + 'add';
        }
        return $fn.add.apply(this, args);
    },
    attr(...args) {
        let [aName, aValue] = args;
        if (aValue && this.is('[sv-render]')) {
            this.each((i, e) => {
                let tagname = e.tagName.toLowerCase();
                let tagdata = tagDatabase[tagname];
                if (tagdata) {
                    // 查找attr内是否有他自己
                    if (tagdata.attrs.indexOf(aName) > -1) {
                        e._svData[aName] = aValue;
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
        if (this.is('[sv-shadow]')) {
            throw SHADOW_DESCRIPT_CANNOTUSE + 'clone';
        }
        if (this.svRender) {
            // 获取原先的html
            // shearInitPrototype.html
            let b_html = this.html();

            // 将所有 sv-render 变成 sv-ele
            let temDiv = _$(`<div>${b_html}</div>`);
            // $fn.find
            temDiv.find('[sv-render]').each((i, e) => {
                _$(e).removeAttr('sv-render').attr('sv-ele', "");
            });
            b_html = temDiv.html();

            // 生成当前元素
            let tagname = this[0].tagName.toLowerCase();

            // 生成克隆元素
            let cloneEle = this[0].cloneNode();
            _$(cloneEle).removeAttr('sv-render').attr('sv-ele', "").html(b_html);
            renderEle(cloneEle);
            let tar = createShearObject(cloneEle);

            // 还原数据
            matchCloneData(tar, this);

            // 判断content是否还有sv-ele，渲染内部
            let bRenderEles = _$('[sv-render]:not([sv-shadow])', this);
            if (0 in bRenderEles) {
                let aRenderEles = _$('[sv-render]:not([sv-shadow])', tar);
                // 确认数量匹配
                if (aRenderEles.length == bRenderEles.length) {
                    aRenderEles.each((i, e) => {
                        // 获取对方
                        let referEle = bRenderEles[i];

                        // 确认tag匹配
                        if (referEle.tagName !== e.tagName) {
                            console.warn('cloned sv-ele data does not match');
                            return false;
                        }

                        // 通过匹配
                        matchCloneData(createShearObject(e), createShearObject(referEle));
                    });
                }
            }

            return tar;
        } else {
            let isSvRender = this.is('[sv-render]');
            let hasSvRender = 0 in this.find('[sv-render]');
            if (isSvRender || hasSvRender) {
                // 抽出来
                let tar = _$(Array.from(this));

                // 直接克隆一份
                let cloneEle = tar.clone(...args);

                // 还原克隆元素内的svele
                reduceCloneSvEle(cloneEle);

                // 重新渲染克隆元素
                cloneEle.find('[sv-render]').removeAttr('sv-render').attr('sv-ele', "");
                renderAllSvEle(cloneEle);

                tar.each((i, e) => {
                    if (hasAttr(e, 'sv-render')) {
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
                cloneFun('[sv-render]:not([sv-shadow])');
                cloneFun('[sv-render][sv-shadow]');

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
        // return fixContentToParent($fn.parent.apply(this, args));
        let rearr = this.map((i, e) => {
            let re = e.parentNode;
            while (re.svParent) {
                re = re.svParent;
            }
            return re;
        });
        let reobj = createShear$(new Set(rearr));
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
        let reobj = createShear$(new Set(rearr));
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
        if (pNode.is('[sv-content]')) {
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
    }
});

// 修正影子content
each(['after', 'before', 'wrap', 'wrapAll', 'replaceWith'], kName => {
    let oldFunc = $fn[kName];
    oldFunc && (shearInitPrototype[kName] = function (content) {

        // 继承旧的方法
        oldFunc.call(this, fixShadowContent(this, content));

        renderAllSvEle(this);

        // 返回对象
        return this;
    });
});

// 紧跟after before wrap 步伐
each(['insertAfter', 'insertBefore', 'replaceAll'], kName => {
    let oldFunc = $fn[kName];
    oldFunc && (shearInitPrototype[kName] = function (content) {
        // 影子元素不能做这个操作
        if (this.is('[sv-shadow]')) {
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
        if (this.is('[sv-shadow]')) {
            throw SHADOW_DESCRIPT_CANNOTUSE + kName;
        }

        let $con = _$(content);

        if ($con.is('[sv-shadow]')) {
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
        let reObj = $fn[kName].call(fixSelfToContent(this), expr);

        let svData = (reObj.length == 1) && reObj[0]._svData;

        if (svData) {
            reObj = createShearObject(reObj[0]);
        } else {
            if (this.is('[sv-shadow]')) {
                reObj = filterShadow(reObj, this.attr('sv-shadow'));
            } else {
                // 如果前一级不是sv-shaodw，就去除查找后的带sv-shadow
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
        let tar = reObj[0];
        if (reObj.length === 1 && tar._svData) {
            reObj = createShearObject(tar);
        }
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
        if (!content) {
            let elem = _$(reObj[0]);

            // 判断是否存在 shear控件
            // $fn.find
            if (0 in elem.find('[sv-shadow]')) {
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

            oldFunc.call(fixSelfToContent(this), content);
            
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