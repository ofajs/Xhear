(async () => {
    let tester = expect(5, 'fill test with components');

    $.register({
        tag: "fill-item",
        temp: await fetch("/test/test1js/fill-test/fill-item.html").then(e => e.text()),
        data: {
            desc: "I am fill item",
            name: "(empty)",
            childs: [],
            childsTitle: "hasChild"
        }
    });

    $.register({
        tag: "fill-test-one",
        temp: await fetch("/test/test1js/fill-test/fill-test-one.html").then(e => e.text()),
        data: {
            arr: [
                { name: "one" },
                { name: "two" },
                {
                    name: "three",
                    childs: [{
                        name: "three-1"
                    }, {
                        name: "three-2",
                        childs: [{
                            name: "three-2-1"
                        }]
                    }]
                },
                { name: "four" }
            ],
            showtitle: 0
        }
    });

    let ftEle = $("<fill-test-one></fill-test-one>");

    if (!/more-test\.html$/.test(location.pathname)) {
        ftEle.display = "none";
    }

    // 修改排序
    nexter(() => {
        let fitems = ftEle.$shadow.all("fill-item");

        tester.ok(fitems.length === 4, "fill item count ok");
        tester.ok(fitems[2].$shadow.all("fill-item").length === 2, "fill child item count ok");
        tester.ok(fitems[2].$shadow.all("fill-item")[1].$shadow.all("fill-item").length === 1, "fill sun child item count ok");

        ftEle.$shadow.$("#resBtn").ele.click();
    }).nexter(() => {
        let fitems = ftEle.$shadow.all("fill-item");
        tester.ok(fitems[1].$shadow.all("fill-item").length === 2, "after reverse, fill child item count ok");
        tester.ok(fitems[1].$shadow.all("fill-item")[1].$shadow.all("fill-item").length === 1, "after reverse, fill sun child item count ok");
    });

    $("body").push(ftEle);
})();