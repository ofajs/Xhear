(() => {
    let tester = expect(7, 'for test');

    $.register({
        tag: "f-test",
        data: {
            ha: "hahahah",
            a: 1,
            arr: [{
                val: "val 2",
                d: 2
            }, {
                val: "val 3",
                d: 3
            }, {
                val: "val 1",
                d: 1
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
        .test_forline{margin:40px 0;}
        </style>
            <div>{{getBB()}}</div>
            <div xv-for="item in arr" class="test_forline" :aa="item.val">
                <div :bb="item.val">for line </div>
                <div>{{ha}}</div>
                <div style="font-weight:bold;">{{item.val}} - {{item.d}}</div>
                <div xv-show="item.d == 2" style="color:blue;">item.d is 2</div>
            </div>
            <div :hattr="ha" @click.stop="conHa" @submit="no" style="cursor:pointer;">
            {{ha}}
            </div>
            <div xv-show="a === 1">xv-show test</div>
        `,
        ready() {
            setTimeout(() => {
                tester.ok(this.$shadow.all(".test_forline").length === 3, "for element count ok");
                tester.ok(this.$shadow.all(".test_forline")[1].text, "for element count ok");

                // this.arr.splice(1, 1);
                this.arr[1].val = "change val3";

                setTimeout(() => {
                    this.arr.sort((a, b) => {
                        return a.d - b.d;
                    });
                }, 1000);
            }, 1000);
        }
    });

    $("body").push({
        tag: "f-test",
    });
})();