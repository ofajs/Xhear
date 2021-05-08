(async () => {
    let tester = expect(5, 'fill test with template');

    $.register({
        tag: "fill-test-two",
        temp: await fetch("/test/test1js/fill-test/fill-test-two.html").then(e => e.text()),
        data: {
            name: "I am fillTestTwo",
            arr: [
                { name: "one" },
                { name: "two" },
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
        }
    });

    $("body").push("<fill-test-two></fill-test-two>");

    nexter(() => {
        $('fill-test-two').arr[2].childs[1].childs.shift();
        $('fill-test-two').arr[2].childs[1].childs.push({
            name: "new add 1"
        }, {
            name: "new add 2"
        });
        $('fill-test-two').arr[2].childs[1].childs[2] = {
            name: "change new add 2"
        }
    }).nexter(() => {
        let testtarget = $("fill-test-two").$shadow.$(`[test-target="1"]`).ele;

        tester.ok(testtarget.children.length == 3, "fill length ok");

        tester.ok(JSON.stringify($(testtarget).all(".dataname").map(e => e.text)) === JSON.stringify(["three-2-2", "new add 1", "change new add 2"]), "dataname is ok");

    });
})();