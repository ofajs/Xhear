xhear.register({
    tag: "stext",
    temp: `
    <input type="text" xv-tar="sInput" class="s_text_input" />
    <div class="s_text_before_bottomline"></div>
    <div class="s_text_bottomline"></div>
    <div class="s_text_dislayer"></div>
    `,
    data: {
        value: "",
        maxlength: "",
        pattern: "",
        ftype: 1
    },
    proto: {
        // 更新状态
        update() {
            // 正则转换
            let pattern = this.pattern && (new RegExp(this.pattern));;

            let itext = this.$sInput.val();

            // 正则匹配
            if (pattern && !pattern.test(itext)) {
                this.ftype = 2;
            } else {
                this.ftype = 1;

                // 确认更新数据
                this.value = itext;
            }
        }
    },
    watch: {
        value(d) {
            this.$sInput.val(d);
            this.update();
        },
        maxlength(d) {
            (d > 0) && this.sInput.attr('maxlength', d);
        }
    },
    attrs: ['maxlength', 'ftype', 'pattern'],
    inited($ele) {
        $ele.$sInput.on('input', e => {
            // 更新数据
            $ele.update();
        });
    }
});