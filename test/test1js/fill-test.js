(() => {
    let tester = expect(6, 'fill test');

    $.register({
        tag: "tw-item",
        data: {
            v: 0,
            arr: []
        },
        proto: {
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
                border:#00e solid 1px;
            }
            .name{
                color:red;
            }
        </style>
        <div class="name" style="cursor:pointer;user-select:none;" @click.stop="clickName">tw-item</div>
        <div>v => {{v}}</div>
        <div>arr => {{arr.string}}</div>
        <div>{{arr;}}</div>
        <div>
            <div>slot↓</div>
            <slot></slot>
        </div>
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
                    v: 10000
                }, {
                    v: 20000
                }, {
                    v: 30000
                }]
            }, {
                v: 200,
                arr: [5, 6, 7, 8, 9],
                arr2: []
            }],
            c: [{ v2: "v2-1" }, { v2: "v2-2" }]
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

        <template name="t4">
            <tw-item :v="v2">v2 val => {{v2}</tw-item>
        </template>
    
        <template name="t3">
            <div class="t3">
                <div class="t3_id"> {{index}} </div>
                <div> t3.v => {{v}} , $data parent index => {{$data.parent.index}}</div>
                <!-- <input type="number" xv-model="v" /> -->
                <tw-item :#v="v"></tw-item>
            </div>
        </template>
    
        <template name="t2">
            <div class="t2">
                <div class="t2_id"> {{index}} </div>
                <div> value => {{$data}}</div>
            </div>
        </template>
    
        <template name="t1">
            <div class="t1" :vv="v" @click="clickItem($event,$data,$target);">
                <div class="t1_id"> {{index}} </div>
                <div>v => {{v}}</div>
                <div> <input type="number" xv-model="v" @click.stop /> </div>
                <div class="string_con">{{arr.string}}</div>
                <div xv-fill="arr" fill-content="t2"></div>
                <div xv-fill="arr2" fill-content="t3"></div>
                <div xv-fill="arr2" fill-content="tw-item" class="twItemContainer"></div>
                <div>不存在的字段 => {{hahahaha}}</div>
            </div>
        </template>
    
    
        <h3>tw-ele</h3>
        <div>{{a}}</div>
        <div xv-fill="b" fill-content="tw-item" $="fillCon1"></div>
        
        <br><br><br>
        <button @click="b[0].arr.reverse()" id="inBtn">b[0].arr倒序</button>
        <div xv-fill="b" fill-content="t1" $="fillCon2"></div>

        <!-- <div xv-fill="c" fill-content="t4"></div> -->
        `
    });

    let targetEle = $({
        tag: "tw-ele"
    });

    // targetEle.display = "none";

    $("body").push(targetEle);

    nexter(() => {
        tester.ok(targetEle.$shadow.all(".twItemContainer").length == 2, 'length ok 1');
        tester.ok(targetEle.$shadow.all("tw-item").length == 8, 'length ok 2');
        tester.ok(targetEle.$fillCon1[0].$shadow[3].text == "arr => [1,2,3]", "text ok1");
        tester.ok(targetEle.$fillCon2[0].$(".string_con").text == '[1,2,3]', "text ok2");

        targetEle.$shadow.$("#inBtn").ele.click();
    }).nexter(() => {
        tester.ok(targetEle.$fillCon1[0].$shadow[3].text == "arr => [3,2,1]", "text ok3");
        tester.ok(targetEle.$fillCon2[0].$(".string_con").text == '[3,2,1]', "text ok4");
    });
})();