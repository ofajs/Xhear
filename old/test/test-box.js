(() => {
    let tester = expect(8, 'box test');

    let boxtar = $(`
    <div id="box_test" style="width:100px;height:50px;padding:10px;margin:20px;border:#aaa solid 5px;background: #ddd;">
    `);

    $("body").push(boxtar);

    tester.ok(boxtar.width == 100, "width ok");
    tester.ok(boxtar.innerWidth == 120, "innerWidth ok");
    tester.ok(boxtar.offsetWidth == 130, "offsetWidth ok");
    tester.ok(boxtar.outerWidth == 170, "outerWidth ok");

    tester.ok(boxtar.height == 50, "height ok");
    tester.ok(boxtar.innerHeight == 70, "innerHeight ok");
    tester.ok(boxtar.offsetHeight == 80, "offsetHeight ok");
    tester.ok(boxtar.outerHeight == 120, "outerHeight ok");
})();