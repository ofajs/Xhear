(() => {
    var tester = expect(1, 'xdata test');

    let d1 = $.xdata({
        a: "I am a",
        b: "I am b"
    });

    tester.ok(d1.a === "I am a", "get value ok");

    console.log(d1);
})();