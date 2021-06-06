(() => {
    let tester = expect(8, 'event test');

    const testele1 = $(`
    <div>
        <div class="b">
            <div class="b2">b2</div>
        </div>
    </div>`);

    let i1 = 0;
    const eid = testele1.on('click', (e) => {
        switch (i1) {
            case 0:
                tester.ok(e.target == testele1.$('.b2').ele, "target ok 1");
                tester.ok(e.data.val == "a", "data ok 1");
                break;
            case 1:
                tester.ok(e.target == testele1.$('.b2').ele, "target ok 2");
                tester.ok(e.data.val == "b", "data ok 2");
                break;
            default:
                tester.ok(false, "can not run this");
        }
        i1++;
    });

    testele1.$(".b2").click({
        val: "a"
    });
    testele1.$(".b2").click({
        val: "b"
    });
    const off_result = testele1.off(eid);
    tester.ok(off_result, "off ok");
    testele1.$(".b2").click({
        val: "c"
    });


    const testele2 = $(`
    <div>
        <div class="a">
            <div class="a1">a1</div>
            <div class="a2">a2</div>
        </div>
        <div class="b">
            <div class="b1">b1</div>
            <div class="b2">b2</div>
        </div>
    </div>`);

    let i2 = 0;
    testele2.on("click", ".a", e => {
        switch (i2) {
            case 0:
                tester.ok(e.target == testele2.$('.a2').ele, "target ok 3");
                tester.ok(e.selector == testele2.$('.a').ele, "selector ok");
                break;
            default:
                tester.ok(false, "can not run this");
        }
        i2++;
    });

    testele2.$(".a2").click();
    testele2.$(".b2").click();


    const testele3 = $(`
    <div>
        <div class="b">
            <div class="b2">b2</div>
        </div>
    </div>`);


    let i3 = 0;
    testele3.one("click", e => {
        switch (i3) {
            case 0:
                tester.ok(true, "run once ok");
                break;
            default:
                tester.ok(false, "can not run this");
        }
        i3++;
    });

    testele3.click();
    testele3.click();
})();