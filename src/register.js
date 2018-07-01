// 原型对象
let XHearFn = Object.create(shearInitPrototype);

// 设置svRender
XHearFn.svRender = !0;

// 合并数据
assign(XHearFn, XDataFn);

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
    let XHear = function () {
        XData.call(this);
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