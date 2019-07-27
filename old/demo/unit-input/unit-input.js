drill.define(async (load) => {
    await load("./unit-input.css");

    $.register({
        tag: "unit-input",
        data: {
            value: "",
            step: 1
        },
        props: ["value", "step"],
        temp: `
        <div class="input_con">
            <input type="number" xv-tar="numInput" xv-module="numInputValue">
        </div>
        <div class="unip_con" xv-tar="unitCon"></div>
        <div xv-content></div>
        `,
        watch: {
            numInputValue(e, val) {
                // 只保留3位小数点
                let parr = String(val).match(/(\d+)\.(\d+)/);

                if (parr && parr.length === 3 && parr[2].length > 3) {
                    val = parseFloat(val).toFixed(3);
                    this.numInputValue = val;
                    return;
                }

                this.value = val + this.$unitCon.text;
            },
            step(e, val) {
                this.$numInput.attr("step", val);
            },
            value(e, val) {
                // 拆分数字和单位
                let arr = /([\d\.\-]+)(\D*)/.exec(val);

                if (arr) {
                    let num = arr[1];
                    let unit = arr[2];

                    this.$unitCon.html = unit;
                    this.numInputValue = num;
                }
            }
        },
        inited() {
            let showTimer, showEle;
            this.$unitCon.on("mouseenter", e => {
                showTimer = setTimeout(() => {
                    // 查找子层是否有相应unit的容器
                    showEle = this.que(`[unit-name="${this.$unitCon.text.trim()}"]`);

                    if (showEle) {
                        showEle.display = "block";
                    }
                }, 500);
            });
            this.$unitCon.on("mouseleave", e => {
                clearTimeout(showTimer);

                if (showEle) {
                    showEle.display = "none";
                    showEle = null;
                }
            });
        }
    });
});