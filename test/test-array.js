(() => {
    let tester = expect(6, 'array test');

    const testele = $(`
    <div>
        <div>3</div>
        <div>4</div>
        <div>1</div>
        <div>2</div>
    </div>
    `);

    tester.ok(testele[0].text == "3" && testele[1].text == "4", "get childs ok");

    tester.ok(testele.length === 4, "length ok 1");

    testele.unshift({
        tag: "div",
        text: "5"
    });

    tester.ok(testele[0].text == "5" && testele[1].text == "3", "get childs ok 2");

    tester.ok(testele.length === 5, "length ok 2");

    testele.sort((a, b) => a.text - b.text);

    tester.ok(testele.map(e => parseInt(e.text)).join(",") == "1,2,3,4,5", "sort ok");

    testele.reverse();
    tester.ok(testele.map(e => parseInt(e.text)).join(",") == "5,4,3,2,1", "reverse ok");

})();