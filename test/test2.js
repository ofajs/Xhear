((() => {
    var tester = expect(3, 'xElement test');

    let test2tar = $('#test2Tar');

    tester.ok(test2tar.a == "kakaluote", 'a ok');
    tester.ok(test2tar.value == "kakaluote", 'value ok');

    test2tar.a = "change a";
    tester.ok(test2tar.value == "change a", 'value ok 2');
}))();