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