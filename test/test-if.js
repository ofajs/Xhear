(() => {
    let tester = expect(9, 'if test');

    $.register({
        tag: "if-test",
        temp: `
        <div class="target">
            <div #if="val == 1" style="color:red;">{{val}}</div>
            <div #else-if="val == 2" style="color:lightskyblue;">{{val}}</div>
            <div #else-if="val <= 4" style="color:yellow;">{{val}}</div>
            <div #else style="color:green;">{{val}}</div>
        </div>
        `,
        data: {
            val: 1,
        }
    });


    let iele = $(`<if-test></if-test>`);
    const target = iele.shadow.$(".target");

    tester.ok(target.length === 1 && target[0].text === "1" && target[0].style.color == "red", "if render ok 1");

    iele.val = 2;
    nexter(() => {
        tester.ok(target.length === 1 && target[0].text === "2" && target[0].style.color == "lightskyblue", "if render ok 2");
        iele.val = 3;
    }).nexter(() => {
        tester.ok(target.length === 1 && target[0].text === "3" && target[0].style.color == "yellow", "if render ok 3");
        iele.val = 4;
    }).nexter(() => {
        tester.ok(target.length === 1 && target[0].text === "4" && target[0].style.color == "yellow", "if render ok 4");
        iele.val = 5;
    }).nexter(() => {
        tester.ok(target.length === 1 && target[0].text === "5" && target[0].style.color == "green", "if render ok 5");
    });

    $.register({
        tag: "if-test-two",
        temp: `
        <style>.ha{color:red;}</style>
        <h3>if-test-two</h3>
        <div class="target" fill:t1="arr"></div>
        <template name="t1">
            <div>
                <div #if="$data > 2" class="ha">{{$data}}</div>
                <div #else>
                    {{$data}}
                </div>
            </div>
        </template>
        `,
        data: {
            arr: [1, 2, 3, 4]
        }
    });

    let iele2 = $("<if-test-two></if-test-two>");
    tester.ok(iele2.shadow.all(".ha").length == 2, "fill if render ok");
    // $("body").push(iele2);

    $.register({
        tag: "if-test-three",
        data: {
            frameView: "222",
            arr: [{ path: "111" }, { path: "222" }, { path: "333" }]
        },
        temp: `
        <div fill:fileblock="arr"></div>
        <div temp:fileblock class="file_block">
            {{$data.path}}
            <span id="f_tar" #if="$data.path == $host.frameView">😁</span>
        </div>
        `,
        ready() {
            setTimeout(() => {
                tester.ok(this.shadow.$("#f_tar"), "fill if ok 1");
                let frameView = this.frameView;
                this.frameView = "";
                setTimeout(() => {
                    tester.ok(!this.shadow.$("#f_tar"), "fill if ok 2");
                    this.frameView = frameView;
                    setTimeout(() => {
                        tester.ok(this.shadow.$("#f_tar"), "fill if ok 3");
                    }, 100);
                }, 100);
            }, 1000);
        }
    });

    let iele3 = $(`<if-test-three style="display:none;"></if-test-three>`);
    // $("body").unshift(iele3);
})();