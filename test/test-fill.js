(async () => {
    let tester = expect(6, 'fill test');

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
    window.fele = fele

    $("body").push(fele);
})();