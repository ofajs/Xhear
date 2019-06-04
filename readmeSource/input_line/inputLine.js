$.register({
    tag: "input-line",
    temp: `
    <input type="text" class="main_input" xv-tar="mainInput" xv-module="value">
    <div class="bottom_line"></div>
    <div class="tips_text">{{placeholder}}</div>
    <div class="right_selector">
        <select xv-content xv-module="value"></select>
    </div>
    `,
    data: {
        // 默认istat为空
        istat: "",
        // placeholder值
        placeholder: "Label",
        // 属性值
        value: "",
        // 限制长度
        maxlength: ""
    },
    attrs: ["istat", "placeholder", "value", "maxlength"],
    watch: {
        maxlength(e, val) {
            if (val) {
                this.$mainInput.attr("maxlength", val);
            } else {
                this.$mainInput.removeAttr("maxlength");
            }
        },
        value(e, val) {
            if (val) {
                this.istat = "infocus";
            }
        }
    },
    inited() {
        this.$mainInput.on("focus", e => {
            // mainInput聚焦时，修改istat属性为infocus
            this.istat = "infocus";
        });
        this.$mainInput.on("blur", e => {
            if (!this.value) {
                // mainInput失去焦点时，清空istat
                this.istat = "";
            }
        });
    }
});