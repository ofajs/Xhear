(async () => {
    let tester = expect(15, 'fill test');

    $.register({
        tag: "test-fill",
        temp: await fetch("./fill-temp.html").then(e => e.text()),
        data: {
            name: "test-fill",
            arr: [
                { name: "a1" },
                { name: "a2" },
                {
                    name: "a3",
                    childs: [
                        { name: "a3-1" },
                        {
                            name: "a3-2",
                            childs: [{
                                name: "a3-2-1"
                            }, {
                                name: "a3-2-2"
                            }]
                        }
                    ]
                },
                { name: "a4" }
            ],
            arr2: [11, 22, 33, 22]
        },
        proto: {
            log(val) {
                console.log(val);
            }
        }
    });

    const fele = $("<test-fill></test-fill>");
    // window.fele = fele

    tester.ok(fele.shadow[1].length === 4, "fill temp ok");
    tester.ok(fele.shadow[1][2].$(".childs").length === 2, "fill sub temp 1 ok");
    tester.ok(fele.shadow[1][2].$(".childs")[1].$(".childs").length === 2, "fill sub temp 2 ok");

    tester.ok(fele.shadow[2].length === 4, "fill length ok 1")
    tester.ok(fele.shadow[2][0].text.replace(/\s/g, "") === '0-11', "render temp text 1 ok");
    tester.ok(fele.shadow[2][3].text.replace(/\s/g, "") === '3-22', "render temp text 2 ok");

    tester.ok(fele.shadow[3].length === 4, "fill length ok 2")
    tester.ok(fele.shadow[3][0].text.replace(/\s/g, "") === '0---test-fill-11', "render temp text 3 ok");
    tester.ok(fele.shadow[3][3].text.replace(/\s/g, "") === '3---test-fill-22', "render temp text 4 ok");


    nexter(() => {
        // 更改数据
        fele.arr2.unshift(999)
        fele.name = "change name";
    }, 500).nexter(() => {
        tester.ok(fele.shadow[2].length === 5, "fill length ok 3")
        tester.ok(fele.shadow[2][0].text.replace(/\s/g, "") === '0-999', "render temp text 5 ok");
        tester.ok(fele.shadow[2][4].text.replace(/\s/g, "") === '4-22', "render temp text 6 ok");

        tester.ok(fele.shadow[3].length === 5, "fill length ok 4")
        tester.ok(fele.shadow[3][0].text.replace(/\s/g, "") === '0---changename-999', "render temp text 7 ok");
        tester.ok(fele.shadow[3][4].text.replace(/\s/g, "") === '4---changename-22', "render temp text 8 ok");
    }, 500);

    $("body").push(fele);
})();