(async () => {
    let tester = expect(6, 'fill test');

    let twItem = await fetch("/test/test1js/fill-test/tw-item.html");

    $.register({
        tag: "tw-item",
        temp: await twItem.text(),
        data: {
            v: 0,
            arr: []
        },
        proto: {
            clickName() {
                this.v++;
            }
        },
    });

    let twEle = await fetch("/test/test1js/fill-test/tw-ele.html");

    $.register({
        tag: "tw-ele",
        temp: await twEle.text(),
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
                if ("v" in data) {
                    data.v = parseInt(data.v) + 100;
                }
                console.log(e, data, target);
            }
        },
    });

    let targetEle = $({
        tag: "tw-ele"
    });

    if (!/more-test\.html$/.test(location.pathname)) {
        targetEle.display = "none";
    }

    $("body").push(targetEle);

    // nexter(() => {
    //     tester.ok(targetEle.$shadow.all(".twItemContainer").length == 2, 'length ok 1');
    //     tester.ok(targetEle.$shadow.all("tw-item").length == 10, 'length ok 2');
    //     tester.ok(targetEle.$fillCon1[0].$shadow[3].text == "arr => [1,2,3]", "text ok1");
    //     tester.ok(targetEle.$fillCon2[0].$(".string_con").text == '[1,2,3]', "text ok2");

    //     targetEle.$shadow.$("#inBtn").ele.click();
    // }).nexter(() => {
    //     tester.ok(targetEle.$fillCon1[0].$shadow[3].text == "arr => [3,2,1]", "text ok3");
    //     tester.ok(targetEle.$fillCon2[0].$(".string_con").text == '[3,2,1]', "text ok4");
    // });
})();