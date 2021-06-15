(() => {
    const tester = expect(11, 'sync test');

    $.register({
        tag: "test-sync",
        temp: `
        <div>{{name}}</div>
        <test-sync-sub-one :sname="name"></test-sync-sub-one>
        <test-sync-sub-two sync:sname="name"></test-sync-sub-two>
        `,
        data: {
            name: "default name"
        }
    });

    $.register({
        tag: "test-sync-sub-one",
        temp: `
        <div style="margin-left:20px;color:red;">{{sname}}</div>
        `,
        data: {
            sname: "sub name one"
        }
    });

    $.register({
        tag: "test-sync-sub-two",
        temp: `
        <div style="margin-left:20px;color:green;">{{sname}}</div>
        `,
        data: {
            sname: "sub name two"
        }
    });

    const tele = $(`<test-sync></test-sync>`);

    tester.ok(tele.name == "default name", "default name ok 1");
    tester.ok(tele.shadow.$('test-sync-sub-one').sname == "default name", "default name ok 2");
    tester.ok(tele.shadow.$('test-sync-sub-two').sname == "default name", "default name ok 3");

    // 修改名字
    tele.name = "change name first";

    nexter(() => {
        tester.ok(tele.name == "change name first", "change name first ok 1");
        tester.ok(tele.shadow.$('test-sync-sub-one').sname == "change name first", "change name first ok 2");
        tester.ok(tele.shadow.$('test-sync-sub-two').sname == "change name first", "change name first ok 3");

        // 单项数据不同步
        tele.shadow.$('test-sync-sub-one').sname = "change sub name 1";
    }).nexter(() => {
        tester.ok(tele.name == "change name first", "parent data name ok");
        tester.ok(tele.shadow.$('test-sync-sub-one').sname == "change sub name 1", "change sub name ok");

        // 双向数据同步
        tele.shadow.$('test-sync-sub-two').sname = 'change sub two name';
    }).nexter(() => {
        tester.ok(tele.name == "change sub two name", "change sub two name ok 1");
        tester.ok(tele.shadow.$('test-sync-sub-one').sname == "change sub two name", "change sub two name ok 2");
        tester.ok(tele.shadow.$('test-sync-sub-two').sname == "change sub two name", "change sub two name ok 3");
    });

    // $('body').push(tele);
})();