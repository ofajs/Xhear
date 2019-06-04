$.register({
    tag: "input-line",
    temp: `
    <input type="text" class="main_input" xv-tar="mainInput" xv-module="value">
    <div class="bottom_line"></div>
    <div class="tips_text">{{placeholder}}</div>
    <div xv-content></div>
    `,
    data: {
        // 默认istat为空
        istat: "",
        // placeholder值
        placeholder: "Label",
        // 属性值
        value: ""
    },
    attrs: ["istat", "placeholder", "value"],
    watch: {
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