(() => {
    let tester = expect(10, 'render condition test');

    let container = $(`
    <div id="condition-container">
        <condition-test></condition-test>
    </div>
    `);

    $("body").push(container);

    $.register({
        tag: "condition-test",
        data: {
            a: "1",
            isClick1: 0,
            isClick2: 0,
            showS1: false,
            showS2: true
        },
        temp: `
            <style> div{color:white;} [a="1"]{color:rgb(0,128,0);} [a="2"]{color:rgb(255,0,0);}</style>
            <div> 我是condition-test
                <div xv-tar="c1" @click="clickFun"></div>
                <div xv-tar="c2" @click="canClick && clickFun2($event)"></div>
                <div xv-tar="a1" :a="a">{{a}}</div>
                <div xv-tar="a2" :a="canClick ? 2 : 1">{{canClick ? 2 : 1}}</div>
                <div class="s1" xv-if="showS1">s1</div>
                <div class="s2" xv-if="!showS1">s2</div>
                <div xv-tar="h1" xv-show="showS2">h1</div>
                <div xv-tar="h2" xv-show="!showS2">h2</div>
            </div>
        `,
        proto: {
            clickFun() {
                this.isClick1 = 1;
            },
            get canClick() {
                return true;
            },
            clickFun2(e) {
                this.isClick2 = 1;
            }
        }
    });

    setTimeout(() => {
        // 模拟点击
        container.$("condition-test").$c1.ele.click();
        container.$("condition-test").$c2.ele.click();

        setTimeout(() => {
            tester.ok($("condition-test").isClick1 === 1, "event bind ok");
            tester.ok($("condition-test").isClick2 === 1, "event condition ok");
            tester.ok($("condition-test").$a1.css.color.replace(/ /g, "") === "rgb(0,128,0)", "prop bind ok");
            tester.ok($("condition-test").$a2.css.color.replace(/ /g, "") === "rgb(255,0,0)", "prop condition ok");
            tester.ok($("condition-test").$a1.text == 1, "text bind ok");
            tester.ok($("condition-test").$a2.text == 2, "text condition ok");
            tester.ok(!$("condition-test").$shadow.$(".s1"), "v-if bind ok");
            tester.ok($("condition-test").$shadow.$(".s2"), "v-if condition ok");
            tester.ok($("condition-test").$h1.display, "v-show bind ok");
            tester.ok($("condition-test").$h2.display === "none", "v-show condition ok");
        }, 100);

    }, 300);
})();