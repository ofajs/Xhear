(() => {
    let tester = expect(2, 'fill bind sync test');

    $.register({
        tag: "fill-sync-test",
        temp: `
        <div>fill-sync-test</div>
        <ul fill:testele="arr"></ul>
        <li temp:testele>
            <span>{{$data.val}}</span>
            <input type="text" sync:value="$data.val" />
        </li>
        `,
        data: {
            arr: [{
                val: "1111"
            }]
        }
    });

    let t = $('<fill-sync-test></fill-sync-test>');

    // $("body").push(t);

    setTimeout(() => {
        tester.ok(t.shadow[1][0].$('span').text === "1111", "render text ok");
        tester.ok(t.shadow[1][0].$('input').value === "1111", "render input ok");
    }, 100);
})();

(() => {
    let tester = expect(5, "await bind event test");

    $.register({
        tag: "await-event-test",
        temp: `
        <div #await="count" style="color:rgb(128, 128, 255);">Loading</div>
        <div #then="data" style="color:rgb(0, 128, 0);">count => <span :text="data"></span>
            <button @click="$host.resetCount()">reset</button>
        </div>
        <div #catch="data" style="color:red;">
            <span :text="data"></span>
            <button @click="$host.resetCount()">reset</button>
        </div>
        `,
        data: {
            count: Promise.resolve(100),
            set_num: 0
        },
        proto: {
            resetCount() {
                this.set_num++;
                this.count = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (this.set_num < 2) {
                            resolve(200);
                        } else {
                            reject(400);
                        }
                    }, 500);
                });
            }
        }
    });

    let d = $(`<await-event-test></await-event-test>`);

    setTimeout(() => {
        tester.ok(d.shadow.$("span").text == 100, 'render text ok');
        tester.ok(d.shadow.$("span").css.color == 'rgb(0, 128, 0)', 'render text color ok');
        d.shadow.$("button").click();
        setTimeout(() => {
            tester.ok(d.shadow.$("div").css.color == 'rgb(128, 128, 255)', 'render text color ok 2');
        }, 100);
        setTimeout(() => {
            tester.ok(d.shadow.$("span").text == 200, 're render text ok');
            tester.ok(d.shadow.$("span").css.color == 'rgb(0, 128, 0)', 're render text color ok');
        }, 550);
    }, 10);

    d.show = false;
    $("body").push(d);
})();