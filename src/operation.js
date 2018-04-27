    // 修正其他节点操控的方法
    assign(shearInitPrototype, {
        aaa: "shearjs",
        eq(index) {
            let old_func = $fn.eq;
        }
    });

    (() => {
        // 判断有没有pushStack
        let { pushStack } = $fn;
        if (pushStack) {
            shearInitPrototype.pushStack = function(...args) {
                return createShear$(pushStack.apply(this, args));
            }
        }
    })();

    // 替换旧式方法---

    // 执行添加元素的方法
    const appendFunc = (elem, content, oldFunc) => {
        // 判断是否字符串类型
        let contentType = getType(content);

        // 要添加的内容
        elem.each((i, e) => {
            // 目标元素
            let tar = _$(e);

            // 是不是影子元素,并且不是sv-content
            let needAddShadow = hasAttr(e, 'sv-shadow') && !hasAttr(e, 'sv-content');

            // 要添加的内容
            let $con = content;

            // 字符串元素
            if (contentType === "string" && content.search('<') > -1) {
                $con = _$(content);
            } else if (contentType == "function") {
                $con = _$(content(i));
            }

            // 非字符串类型
            if (getType($con) !== "string") {
                renderAllSvEle($con);

                // 影子元素的话添加影子属性
                if (needAddShadow) {
                    $con.attr('sv-shadow', "");
                }
            }

            // 判断当前是不是svData
            let svData = e._svData;
            if (svData) {
                tar = svData.$content;
            }

            // 执行方法
            oldFunc.call(tar, $con);
        });
    };

    // append prepend
    each(['append', 'prepend'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function(content) {
            // 需要返回的对象
            let reObj = this;

            appendFunc(reObj, content, oldFunc);

            // 返回对象
            return reObj;
        });
    });

    // html text
    each(['html', 'text'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function(content) {
            // 需要返回的对象
            let reObj = this;

            // 为了获取html来的
            if (!content) {
                let elem = _$(reObj[0]);

                // 判断是否存在 shear控件
                let hasShear = 0 in elem.find('[sv-shadow]');
                if (hasShear) {
                    // 先复制一个出来
                    let cloneElem = _$(elem[0].cloneNode(true));

                    // 清除所有非 sv-content 的 sv-shadow 元素
                    cloneElem.find('[sv-shadow]:not([sv-content])').remove();

                    // 将剩余的 sv-content 还原回上一级去
                    cloneElem.find('[sv-content]').each((i, e) => {
                        // 获取子元素数组
                        _$(e).before(e.childNodes).remove();
                    });

                    // 返回
                    return oldFunc.call(cloneElem);
                } else {
                    return oldFunc.call(elem);
                }
            } else {
                // 需要返回的对象
                let reObj = this;

                // 直接继承
                if (kName == 'text') {
                    reObj.each((i, e) => {
                        let tar = _$(e);
                        let svData = e._svData;
                        if (svData) {
                            tar = svData.$content;
                        }
                        oldFunc.call(tar, content);
                    });
                } else {
                    appendFunc(reObj, content, oldFunc);
                }

                // 返回对象
                return reObj;
            }
        });
    });