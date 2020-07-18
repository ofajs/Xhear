(() => {
    let tester = expect(3, 'other test');

    let testEle = $("<div></div>");

    $.register({
        tag: "other-test-one",
        attrs: {
            other: 1
        },
        proto: {
            set temp(val) {
                this.html = val;
            },
            get temp() {
                return this.html;
            }
        }
    });

    $.nextTick(() => {
        testEle.push($(`
            <other-test-one>test one haha</other-test-one>
        `));

        let testone = testEle.$(`other-test-one`);

        tester.ok(testone.temp === "test one haha", "proto get data ok");

        // 不能触发数据冒泡
        testone.watch(() => {
            debugger
        });

        testone.temp = "change one";

        tester.ok(testone.temp === "change one", "proto set data ok");

        setTimeout(e => {
            tester.ok(testEle.$("other-test-one").ele.getAttribute("other") == 1, "attributes ok");
        }, 100);
    });
})();