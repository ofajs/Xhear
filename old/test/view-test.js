(() => {
    let tester = expect(3, 'view test');

    let main2 = $('#main2');

    // 注册两个自定义元素
    $.register({
        tag: "a1",
        data: {
            value: "I am a1"
        },
        temp: `
            <div>{{value}}</div>        
            <input xv-module="value" />
            <div xv-content></div>
        `
    });

    $.register({
        tag: "a2",
        data: {
            x: "100",
            y: "200"
        },
        attrs: ["x", "y"],
        temp: `
        <div style="font-size:12px;">
            <div style="color:#ffcc00;">x:{{x}}</div>
            <div style="color:#8a8aff;">y:{{y}}</div>
            <div xv-content></div>
        </div>
        `
    });

    // 创建viewData
    let vData = main2.viewData();

    tester.ok(vData.a1 == "I am a1", "vData ok 1");
    tester.ok(vData.a2X == 300, "vData ok 2");
    tester.ok(vData.a2Y == 200, "vData ok 3");
})();