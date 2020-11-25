(() => {
    let tester = expect(10, 'for test');

    $.register({
        tag: "f-test",
        data: {
            ha: "hahahah",
            a: 1,
            arr0: [2, 4, 6],
            arr: [{
                val: "val 2",
                d: 2,
                childs: [222, 222]
            }, {
                val: "val 40",
                d: 40,
                childs: [444, 444, 444, 444]
            }, {
                val: "val 10",
                d: 10,
                childs: [1010, 1010, 1010]
            }, {
                val: "val 1",
                d: 1,
                childs: [111]
            }]
        },
        proto: {
            conHa() {
                console.log(this.ha);
            },
            getBB() {
                return "bbbbb";
            }
        },
        temp: `
        <style>
        :host{display:block;}
        .test_forline{margin:40px 0;}
        .t2_line{color:red;}
        </style>

        <template name="t1" index-name="idName">
            <div class="test_forline" :aa="val" :d="d">
                <div :bb="val">index:{{idName}} test xv-for line </div>
                <div style="font-weight:bold;">{{val}} - {{d}}</div>
                <div xv-show="d == 2" style="color:blue;">d is 2</div>
                <template is="t2" xv-for="childs" :beforeindex="idName" :beforeval="val"></template>
            </div>
        </template>

        <template name="t2">
            <div>
                <div class="t2_line">{{item}} - beforeindex=>{{beforeindex}} - beforeval=> {{beforeval}}</div>
                <input v-model="beforeval" />
            </div>
        </template>

        <div>{{getBB()}}</div>

        <template is="t1" xv-for="arr"></template>

        <div :hattr="ha" @click.stop="conHa" @submit="no" style="cursor:pointer;">
        {{ha}}
        </div>
        <f-test-item xv-for="arr"></f-test-item>
        <div xv-show="a === 1">xv-show test</div>
        `,
        ready() {
            setTimeout(() => {
                tester.ok(this.$shadow.all(".test_forline").length === 4, "for element count ok => " + this.$shadow.all(".test_forline").length);
                tester.ok(this.$shadow.all(".test_forline")[1].attrs.aa === this.arr[1].val, "for item attr ok1");
                tester.ok(this.$shadow.all(".test_forline")[1][0].attrs.bb === this.arr[1].val, "for item attr ok2");

                // this.arr.splice(1, 1);
                this.arr[1].val = "change val";

                setTimeout(() => {
                    tester.ok(this.$shadow.all(".test_forline")[1].attrs.aa == "change val", "binding val ok");
                    this.arr.sort((a, b) => {
                        return a.d - b.d;
                    });
                    this.arr.splice(-1);
                    this.arr.push({
                        d: 4,
                        val: "val 4",
                        childs: [444, 444, 444, 444]
                    });

                    this.arr.splice(2, 0, {
                        d: 3,
                        val: "val 3",
                        childs: [333, 333, 333]
                    });

                    setTimeout(() => {
                        let arr = this.$shadow.all(".test_forline").map(e => parseInt(e.attrs.d));
                        tester.ok(JSON.stringify(arr) == "[1,2,3,10,4]", "bind sort ok");

                        this.arr[3].d = 0.1;
                        this.arr[3].val = "val 0.1 (change)";
                        this.arr[3].chs = [0, 0, 0];
                        this.arr.sort((a, b) => {
                            return a.d - b.d;
                        });

                        setTimeout(() => {
                            // 检测数据同步
                            tester.ok(this.arr[0].d === 0.1, "sort succeed");
                            tester.ok(this.$shadow.$("f-test-item").val === "val 0.1 (change)", "data sync to element succeed");
                            tester.ok(this.$shadow.$("f-test-item").$shadow.all("li").length == 3, "element render succeed");
                            tester.ok($("f-test").$shadow.all(".test_forline")[4].all(".t2_line").length === this.arr[4].childs.length, "double fill template is ok");

                            this.$shadow.$("f-test-item").val = "val 0.1(change2)";
                            setTimeout(() => {
                                // 反向同步
                                tester.ok(this.arr[0].val === 'val 0.1(change2)', "element sync to data succeed");

                                // 查看是否同比二级循环
                                this.arr[0].chs[0] = 100;
                            }, 200);
                        }, 300);
                    }, 100);
                }, 300);
            }, 300);
        }
    });

    $.register({
        tag: "f-test-item",
        data: {
            val: "none",
            chs: [0],
            item: "error"
        },
        proto: {
            haha(e, d) {
                console.log(d, e, this);
            }
        },
        temp: `
        <template name="cc">
            <li @click="haha($event,item)">{{item}}</li>
        </template>

        <style>:host{display:block;}</style>
        <div style="color:green;">f-test-item {{val}}</div>
        <div>{{chs.string}}</div>
        <ul>
            <template is="cc" xv-for="chs"></template>
        </ul>
        `
    });

    $("body").push({
        tag: "f-test",
    });
})();