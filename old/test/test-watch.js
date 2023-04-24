(() => {
    let tester = expect(10, 'register watch test');

    let count = 0;

    $.register({
        tag: "reg-two",
        temp: `<div>{{d1.val}}</div>`,
        data: {
            d1: {
                val: "I am d1 val"
            }
        },
        watch: {
            d1(d1) {
                if (count === 0) {
                    tester.ok(d1.val == "I am d1 val", "watch ok 1");
                } else if (count === 1) {
                    tester.ok(d1.val == "change val", "watch ok 2");
                }
                count++;
            }
        }
    });

    let testele = $(`<reg-two></reg-two>`);

    // $("body").push(testele);

    tester.ok(testele.shadow[0].text == 'I am d1 val', "render ok 1");

    nexter(() => {
        testele.d1.val = "change val";
    }).nexter(() => {
        tester.ok(testele.shadow[0].text == 'change val', "render ok 2");
    });

    $.register({
        tag: "reg-three",
        attrs: {
            val: "1"
        },
        temp: `
        <div class:a1="val >= 3" class:a2="val >= 4">val</div>
        `
    });

    let t2ele = $(`<reg-three val="2">{{val}}</reg-three>`);

    tester.ok(t2ele.shadow[0].class.length === 0, "class length ok 1");
    tester.ok(t2ele.attr("val") == 2, "attr ok");

    t2ele.val = 3;

    nexter(() => {
        tester.ok(t2ele.shadow[0].class.length === 1, "class length ok 2");
        tester.ok(t2ele.attr("val") == 3, "attr ok");

        t2ele.val = 4;
    }).nexter(() => {
        tester.ok(t2ele.shadow[0].class.length === 2, "class length ok 3");
        tester.ok(t2ele.attr("val") == 4, "attr ok");
     });

    window.t2ele = t2ele;
})();