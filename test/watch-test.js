(() => {
    let tester = expect(9, 'watch test');

    $.register({
        tag: "t2",
        temp: `
        <div style="color:red;font-size:10px;">selected:{{selected}}</div>
        <div xv-content style="font-size:12px;"></div>
        `,
        attrs: ['selected'],
        data: {
            selected: 0
        },
        // watch: {
        //     selected(d) {
        //         debugger
        //     }
        // }
    });

    let d = $('#d');

    // 等渲染完毕
    setTimeout(() => {
        window.cloneDObj = $.xdata(d.object);
        cloneDObj.sync(d);

        // watch监听
        d.watch(e => {
            tester.ok(e.modifys.length == 2, 'modifys length ok');
            tester.ok(e.modifys[0].genre == "arrayMethod", 'modifys genre ok 1');
            tester.ok(e.modifys[1].genre == "change", 'modifys genre ok 2');
        });

        // 直接设置多个元素
        d.push({
            tag: "t2",
            xvele: 1,
            text: "t2-1"
        }, {
            tag: "t2",
            xvele: 1,
            0: {
                tag: "t2",
                xvele: 1,
                text: "t2-2-1"
            },
            1: {
                tag: "t2",
                xvele: 1,
                0: {
                    tag: "t2",
                    xvele: 1,
                    text: "t2-2-2-1",
                },
                1: {
                    tag: "t2",
                    xvele: 1,
                    text: "t2-2-2-2",
                }
            }
        }, {
            tag: "t2",
            xvele: 1,
            text: "t2-3"
        });

        // 监听 selected=1 的
        let cid = 0;
        d.watch('[selected=1]', (e) => {
            switch (cid) {
                case 1:
                    tester.ok(e.val.length == 1, "[selected=1] ok 1");
                    tester.ok(e.val[0].ele === d[0].ele, "[selected=1] ok 2");
                    break;
            }
            cid++;
        });

        // 判断是否push成功
        tester.ok(d.length == 3, 'length ok');
        tester.ok(d[1][0].text.trim() == "t2-2-1", 'push ok');

        // 替换元素
        d[0] = {
            tag: "t2",
            xvele: 1,
            text: "change t2-1",
            selected: 1
        };

        tester.ok(d[0].text.trim() == "change t2-1", 'replace ok');

        setTimeout(() => {
            tester.ok(cloneDObj[0].selected == 1, 'sync ok');
        }, 500);

    }, 100);
})();