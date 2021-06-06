// 获取所有符合表达式的可渲染的元素
const getCanRenderEles = (root, expr) => {
    return Array.from(root.querySelectorAll(expr));
}

// 去除原元素并添加定位textNode
const postionNode = e => {
    let textnode = document.createTextNode("");
    let parent = e.parentNode;
    parent.insertBefore(textnode, e);
    parent.removeChild(e);

    return {
        textnode, parent
    };
}

// 将表达式转换为函数
const exprToFunc = expr => {
    return new Function("...args", `
        const [$event] = args;
        const {$host,$data} = this;
        
        with($host){
            return ${expr};
        }
    `);
}

const regIsFuncExpr = /[\(\)\;\.\=\>\<]/;

// 渲染组件的逻辑
// host 主体组件元素；存放方法的主体
// xdata 渲染目标数据；单层渲染下是host，x-fill模式下是具体的数据
// content 渲染目标元素
const renderTemp = ({ host, xdata, content }) => {
    // 事件绑定
    getCanRenderEles(content, "[x-on]").forEach(target => {
        let eventInfo = JSON.parse(target.getAttribute("x-on"));

        let eids = [];

        Object.keys(eventInfo).forEach(eventName => {
            let { name } = eventInfo[eventName];

            let eid;

            // 判断是否函数
            if (regIsFuncExpr.test(name)) {
                // 函数绑定
                const func = exprToFunc(name);
                eid = host.on(eventName, (event) => {
                    func.call({ $host: host }, event);
                });
            } else {
                // 函数名绑定
                eid = host.on(eventName, (event) => {
                    host[name] && host[name].call(host, event);
                });
            }

            eids.push(eid);
        });

        target.setAttribute("rendered-on", JSON.stringify(eids));
    });

    // 表达式到值的设置
    const exprToSet = (expr, callback) => {
        // 即时运行的判断函数
        let runFunc;

        if (regIsFuncExpr.test(expr)) {
            // 属于函数
            runFunc = exprToFunc(expr).bind({
                $host: host
            });
        } else {
            // 值变动
            runFunc = () => xdata[expr];
        }

        // 备份值
        let backup_val = runFunc();

        // 直接先运行渲染函数
        callback(backup_val);

        xdata.watchTick(() => {
            const val = runFunc();

            if (backup_val !== val) {
                callback(val);
                backup_val = val;
            }
        });
    }

    // 文本渲染
    getCanRenderEles(content, "x-span").forEach(ele => {
        // 定位文本元素
        let { textnode, parent } = postionNode(ele);

        const textEle = document.createElement("span");
        parent.insertBefore(textEle, textnode);

        exprToSet(ele.getAttribute('xvkey'), val => {
            textEle.textContent = val;
        });
    });

    // 属性绑定
    getCanRenderEles(content, "[x-bind]").forEach(ele => {
        const bindData = JSON.parse(ele.getAttribute('x-bind'));

        Object.keys(bindData).forEach(attrName => {
            exprToSet(bindData[attrName], val => {
                ele.setAttribute(attrName, val);
            });
        })
    });

    // if元素渲染
    getCanRenderEles(content, '[x-if]').forEach(ele => {
        const expr = ele.getAttribute('x-if');

        // 定位文本元素
        let { textnode, parent } = postionNode(ele);

        // 生成的目标元素
        let targetEle;

        exprToSet(expr, val => {
            if (val) {
                // 添加元素
                let new_ele = $(ele.content.children[0].outerHTML);
                debugger
            } else if (targetEle) {
                // 删除元素
                targetEle.parentNode.removeChild(targetEle);
            }
        });
    });
}