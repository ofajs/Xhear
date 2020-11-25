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
            arr: [1, 2, 3]
        }, {
            v: 200,
            arr: [5, 6, 7, 8, 9]
        }]
    },
    proto: {
        clickItem(item, data) {
            console.log(this, data, item);

            data.v += 100;
        }
    },
    temp: `
    <style>
        .t1,.t2{
            margin:10px;
            padding:10px;
            border:#aaa solid 1px;
        }
        .t2{
            border-color:#fff;
        }
        .t1_id{
            color:green;
        }

        .t2_id{
            color:blue;
        }
    </style>

    <template name="t2">
        <div class="t2">
            <div class="t2_id"> {{index}} </div>
            <div> value => {{item}}</div>
        </div>
    </template>

    <template name="t1">
        <div class="t1" :vv="v" @click="clickItem(111,$data)">
            <div class="t1_id"> {{index}} </div>
            <div>v => {{v}}</div>
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