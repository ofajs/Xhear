(() => {
    let tester = expect(5, 'childs change test');

    let tele = $(`
    <div class="top">
        <div class="mid2">mid2</div>
        <div class="mid3">
            <div>m3_div</div>
        </div>
    </div>
    `);

    let count = 0;
    tele.watch(e => {
        switch (count) {
            case 0:
                tester.ok(e.args[2] == `<div style="color:red;">new div</div>`, 'watch push ok 1');
                tester.ok(e.path.length == 1 && e.path[0] === tele, "watch path ok 1");
                break;
            case 1:
                tester.ok(e.args[2] == `<div style="color:green;">new div2</div>`, 'watch push ok 2');
                tester.ok(e.path.length == 2 && e.path[0] === tele && e.path[1] === tele[1], "watch path ok 2");
                break;
            default:
                tester.ok(false, "error count");
        }

        count++;
    });

    tele.push(`<div style="color:red;">new div</div>`);
    tele[1].push(`<div style="color:green;">new div2</div>`);


    $.register({
        tag: "cc-test-ele",
        data: {
            val: "I am val"
        },
        temp: `val => <div>{{val}}</div>`
    });

    let tele2 = $(`
    <div class="main">
        <div class="sub1">sub1</div>
        <div class="sub2">
            <div>s2_div</div>
        </div>
    </div>
    `);

    let tar = $({ tag: "cc-test-ele" });
    tele2[1].push(tar);

    tele2.watch(e => {
        tester.ok(e.path.length === 3 && e.args[1] === "change val", "change custom element data ok");
    });

    tar.val = 'change val';
})();