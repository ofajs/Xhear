(() => {
    let tester = expect(7, 'for test');

    $.register({
        tag: "f-test",
        data: {
            ha: "hahahah",
            a: 1,
            arr: [{
                val: "val 1"
            }, {
                val: "val 2"
            }, {
                val: "val 3"
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
            <div xv-for="item in arr">
                <div>for line </div>
                <div>{{ha}}</div>
                <h4>{{item.val}}</h4>
            </div>
            <div :ha="ha" @click="conHa" @submit="no">
            {{ha}}
            </div>
            <div xv-if="a === 1">if test</div>
        `,
        ready() {
            setTimeout(() => {
                // this.arr.splice(1, 1);
                this.arr[1].val = "change val2";
            }, 1000);
        }
    });

    $("body").push({
        tag: "f-test",
    });
})();