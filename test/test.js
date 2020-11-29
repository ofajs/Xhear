$.register({
    tag: "tw-item",
    data: {
        v: 0,
        arr: []
    },
    proto: {
        get arrStr() {
            return JSON.stringify(this.arr);
        },
        clickName() {
            this.v++;
        }
    },
    temp: `
    <style>
        :host{
            display:block;
            padding:10px;
            margin:10px;
            border:#0ee solid 1px;
        }
        .name{
            color:red;
        }
    </style>
    <div class="name" style="cursor:pointer;user-select:none;" @click="clickName">tw-item</div>
    <div>v => {{v}}</div>
    <div>arr => {{arr.string}}</div>
    `
});

$.register({
    tag: "tw-ele",
    data: {
        a: "aa",
        b: [{
            v: 100,
            arr: [1, 2, 3],
            arr2: [{
                v: "arr2-1"
            }, {
                v: "arr2-2"
            }, {
                v: "arr2-3"
            }]
        }, {
            v: 200,
            arr: [5, 6, 7, 8, 9],
            arr2: []
        }]
    },
    proto: {
        clickItem(e, data, target) {
            data.v = parseInt(data.v) + 100;
            console.log(e, data, target);
        }
    },
    temp: `
    <style>
        .t1,.t2,.t3{
            margin:10px;
            padding:10px;
            border:#aaa solid 1px;
        }
        .t2{
            border-color:#f0f;
        }
        .t1_id{
            color:green;
        }

        .t2_id{
            color:blue;
        }

        .t3{
            border-color:#0ff;
        }
    </style>

    <template name="t3">
        <div class="t3">
            <div class="t3_id"> {{index}} </div>
            <div> t3.v => {{v}} , parIndex => {{$data.parent.index}}</div>
        </div>
    </template>

    <template name="t2">
        <div class="t2">
            <div class="t2_id"> {{index}} </div>
            <div> value => {{$data}}</div>
        </div>
    </template>

    <template name="t1">
        <div class="t1" :vv="v" @click="clickItem($event,$data,$target)">
            <div class="t1_id"> {{index}} </div>
            <div>v => {{v}}</div>
            <div> <input type="number" xv-model="v" @click.stop /> </div>
            <div>{{arr.string}}</div>
            <div xv-fill="arr" fill-content="t2"></div>
            <div xv-fill="arr2" fill-content="t3" :par-index="index"></div>
        </div>
    </template>


    <h3>tw-ele</h3>
    <div>{{a}}</div>
    <!--  <div xv-fill="b" fill-content="tw-item"></div> -->
    <div xv-fill="b" fill-content="t1"></div>
    `
});

let targetEle = $({
    tag: "tw-ele"
});

$("body").push(targetEle);

// nexter(() => {
//     targetEle.b[1].reverse();
// }).nexter(() => {
//     targetEle.b.reverse();
// });