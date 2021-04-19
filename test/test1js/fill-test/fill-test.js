(async () => {
    let tester = expect(6, 'fill test');

    $.register({
        tag: "fill-item",
        temp: `
            <style>
            :host{display:block;margin:20px 0;color:#aaa;}
            </style>
            <h3 style="color:green;margin:0;padding:0;">{{desc}}</h3>
            <div>fill-item index => {{index}}</div>
            <div>fill-item name => {{name}} <input type="text" x-model="name" /></div>
            <div x-if="showchild">
                I am childs
            </div>
        `,
        data: {
            desc: "I am fill item",
            name: "(empty)",
            childs: [],
            showchild: 0
        }
    });

    let fillTestOne = await fetch("/test/test1js/fill-test/fill-test-one.html");

    $.register({
        tag: "fill-test-one",
        temp: await fillTestOne.text(),
        data: {
            arr: [
                { name: "one" },
                { name: "two" },
                { name: "three", showchild: 1 },
                { name: "four" }
            ],
            showtitle: 0
        }
    });

    let ftEle = $("<fill-test-one></fill-test-one>");

    if (!/more-test\.html$/.test(location.pathname)) {
        ftEle.display = "none";
    }

    // 修改排序
    nexter(() => {
        ftEle
    });

    $("body").push(ftEle);

    // $("body").push(`<fill-item></fill-item>`);
})();