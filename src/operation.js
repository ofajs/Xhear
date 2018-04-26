    // 修正其他节点操控的方法
    assign(shearInitPrototype, {
        aaa: "shearjs",
        clone() {

        }
    });

    // 替换旧式方法
    each(['append', 'prepend'], kName => {
        let oldFunc = $fn[kName];
        oldFunc && (shearInitPrototype[kName] = function(content) {
            // 需要返回的对象
            let reObj = this;

            // 判断是否字符串类型
            let contentType = getType(content);

            reObj.each(function(i, e) {
                // 目标元素
                let tar = _$(e);

                // 要添加的内容
                let $con = content;

                // 判断当前是不是svData
                let svData = e._svData;
                if (svData) {
                    tar = svData.$content;
                }
                if (contentType == "string" && content.search('<') > -1) {
                    $con = _$(content);
                } else if (contentType == "function") {
                    $con = _$(content(i));
                }
                renderAllSvEle($con);

                // 执行方法
                oldFunc.call(tar, $con);
            });

            // 返回对象
            return reObj;
        });
    });