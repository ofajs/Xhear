(() => {
    let tester = expect(15, 'input element test');

    let ele = $(`
    <div>
        <input type="text" id="t1" />
        <input type="radio" name="val" value="1" />
        <input type="radio" name="val" value="2" />
    </div>
    `);

    window.ele = ele;

    $("body").push(ele);
})();