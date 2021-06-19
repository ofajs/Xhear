(async () => {
    let tester = expect(15, 'form test');

    $.register({
        tag: "test-input",
        temp: await fetch('./form-temp.html').then(e => e.text()),
        data: {
            val1: "val 1",
            val2: true
        },
        proto: {
            getRadioVal() {
                let tar = this.shadow.all('[name="radioval"]').filter(e => e.checked)[0];
                return tar ? tar.value : 'none';
            }
        }
    });

    const ele = $("<test-input></test-input>");

    window.ele = ele;

    // $("body").push(ele);
})();