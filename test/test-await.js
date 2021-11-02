(() => {
    let tester = expect(5, 'await test');

    $.register({
        tag: "await-test",
        temp: `
        <div class="target">
            <div #await="pms1" style="color:#fff;">
                {{text_l}}
            </div>
            <div #then="text" style="color:green;">
            succeed => <span :html="text" style="font-size:22px;"></span>
            </div>
            <div #catch="err" style="color:red;">
            error => <span :html="err" style="font-size:26px;"></span>
            </div>
        </div>
        `,
        data: {
            text_l: "loading",
            pms1: new Promise((resolve) => {
                setTimeout(() => {
                    resolve("I am val pms1");
                }, 500);
            })
        }
    });

    let aele = $(`<await-test></await-test>`);

    tester.ok(aele.shadow.$(".target")[0].text.replace(/[ \n]/g, "") === "loading", "await ok 1");

    aele.pms1.then(e => {
        tester.ok(aele.shadow.$("span").text === "I am val pms1", "then ok 1");
        tester.ok(aele.shadow.$("span").style.fontSize === "22px", "then ok 2");
        setTimeout(() => {
            aele.pms1 = new Promise((r, reject) => {
                setTimeout(() => {
                    reject("reject message");
                    nexter(() => {
                        tester.ok(aele.shadow.$("span").text === "reject message", "then ok 3");
                        tester.ok(aele.shadow.$("span").style.fontSize === "26px", "then ok 4");
                    });
                }, 500);
            });
            // nexter(() => {
            //     let t = aele.shadow.$(".target")[0].text.replace(/[ \n]/g, "");
            //     tester.ok(t === "loading", "await ok 2 :" + t);
            // });
        }, 200);
    })

    // $("body").push(aele);
})();