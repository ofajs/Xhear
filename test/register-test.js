(() => {
    let tester = expect(7, 'register test');

    let testEle = $("#register_test");

    $.register({
        tag: "reg-ele",
        data: {
            size: 16,
            weight: "700",
            color: "#9999ff",
            titleName: "default"
        },
        temp: `
        <div xv-tar="mtitle">reg-ele-title -- {{titleName}}</div>
        <slot></slot>
        `,
        watch: {
            size(e, val) {
                this.$mtitle.style.fontSize = val + "px";
            },
            weight(e, val) {
                this.$mtitle.style.fontWeight = val;

            },
            color(e, val) {
                this.$mtitle.style.color = val;
            }
        },
        inited() {
            tester.ok(true, "init ok");
        },
        attached() {
            tester.ok(true, "attached ok");
        }
    });

    testEle.push({
        tag: "reg-ele",
        text: "test reg ele"
    });
})();