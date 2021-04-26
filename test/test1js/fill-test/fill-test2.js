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
                        childs: [{
                            name: "three-2-1"
                        }]
                    }]
                },
                { name: "four" }
            ],
        }
    });

    $("body").push("<fill-test-two></fill-test-two>");
})();