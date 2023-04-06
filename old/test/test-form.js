(async () => {
    let tester = expect(8, 'form test 1');

    $.register({
        tag: "test-input",
        temp: await fetch('./form-temp.html').then(e => e.text()),
        data: {
            val1: 1,
            // val1: "1",
            val2: true
        },
        proto: {
            // getRadioVal() {
            //     let tar = this.shadow.all('[name="radioval"]').filter(e => e.checked)[0];
            //     return tar ? tar.value : 'none';
            // }
        }
    });

    const ele = $("<test-input></test-input>");

    // $("body").unshift(ele);

    // window.ele = ele;

    tester.ok(ele.shadow.$("#t1").value == 1, "form render value ok 1");
    tester.ok(ele.shadow.$("#t1_2").value == 1, "form render value ok 2");
    tester.ok(ele.shadow.$("#t1_3").value == 1, "form render value ok 3");
    tester.ok(ele.shadow.$("#t2").checked == true, "form render value ok 4");

    ele.shadow.$("#t1").value = 2;
    ele.shadow.$("#t2").checked = false;
    nexter(() => {
        tester.ok(ele.val1 == 2, "form sync value ok 1");
        tester.ok(ele.shadow.$("#t1_2").value == 2, "form sync value ok 2");
        tester.ok(ele.shadow.$("#t1_3").value == 2, "form sync value ok 3");
        tester.ok(ele.val2 === false, "form sync value ok 4");
    })
})();

(async () => {
    let tester = expect(10, 'form test 2');

    $.register({
        tag: "test-form",
        temp: await fetch('./form-temp2.html').then(e => e.text()),
        data: {
            fdata: null
        },
        proto: {
            numcheck(e) {
                if (e.$target.value > 100) {
                    e.msg = Error("不能大于100");
                }
            }
        },
        ready() {
            this.fdata = this.shadow.form();
        }
    });

    let el2 = $(`<test-form></test-form>`);

    el2.fdata.a1 = "change a1";
    el2.fdata.a5 = "2";
    el2.fdata.a6 = ["B", "C"];

    nexter(() => {
        tester.ok(el2.shadow.$(`[name="a1"]`).value === "change a1", "render input ok");
        tester.ok(el2.shadow.$(`[name="a5"][value="2"]`).checked, "render radio ok");
        tester.ok(el2.shadow.$(`[name="a6"][value="B"]`).checked, "render checkbox ok 1");
        tester.ok(el2.shadow.$(`[name="a6"][value="C"]`).checked, "render checkbox ok 2");


        el2.shadow.$(`[name="a1"]`).value = "rechange a1";
        el2.shadow.$(`[name="a5"][value="3"]`).click();
        el2.shadow.$(`[name="a6"][value="C"]`).click();
        el2.shadow.$(`[name="a6"][value="A"]`).click();
    }).nexter(() => {
        tester.ok(el2.fdata.a1 == "rechange a1", "binding data ok");
        tester.ok(el2.fdata.a5 == "3", "binding radio data ok");
        tester.ok(el2.fdata.a6.includes('A'), "binding checkbox data ok 1");
        tester.ok(el2.fdata.a6.includes('B'), "binding checkbox data ok 2");
        tester.ok(!el2.fdata.a6.includes('C'), "binding checkbox data ok 3");
        tester.ok(el2.fdata.a6[0] == "B" && el2.fdata.a6[1] == "A", "binding checkbox order ok");
    });

    // $("body").unshift(el2);
})();