(() => {
    let tester = expect(3, 'slot test');

    $.register({
        tag: "stag-test",
        temp: `
        <br>
        <br>
            <div><span>stag-test测试 也是shadow ele</span></div>
            <div xv-slot="top" style="color:red"></div>
            <div xv-slot="content" style="color:green"></div>
            <div xv-tar="shaEle"></div>
        <br>
        <br>
        `
    });

    // 添加进去看看
    $("#main").push(`
    <stag-test xv-ele>
        <stag-test-content>
            <div>我是内容哈哈哈</div>
        </stag-test-content>

        <div>
            <span>我是要被抛弃的元素了哎</span>
        </div>

        <stag-test-top>
            <span>我是要被塞到顶部的元素</span>
        </stag-test-top>
    </stag-test>
    `);

    let stag = $('#main stag-test');

    stag.watch(e => {
        throw "slot elements can not emit watch";
    });

    // 查找多少div
    let div = stag.queAll("div");

    // 查找多少span
    let span = stag.queAll("span");

    tester.ok(div.length == 1, "length ok 1");
    tester.ok(span.length == 0, "length ok 2");

    // 向 slot top 添加新元素
    stag.$top.push(`<div>new top text</div>`);

    // 查找多少div
    let div2 = stag.queAll("div");
    tester.ok(div2.length == 1, "length ok 3");
})();