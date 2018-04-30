xhear.register({
    tag: "tcode",
    temp: "<div sv-content></div>",
    attrs: ['lang'],
    data: {
        lang: "javascript",
        code: ""
    },
    val: {
        get() {},
        set(text) {
            let $ele = this;
            let html = '';

            // javascript格式化
            if (this.lang === "javascript") {
                
            }
        }
    },
    render($ele) {
        // 设置代码
        let code = $ele.text();
        $ele.code = code;
    }
})