(() => {
    let tester = expect(4, 'register watch test');

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

    $("body").push(testele);

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
        }
    });

    let t2ele = $(`<reg-three val="2"></reg-three>`);

    window.t2ele = t2ele;
})();