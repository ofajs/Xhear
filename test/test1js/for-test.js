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
            <div>{{getBB()}}</div>
            <div xv-for="item in arr" style="margin:40px 0;">
                <div>for line </div>
                <div>{{ha}}</div>
                <div style="font-weight:bold;">{{item.val}} - {{item.d}}</div>
                <div xv-show="item.d == 2" style="color:blue;">item.d is 2</div>
            </div>
            <div :haattr="ha" @click.stop="conHa" @submit="no" style="cursor:pointer;">
            {{ha}}
            </div>
            <div xv-show="a === 1">xv-show test</div>
        `,
        ready() {
            setTimeout(() => {
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