// 数据所向
$.register({
    tag: "p-option",
    data: {
        selected: 0,
        value: ""
    },
    attrs: ['selected', 'value'],
    temp: `
            <div xv-content></div>
        `,
    inited() {
        if (!this.value) {
            this.value = this.text;
        }
    }
});

$.register({
    tag: "p-selector",
    temp: `
        <div xv-content></div>
        <div class="p_selector_jiao">
        ▾
            <select xv-tar="inSelector" xv-module="value"></select>
        </div>
        `,
    attrs: ['showcount'],
    data: {
        showcount: "auto",
    },
    watch: {
        value(d) {
            // 取消旧的选中
            let selectedEle = this.que('[selected="1"]');
            selectedEle && (selectedEle.selected = 0);

            // 获取相应value的值
            let needSelectedEle = this.seek(`[value=${d.val}]`)[0];
            if (needSelectedEle) {
                needSelectedEle.selected = 1;

                // 判断在不在表层，不在的话放到第一行末尾
                let tempTar = needSelectedEle;
                while (tempTar.position.top > 10) {
                    tempTar = tempTar.prev;
                }

                if (tempTar.ele != needSelectedEle.ele) {
                    tempTar.before(needSelectedEle);
                }
            }
        },
        showcount(d) {
            let {
                val
            } = d;

            if (!/\D/.test(val)) {
                // 纯数字
            } else {
                // 非数字
                switch (val) {
                    case "hide":
                        break;
                    case "auto":
                        break;
                    default:
                        this.showcount = "auto";
                }
            }

        }
    },
    inited() {
        // 点击选项
        this.on("click", e => {
            let {
                target
            } = e;

            let optionEle = target;

            if (!target.is('p-option')) {
                optionEle = target.parentsUntil('p-option');
            }

            // 选中的就别瞎折腾
            if (!optionEle || optionEle.selected == 1) {
                return
            }

            // 新的设置选中值
            this.value = optionEle.value;
        });

        this.$inSelector.on('click', e => {
            // 禁止冒泡
            e.bubble = false;
        });

        // 填充inSelector
        // 修正order
        this.forEach((e, i) => {
            this.$inSelector.push(`<option value="${e.value}">${e.text}</option>`);
        });

        // 监听是否添加东西
        this.on('update', e => {
            if (e.modify.genre == 'arrayMethod') {
                // 清空选项
                this.$inSelector.empty()

                // 重新填充inSelector
                // 重新修正order
                this.forEach((e, i) => {
                    this.$inSelector.push(`<option value="${e.value}">${e.text}</option>`);
                });

                this.$inSelector.ele.value = this.value;
            }
        });

        // 监听改动
        this.watch('[selected=1]', e => {
            let {
                val
            } = e;

            switch (val.length) {
                case 0:
                    this.value = "";
                    break;
                case 1:
                    let tarEle = val[0];
                    this.value = tarEle.value;
                    break;
            }
        });
    }
});