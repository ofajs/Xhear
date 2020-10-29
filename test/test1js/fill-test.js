(() => {
    let tester = expect(9, 'fill test');

    $.register({
        tag: "fill-test",
        data: {
            arr: [{
                val: "origin arr one",
                d: 1
            }, {
                val: "origin arr two",
                d: 2
            }, {
                val: "origin arr three",
                d: 3
            }]
        },
        temp: `
        <style>:host:{display:block;}</style>

        <template name="t1">
            <div class="test_forline" :aa="val" :d="d">
                <div style="font-weight:bold;">{{val}} - {{d}}</div>
                <div xv-show="d == 2" style="color:blue;">d is 2</div>
            </div>
        </template>

        <!-- <div xv-fill="arr" fill-content="t1"></div> -->
        <div xv-fill="arr" fill-content="fill-test-item"></div>
        `
    });

    $.register({
        tag: "fill-test-item",
        data: {
            val: "",
            d: ""
        },
        temp: `
            <h5>fill test item d=>{{d}}</h5>
            <div>val => {{val}}</div>
        `
    });

    $("body").push({
        tag: "fill-test",
    });
})();