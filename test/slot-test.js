(() => {
    $.register({
        tag: "stag-test",
        temp: `
        <br>
        <br>
            <div>stag-test测试</div>
            <div xv-slot="top" style="color:red"></div>
            <div xv-slot="content" style="color:green"></div>
        <br>
        <br>
        `
    });

    // 添加进去看看
    // $("#main").push(`
    // <stag-test xv-ele>
    //     <div>我是内容哈哈哈</div>
    // </stag-test>
    // `);
    $("#main").push(`
    <stag-test xv-ele>
        <stag-test-content>我是内容哈哈哈</stag-test-content>
        <div>我是要被抛弃的元素了哎</div>
        <stag-test-top>我是要被塞到顶部的元素</stag-test-top>
    </stag-test>
    `);
})();