(async () => {
    const tester = expect(4, 'revoke test');

    $.register({
        tag: "t-clear-one",
        temp: `<div>{{d1.val}}</div>`,
        data: {
            d1: {
                val: "I am d1"
            },
            d2: {
                o: {
                    val: "I am d2 o"
                }
            }
        },
        attached() {
            console.log("attached => ", this);
        },
        detached() {
            console.log("detached => ", this);
        }
    });

    let t1 = $(`<t-clear-one></t-clear-one>`);
    let t2 = $(`<t-clear-one></t-clear-one>`);

    t1.attr("target", true);

    t2.d1.val = "change d1";

    t1.d1 = t2.d1;

    // window.t1 = t1;
    // window.t2 = t2;

    tester.ok(t1.d1.owner.size == 2, "owner size ok 1");

    // 尝试回收
    t2.revoke();

    tester.ok(t1.d1.owner.size == 1, "revoke ok 1");

    let xd1 = $.xdata({
        d: {
            val: "I am xdata"
        }
    });

    window.xd1 = xd1;

    $.register({
        tag: "t-clear-two",
        temp: `<t-clear-one :d1="d"></t-clear-one>`,
        data: {
            d: {
                val: "t-clear-two"
            }
        }
    });

    let t3 = $('<t-clear-two></t-clear-two>');

    // xd1.aa = t3;

    t3.d = xd1.d;

    window.t3 = t3;

    // $("body").push(t3);

    $.nextTick(() => {
        tester.ok(xd1.d.owner.size == 3, "owner size ok 2");

        t3.revoke();

        tester.ok(xd1.d.owner.size == 1, "revoke ok 2");
    });
})();