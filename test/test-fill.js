(async () => {
    let tester = expect(6, 'fill test');

    $.register({
        tag: "test-fill",
        temp: await fetch("./fill-temp.html").then(e => e.text()),
        data: {
            name: "test-fill",
            arr: [{ name: "a1" }, { name: "a2" }, { name: "a3" }]
        }
    });

    const fele = $("<test-fill></test-fill>");
    window.fele = fele

    $("body").push(fele);
})();