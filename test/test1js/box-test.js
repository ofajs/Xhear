(() => {
    let tester = expect(4, 'box test');

    let boxtar = $(`
    <div id="box_test" style="width:100px;height:50px;padding:10px;margin:20px;border:#aaa solid 5px;background: #ddd;">
    `);

    $("body").push(boxtar);

    tester.ok(boxtar.height == 50, "height ok");

    tester.ok(boxtar.innerHeight == 70, "innerHeight ok");

    tester.ok(boxtar.offsetHeight == 80, "offsetHeight ok");

    tester.ok(boxtar.outerHeight == 120, "outerHeight ok");
})();