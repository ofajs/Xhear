(() => {
    var tester = expect(7, 'xdata test');

    let d1 = $.xdata({
        a: "I am a",
        b: "I am b"
    });

    tester.ok(d1.a === "I am a", "get value ok");

    d1.watch('a', (val, oldVal) => {
        tester.ok(val === "change a", "watch val ok");
        tester.ok(oldVal === "I am a", "watch oldVal ok");
    });

    // 观察
    d1.observe(e => {
        tester.ok(e.name === "a", 'key ok');
        tester.ok(e.oldVal === "I am a", 'oldVal ok');
        tester.ok(e.val === "change a", 'val ok');
        tester.ok(e.type === "update", 'type ok');
    });

    // 设置值
    d1.a = "change a";

    // 重复设置同样的值不会被触发
    d1.a = "change a";

    console.log(d1);
})();