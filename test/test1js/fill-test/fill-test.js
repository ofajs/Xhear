(async () => {
    let tester = expect(9, 'fill test with template');

    $.register({
        tag: "fill-test-one",
        temp: await fetch("/test/test1js/fill-test/fill-test-one.html").then(e => e.text()),
        data: {
            name: "I am fillTestOne",
            arr: [
                { name: "one" },
                { name: "two", counts: [10, 20, 30, 40, 50] },
                {
                    name: "three",
                    childs: [{
                        name: "three-1"
                    }, {
                        name: "three-2",
                        nattr: 1,
                        childs: [{
                            name: "three-2-1"
                        }, {
                            name: "three-2-2"
                        }]
                    }]
                },
                { name: "four" }
            ],
            arr2: [1, 2, 3, 4, 5, 2]
        }
    });
    $("body").push("<fill-test-one></fill-test-one>");

    if (!location.href.includes("more-test.html")) {
        $("fill-test-one").display = "none";
    }

    nexter(() => {
        $('fill-test-one').arr[2].childs[1].childs.shift();
        $('fill-test-one').arr[2].childs[1].childs.push({
            name: "new add 1"
        }, {
            name: "new add 2"
        });
        $('fill-test-one').arr[2].childs[1].childs[2] = {
            name: "change new add 2"
        }
    }).nexter(() => {
        let testtarget = $("fill-test-one").$shadow.$(`[test-target="1"]`).ele;
        tester.ok(testtarget.children.length == 3, "fill length ok");
        tester.ok(JSON.stringify($(testtarget).all(".dataname").map(e => e.text)) === JSON.stringify(["three-2-2", "new add 1", "change new add 2"]), "dataname is ok");

        tester.ok($('fill-test-one').$shadow.all('.counts_con').length == 1, "counts con length ok");
        tester.ok(JSON.stringify($('fill-test-one').$shadow.$('.counts_con').map(e => e.attrs.name)) === JSON.stringify(["0_10", "1_20", "2_30", "3_40", "4_50"]), "counts val ok");

        tester.ok($('fill-test-one').$i2Con[0].ele.getAttribute("name") == "0_1", "fill number item ok 1");
        $('fill-test-one').arr2.reverse();
    }).nexter(() => {
        tester.ok($('fill-test-one').$i2Con[0].ele.getAttribute("name") == "0_2", "fill number item ok 2");
    });


    $.register({
        tag: "fill-item",
        temp: `
            <div>
                <span>fill-item => </span>
                <input type="text" x-model="val" />
            </div>
        `,
        data: {
            val: ""
        }
    });


    $.register({
        tag: "fill-test-two",
        temp: `
            <div x-fill="arr use t1" class="f1"></div>
            <template name="t1">
                <fill-item :#val="$data.num"></fill-item>
            </template>
            <br><br>
            <div x-fill="arr2 use t2" class="f2"></div>
            <template name="t2">
                <fill-item :#val="$data"></fill-item>
            </template>
        `,
        data: {
            arr: [{ num: 1 }, { num: 2 }],
            arr2: [1, 2, 3, 4, 5]
        }
    });

    $('body').push(`<fill-test-two></fill-test-two>`);

    if (!location.href.includes("more-test.html")) {
        $("fill-test-two").display = "none";
    }

    $("fill-test-two").arr[0].num = 100;
    $("fill-test-two").arr2.reverse();
    $("fill-test-two").arr2[0] = 500;

    nexter(() => {
        tester.ok($('fill-test-two').$shadow.$(".f1")[0].$shadow.$("input").ele.value == 100, "render object input ok");
        tester.ok($('fill-test-two').$shadow.$(".f2")[0].$shadow.$("input").ele.value == 500, "render number input ok");
        tester.ok(JSON.stringify($('fill-test-two').$shadow.$(".f2").map(e => e.$shadow.$("input").ele.value)) === JSON.stringify(["500", "4", "3", "2", "1"]), "reverse number input ok");
    });

})();