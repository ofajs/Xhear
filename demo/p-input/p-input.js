$.register({
    tag: "p-input",
    data: {
        value: null,
        colorInputValue: null,
        mainInputValue: null,
        selectValue: null,
        rangeValue: null,
        min: null,
        max: null,
        type: null,
        step: 1,
        maxlength: null,
        placeholder: ""
    },
    props: ['min', 'max', 'type', 'value', 'step', 'maxlength'],
    attrs: ["placeholder"],
    temp: `
        <div class="range_con">
            <div class="range_line">
                <div class="range_line_inner" xv-tar="rangeLine" style="width:50%;">
                    <div class="range_mark" xv-tar="rangeMark"></div>
                </div>
            </div>
        </div>
        <div class="input_con"><input type="text" xv-tar="mainInput" xv-module="mainInputValue" /></div>
        <div class="p_input_jiao">▾</div>
        <select xv-content xv-module="selectValue"></select>
        <div class="colorMarkBg">
            <div class="color_mark" xv-tar="colorMark">
                <input type="color" xv-tar="colorInput" />
            </div>
        </div>
        <div class="p-input-mask"></div>
        `,
    watch: {
        placeholder(d, val) {
            // if (val) {
            //     this.$colorInput.attr("placeholder", val);
            //     debugger
            // } else {

            // }

            this.$mainInput.attr("placeholder", val);
        },
        // 当前控件的value
        value(d) {
            let {
                val
            } = d;

            switch (this.type) {
                case "select":
                    this.selectValue = val;
                    break;
                case "color":
                    this.colorInputValue = val;
                    this.mainInputValue = val;
                    break;
                case "range":
                    this.rangeValue = val;
                    this.mainInputValue = val;
                    break;
                default:
                    this.mainInputValue = val;
            }
        },
        // 真正Input上的值
        mainInputValue(d) {
            let {
                val
            } = d;

            if (val === null) {
                return;
            }

            switch (this.type) {
                case "select":
                    break;
                default:
                    this.value = val;
            }
        },
        // 颜色选择器的value
        colorInputValue(d) {
            let {
                val
            } = d;

            if (val === null) {
                return;
            }

            if (/#.{6}/.test(val)) {
                this.$colorInput.ele.value = val;
            }

            this.$colorMark.style['background-color'] = val;

            if (this.type == "color") {
                this.value = val;
            }
        },
        // select上的值
        selectValue(d) {
            let {
                val
            } = d;

            if (val === null) {
                return;
            }

            // 设置值
            this.value = val;

            // 显示值是是option text
            let tarOption = this.ele.querySelector(`option[value="${val}"]`);
            if (tarOption) {
                this.mainInputValue = tarOption.innerText;
            } else {
                this.mainInputValue = val;
            }
        },
        // range的值
        rangeValue(d) {
            let {
                val
            } = d;

            if (val === null) {
                return;
            }

            // 转换整数
            val = parseFloat(val);

            if (val == 0 || val) {

                // 设置主容器百分比
                let diffAll = this.max - this.min;
                let diffValue = val - this.min;
                let num = (diffValue / diffAll) * 100;
                if (num > 100) {
                    num = 100;
                } else if (num < 0) {
                    num = 0;
                }
                this.$rangeLine.style.width = num + `%`;

                // 设置值
                this.value = val;
            }
        },
        maxlength(e, val) {
            if (val) {
                this.$mainInput.attr('maxlength', val);
            }
        }
    },
    inited() {
        // 如果发现当前是rang类型，就对range区域进行初始化
        switch (this.type) {
            case "range":
                let diffTotal = this.max - this.min;
                let startX, startValue, parentWidth;
                let moveFun = (e) => {
                    let diffX = e.originalEvent.clientX - startX;

                    // 计算出移动的值
                    let diffPercentage = diffX / parentWidth;
                    let diffValue = diffTotal * diffPercentage;
                    let value = startValue + diffValue;
                    // 去除step部分
                    value = value - (value % parseFloat(this.step));
                    if (value < this.min) {
                        value = this.min;
                    } else if (value > this.max) {
                        value = this.max;
                    }
                    this.rangeValue = value;
                }
                let upFun = (e) => {
                    this.$rangeMark.class.remove('bigit');
                    this.$rangeMark.off('mousemove', moveFun);
                    this.$rangeMark.off('mouseup', upFun);
                    parentWidth = startX = 0;
                }
                this.$rangeMark.on('mousedown', e => {
                    // 计算视觉上的startValue
                    startValue = this.$rangeLine.width / this.$rangeLine.parent.width * diffTotal + parseFloat(this.min);
                    startValue = startValue - (startValue % parseFloat(this.step));

                    startX = e.originalEvent.clientX;
                    parentWidth = this.$rangeLine.parent.width;
                    this.$rangeMark.class.add('bigit');
                    this.$rangeMark.on('mousemove', moveFun);
                    this.$rangeMark.on('mouseup', upFun);
                });
                break;
            case "color":
                this.$colorInput.on("change", (e) => {
                    this.colorInputValue = this.$colorInput.ele.value;
                });
                break;
        }
    }
});