$.register({
    tag: "f-test",
    data: {
        ha: "hahahah",
        a: 1,
        arr0: [2, 4, 6],
        arr: [{
            val: "val 2",
            d: 2
        }, {
            val: "val 40",
            d: 40,
        }, {
            val: "val 10",
            d: 10,
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
        :host{display:block;}
        .test_forline{margin:40px 0;}
        </style>

        <template name="t1" index-name="idName">
            <div class="test_forline" :aa="val" :d="d">
                <div :bb="val">{{idName}} for line </div>
                <div style="font-weight:bold;">{{val}} - {{d}}</div>
                <div xv-show="d == 2" style="color:blue;">d is 2</div>
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
            debugger
            this.arr.push({
                val: "new",
                d: 100
            });
        }, 500);


        // this.arr.sort((a, b) => {
        //     return a.d - b.d;
        // });

        // setTimeout(() => {
        //     this.arr.sort((a, b) => {
        //         return b.d - a.d;
        //     });
        // }, 100);
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