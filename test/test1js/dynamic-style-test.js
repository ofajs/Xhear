(() => {
    let tester = expect(3, 'dynamic-style test');

    $.register({
        tag: "dynamic-style-ele",
        data: {
            aColor: "rgb(255,0,0)",
            bColor: "rgb(0,0,255)"
        },
        temp: `
            <style>
                :host{display:block;}
                div{
                    color:rgb(255,255,255);
                    background-color:rgb(255,255,255);
                }
                div.a{
                    color:{{aColor}};
                }
                div.b{
                    color:{{bColor}};
                    background-color:{{aColor}};
                }
            </style>

            <div class="a" $="a">What a Color</div>
            <div class="b" $="b">What b Color</div>
        `
    });

    let el = $(`<dynamic-style-ele style="opacity:0;"></dynamic-style-ele>`);

    $("body").push(el); // 要添加到body才会渲染

    setTimeout(() => {
        tester.ok(el.$a.css.color.replace(/ /g, "") == "rgb(255,0,0)", "render style a color ok 1");
        tester.ok(el.$b.css.backgroundColor.replace(/ /g, "") == "rgb(255,0,0)", "render style a color ok 2");
        tester.ok(el.$b.css.color.replace(/ /g, "") == "rgb(0,0,255)", "render style b color ok 1");
    }, 100);
})();