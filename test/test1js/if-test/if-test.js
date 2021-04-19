(async () => {
    let iftestTemp = await fetch("/test/test1js/if-test/if-test.html");

    $.register({
        tag: "if-test",
        data: {
            val: "if-test",
            isshow: false,
            childs: [{
                name: "a1",
            }, {
                name: "a2",
            }, {
                name: "a3",
            }, {
                name: "a4",
            }]
        },
        temp: await iftestTemp.text(),
        ready() {
            setTimeout(() => {
                this.isshow = true;
            }, 1000);
        }
    });

    $("body").push(`<if-test></if-test>`);
})();