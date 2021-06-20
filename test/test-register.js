(() => {
    let tester = expect(11, 'register test');

    $.register({
        tag: "test-reg",
        attrs: {
            color: "green"
        },
        data: {
            name: "I am test reg",
            count: 0,
        },
        temp: `
            <div attr:parname="name" attr:parcolor="color" attr:cna="getCAN(count)">{{name}} - {{getCAN(count)}}</div>
            <div :html="color"></div>
            <div @click="logName" @change="logName">test-reg</div>
            <div style="color:red;font-size:14px;">
                <slot></slot>
            </div>
            <div if:="color == 'red'" class="ctarget">
                <div>{{count}}</div>
                <div @click="clickName()" :text="name" style="color:green;" id="evetarget">defalut text</div>
                <div if:="name == 'change'" if:="name == 'change'">{{name}}</div>
            </div>
        `,
        proto: {
            clickName() {
                this.count++;
            },
            logName() {
                console.log(this.name);
                return "2";
            },
            get colorAndName() {
                return this.color + "," + this.name;
            },
            getCAN(val) {
                return this.colorAndName + "," + val;
            },
            set sColor(val) {
                this.color = "#" + val;
            }
        }
    });

    let testele = $({
        tag: "test-reg"
    });

    tester.ok(testele.shadow[0].text == "I am test reg - green,I am test reg,0", "render text ok 1");
    tester.ok(testele.shadow[0].ele.getAttribute("parcolor") === "green", "render attr ok 1");
    tester.ok(testele.shadow[0].ele.getAttribute("cna") === "green,I am test reg,0", "render attr ok 2");
    tester.ok(!testele.shadow.$(".ctarget"), "if ok 1");

    testele.color = "red";

    nexter(() => {
        tester.ok(testele.shadow[0].text == "I am test reg - red,I am test reg,0", "render text ok 2");
        tester.ok(testele.shadow[0].ele.getAttribute("parcolor") === "red", "render attr ok 3");
        tester.ok(testele.shadow[0].ele.getAttribute("cna") === "red,I am test reg,0", "render attr ok 4");
        tester.ok(!!testele.shadow.$(".ctarget"), "if ok 2");

        // 点击事件
        testele.shadow.$("#evetarget").click()
    }).nexter(() => {
        tester.ok(testele.shadow[0].text == "I am test reg - red,I am test reg,1", "render text ok 3");
        tester.ok(testele.shadow[0].ele.getAttribute("cna") === "red,I am test reg,1", "render attr ok 5");
        tester.ok(testele.shadow.$(".ctarget")[0].text == 1, "render text in if ok");
    }, 200)

    // $("body").push(testele);
    // window.testele = testele;
})();