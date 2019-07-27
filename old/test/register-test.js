(() => {
    let tester = expect(10, 'register test');
    // let c = $('#c');

    $.register({
        tag: "testinner",
        temp: `
            <div xv-slot="content" class="testinner"></div>
        `
    });

    $.register({
        tag: "testtag",
        temp: `
        <div style="font-size:12px;color:green;margin-top:30px;">Title testtag -------  itext:{{itext}}</div>
        <!-- <div xv-content></div> -->
        <div xv-tar="cbox"></div>
        <testinner xv-ele xv-content></testinner>
        <input type="text" xv-module="itext" style="background-color:transparent;color:#ddd;" />
        `,
        data: {
            aa: "I am aa",
            itext: "haha",
            sobj: {
                val: "I am sdata"
            }
        },
        proto: {
            get inner() {
                return this.que("#c_inner");
            },
            show() {
                console.log('show running');
            }
        },
        watch: {
            itext(e) {
                tester.ok(this.ele == c.ele, "tag ok 2");
            }
        },
        inited() {
            setTimeout(() => {
                tester.ok(this.ele == c.ele, "tag ok 1");
            }, 100);
        },
        attached() {
            // setTimeout(()=>{

            // });
            tester.ok(this.ele.getRootNode() == document, 'attached ok');
        }
    });

    // 制作c
    let outerC = $(`
    <div>
        <testtag id="c" xv-ele>
            <div id="c_inner">I am testtag</div>
        </testtag>
    </div>
    `);
    window.c = outerC.que('#c');

    $("#d").before(outerC);

    // 等渲染完毕
    setTimeout(() => {
        let c = $('#c');
        tester.ok(c.aa == "I am aa", "register data ok");

        // 监听改动
        $('#main').one('update', e => {
            tester.ok(JSON.stringify(e.keys) == "[2,0]", "keys ok");
            // tester.ok(JSON.stringify(e.keys) == "[2]", "keys ok");
            tester.ok(e.modify.key == "aa", 'modify ok');
        });

        c.aa = 'change aa';

        $('#main').one('update', e => {
            tester.ok(JSON.stringify(e.keys) == `[2,0,"sobj"]`, "keys ok 2");
            tester.ok(e.modify.key == "val", 'modify ok 2');
        });

        c.sobj.val = "change sdata";

        // 判断是否有冒泡
        let eFun;
        c.on('update', eFun = e => {
            throw "shadow element can't update this function";
        });

        // 直接设置元素
        c.$cbox[0] = {
            tag: "div",
            text: "haha"
        }

        tester.ok(c.$cbox[0].ele.getAttribute('xv-shadow') == c.ele.getAttribute('xv-render'), "shadow set ok 1");

        // 同步push添加
        c.$cbox.push({
            tag: "div",
            text: "haha2"
        });

        tester.ok(c.$cbox[1].ele.getAttribute('xv-shadow') == c.ele.getAttribute('xv-render'), "shadow set ok 2");

        c.off('update', eFun);
    }, 100);
})();