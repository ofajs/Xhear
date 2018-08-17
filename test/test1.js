(() => {
    var tester = expect(17, 'xdata test');

    let d1 = $.xdata({
        a: "I am a",
        b: "I am b"
    });

    let d2 = $.xdata({
        a: "",
        b: ""
    });

    let d3 = $.xdata({
        kk: ""
    });

    // 数据绑定
    d1.sync(d2);

    // 数据桥接
    // d1.transData({
    //     key: "a",
    //     target: d3,
    //     targetKey: "kk",
    //     trans: {
    //         "haha":'kaka'
    //     }
    // });

    tester.ok(d1.a === "I am a", "get value ok");

    let watchFunc, obsFunc;

    d1.watch('a', watchFunc = (val, e) => {
        tester.ok(val === "change a", "watch val ok");
        tester.ok(e.oldVal === "I am a", "watch oldVal ok");
    });

    // 观察
    d1.watch(obsFunc = e => {
        tester.ok(e.key === "a", 'key ok');
        tester.ok(e.oldVal === "I am a", 'oldVal ok');
        tester.ok(e.val === "change a", 'val ok');
        tester.ok(e.type === "update", 'type ok');
    });

    // 设置值
    d1.a = "change a";

    // 重复设置同样的值不会被触发
    d1.a = "change a";

    // 取消监听
    d1.unwatch('a', watchFunc);
    d1.unwatch(obsFunc);

    // 确认再次修改不会触发
    d1.a = "change a 2";

    // 观察
    d1.watch(obsFunc = e => {
        tester.ok(e.key === "c", 'new set key ok');
        tester.ok(!e.oldVal, 'new set oldVal ok');
        tester.ok(e.val === "I am c", 'new set val ok');
        tester.ok(e.type === "new", 'new set type ok');
    });

    // set
    // d1.set('c', "I am c");
    d1.c = "I am c";

    // 新观察
    d1.unwatch(obsFunc);
    d1.watch(obsFunc = e => {
        tester.ok(e.key === "c", 'c key ok');
        tester.ok(e.oldVal == "I am c", 'c oldVal ok');
        tester.ok(e.val === "change c", 'c val ok');
        tester.ok(e.type === "update", 'c type ok');
    });

    // 改动
    d1.c = "change c";

    console.log(d1);

    tester.ok(d2.a === "change a 2", "syncData ok 1");
    tester.ok(d2.b === "", "no sync ok 2");
})();