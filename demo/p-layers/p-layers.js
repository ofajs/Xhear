drill.define(async (load) => {
    await load('./p-layers.css');

    // 默认的没什么数据
    let addDatas = {
        newPage: {
            tag: "p-page",
            pname: "pageName",
            xvele: 1,
            0: {
                tag: "p-text",
                pname: "我是标题",
                selected: 1,
                xvele: 1
            }
        },
        ptext: {
            tag: "p-text",
            pname: "我是标题",
            selected: 1,
            xvele: 1
        },
        ppic: {
            tag: "p-pic",
            pname: "图片",
            selected: 1,
            xvele: 1
        }
    };

    const getProps = (data) => {
        // 修正关键属性
        let propsArr = ["pname"];
        propsArr.push(...Object.keys(data));
        propsArr = Array.from(new Set(propsArr));
        propsArr = propsArr.filter(e => {
            if (/\D/.test(e) && e !== "xvele" && e !== "tag") {
                return e;
            }
        });
        return propsArr;
    }

    $.register({
        tag: "p-text",
        data: {
            pname: "",
            selected: 0,
            layerele: ""
        },
        props: getProps(addDatas.ptext),
        attrs: ["selected", "layerele"],
        temp: `
            <div class="p_icon"></div>
            <div class="p_name">{{pname}}</div>
            <div xv-content></div>
            <div class="before_fakeele"></div>
        `,
        watch: {
            intext(d, val) {
                if (val.length > 10) {
                    val = val.slice(0, 10) + "...";
                }
                this.pname = val;
            }
        },
        inited() {
            this.attr('draggable', true);
        }
    });

    $.register({
        tag: "p-pic",
        data: {
            pname: "",
            selected: 0,
            layerele: "",
            picUrl: ""
        },
        props: getProps(addDatas.ppic),
        attrs: ["selected", "layerele"],
        temp: `
            <div class="p_icon">
                <div xv-tar="imgicon"></div>
            </div>
            <div class="p_name">
                <span class="p_name_text" xv-tar="p_name_text">{{pname}}</span>
                <input type="text" class="p_name_input" xv-tar="p_name_input" xv-module="pname" style="display:none;" />
            </div>
            <div xv-content></div>
            <div class="before_fakeele"></div>
        `,
        proto: {
            toEditMode() {
                this.$p_name_input.display = "";
                this.$p_name_text.display = "none";
                this.$p_name_input.ele.focus();
            },
            toNormalMode() {
                this.$p_name_input.display = "none";
                this.$p_name_text.display = "";
            }
        },
        watch: {
            picUrl(d, val) {
                val && (this.$imgicon.style["background-image"] = `url(${val})`);
            }
        },
        inited() {
            this.attr('draggable', true);
        }
    });

    $.register({
        tag: "p-page",
        props: getProps(addDatas.newPage),
        attrs: ["selected", "layerele", "thumbnail"],
        data: {
            pname: "",
            selected: 0,
            layerele: "",
            // 缩略图
            thumbnail: ""
        },
        watch: {
            thumbnail(e, val) {
                if (val) {
                    this.$pageIcon.style['background-image'] = `url(${val})`;
                }
            }
        },
        temp: `
            <div class="ppage_inner">
                <div class="page_icon">
                    <div xv-tar="pageIcon"></div>
                </div>
                <div class="p_name">{{pname}}</div>
                <div class="before_fakeele"></div>
            </div>
            <div class="ppage_jiao"></div>
            <div class="ppage_content" xv-content></div>
            <div class="ppage_jiao_line"></div>
        `,
        inited() {
            this.attr('draggable', true);
        }
    });

    $.register({
        tag: "p-layers",
        data: {
            inselected: 0
        },
        attrs: ["inselected"],
        temp: `
            <div class="p_layers_top" xv-tar="layers_top">
                <div class="p_layers_top_block_first">~</div>
                <div class="p_layers_top_block">page1</div>
                <div class="p_layers_top_block">文本插件</div>
            </div>
            <div xv-content></div>
            <div class="p_layers_bottom">
                <div class="p_layers_bottom_title" xv-tar="addPageBtn">Add <span class="page_text">Page</span></div>
                <div class="p_layers_bottom_block addimgbtn" xv-tar="addimgbtn"></div>
                <div class="p_layers_bottom_block addtextbtn" xv-tar="addtextbtn"></div>
                <div class="p_layers_bottom_block deletebtn" xv-tar="deletebtn"></div>
            </div>
        `,
        proto: {
            removeTipsLine() {
                let tips_line = this.que('.tips_line');
                tips_line && tips_line.remove();
            }
        },
        inited() {
            // 当点击的时候设置selected
            this.on('click', e => {
                let {
                    target
                } = e;

                // 如果点击的是xv-content就取消选中
                if (target.is('[xv-content]')) {
                    let selectedEle = this.seek('[selected=1]')[0];
                    if (selectedEle) {
                        selectedEle.selected = 0;
                    }
                    return;
                }

                if (!target.is('[layerele]')) {
                    target = e.target.parentsUntil('[layerele]');
                }

                // 没有点击东西就别瞎折腾
                if (!target) {
                    return;
                }

                // 已经选中的也别瞎折腾
                if (target.selected) {
                    return;
                }

                // 把旧的取消选中
                let selectedEle = this.seek('[selected=1]')[0];
                if (selectedEle) {
                    selectedEle.selected = 0;
                }

                // 新的设置选中
                target.selected = 1;
            });

            // 获取选中的数据
            this.watch('[selected=1]', watchFun = (e) => {
                let {
                    val
                } = e;

                // 先删除顶部的
                this.$layers_top.queAll('.p_layers_top_block').forEach(e => e.remove());

                switch (val.length) {
                    case 0:
                        // 删除父选中状态
                        var par = this.que('.selected_pager');
                        par && par.class.remove('selected_pager');
                        this.$addimgbtn.class.add('disable');
                        this.$addtextbtn.class.add('disable');
                        this.$deletebtn.class.add('disable');
                        break;
                    case 1:
                        let selectedEle = val[0];

                        // 删除父选中状态
                        var par = this.que('.selected_pager');
                        par && par.class.remove('selected_pager');

                        // 当前添加父选中状态
                        if (!selectedEle.is('p-page')) {
                            par = selectedEle.parentsUntil('p-page');
                        } else {
                            par = selectedEle;
                        }

                        if (par) {
                            // 父层添加选中class
                            par.class.add('selected_pager');
                            (par != selectedEle) && this.$layers_top.push(`<div class="p_layers_top_block">${par.pname}</div>`);
                        }

                        this.$layers_top.push(`<div class="p_layers_top_block">${selectedEle.pname}</div>`);
                        this.$addimgbtn.class.remove('disable');
                        this.$addtextbtn.class.remove('disable');
                        this.$deletebtn.class.remove('disable');
                        break;
                    default:
                        debugger
                }
            });

            let addFunc = (data) => {
                // 获取选中的图层
                let selectedEle = this.que('[selected="1"]');

                if (selectedEle) {
                    // 取消选中
                    selectedEle.selected = 0;

                    // 如果是page就放前面
                    if (selectedEle.is('p-page')) {
                        selectedEle.unshift(data);
                    } else {
                        // 在后面添加新的
                        selectedEle.after(data);
                    }
                } else {
                    this.push(data);
                }
            }

            // 两个新添加按钮
            this.$addimgbtn.on('click', e => {
                if (this.$addimgbtn.class.contains('disable')) {
                    return;
                }
                addFunc(addDatas.ppic);
            });

            this.$addtextbtn.on('click', e => {
                if (this.$addtextbtn.class.contains('disable')) {
                    return;
                }
                addFunc(addDatas.ptext);
            });

            // 删除按钮
            this.$deletebtn.on('click', e => {
                // 获取选中的图层
                let selectedEle = this.que('[selected="1"]');

                // 获取下个元素
                let nextEle = selectedEle.next || selectedEle.prev || selectedEle.parent;

                // 删除自己
                selectedEle.remove();

                // 选中下一个
                nextEle.selected = 1;
            });

            // 拖拽逻辑
            this.on('dragover', e => e.preventDefault());

            // 抓起的元素
            let dragStartEle;
            let startDragIsPage = false;

            this.on('dragstart', e => {
                // 火狐兼容
                e.originalEvent.dataTransfer.setData('Text', 'drag');
                dragStartEle = e.target;

                if (!dragStartEle.is('[layerele]')) {
                    // 换成目标元素
                    dragStartEle = dragStartEle.parentsUntil('[layerele]');
                }

                if (dragStartEle && dragStartEle.is('p-page')) {
                    startDragIsPage = true;
                }

                // 初始添加class
                dragStartEle.class.add('inselected');

                this.inselected = 1;
            });

            this.on('dragenter', e => {
                this.removeTipsLine();

                if (!dragStartEle) {
                    return;
                }

                // 获取对准的元素对象
                let {
                    target
                } = e;

                if (!target.is('[layerele]')) {
                    // 换成目标元素
                    target = target.parentsUntil('[layerele]');
                }

                // 不存在就不瞎折腾
                if (!target) {
                    return;
                }

                if (!startDragIsPage) {
                    if (target.is('p-page')) {
                        target.unshift('<div class="tips_line"></div>');
                    } else {
                        if (e.target.is('.before_fakeele')) {
                            target.before('<div class="tips_line"></div>');
                        } else {
                            // 在元素后面添加提示元素
                            target.after('<div class="tips_line"></div>');
                        }
                    }
                } else {
                    let ppagetar = target;
                    if (!target.is('p-page')) {
                        // 换成目标元素
                        ppagetar = target.parentsUntil('p-page');
                    }

                    if (target.is('p-page') && e.target.is('.before_fakeele')) {
                        ppagetar.before('<div class="tips_line"></div>');
                    } else {
                        // 在元素后面添加提示元素
                        ppagetar.after('<div class="tips_line"></div>');
                    }
                }

                // 如果抓起元素位置跟自身位置一样，也别瞎折腾了
                let {
                    next,
                    prev
                } = dragStartEle;
                if ((prev && prev.is('.tips_line')) || (next && next.is('.tips_line'))) {
                    this.removeTipsLine();
                    return;
                }
            });

            this.on('dragend', e => {
                // 去掉提示线
                this.removeTipsLine();

                // 清空数据
                startDragIsPage = dragenter = null;
                this.inselected = "";
            });

            this.on('drop', e => {
                e.preventDefault();
                dragStartEle.class.remove('inselected');

                // 在提示线后面添加
                let tips_line = this.que('.tips_line');
                if (tips_line) {
                    // tips_line.after(dragStartEle);
                    tips_line.after(dragStartEle.object);
                    dragStartEle.remove();
                }
                this.removeTipsLine();

                // page重修排序id
                if (startDragIsPage) {
                    this.forEach((e, i) => {
                        e.pname = "page" + (i + 1);
                    });
                }
            });

            // 双击标题进入定义标题模式
            this.on('dblclick', e => {
                let {
                    target
                } = e;

                if (target.is('.p_name_text')) {
                    let layerEle = target.parentsUntil('[layerele]');

                    if (layerEle.is('p-pic')) {
                        layerEle.toEditMode();
                    }
                }
            });

            this.on('focusout', e => {
                let {
                    target
                } = e;

                let layerEle = target.parentsUntil('[layerele]');

                layerEle.toNormalMode();
            });

            this.$addPageBtn.on("click", () => {
                let selectedEle = this.que('[selected="1"]');
                selectedEle && (selectedEle.selected = 0);

                // 修正
                let newPage = JSON.parse(JSON.stringify(addDatas.newPage));
                newPage.pname = "page" + (this.length + 1);
                this.push(newPage);
            });
        }
    });
});