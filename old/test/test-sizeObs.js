(() => {
    $.register({
        tag: "size-obs",
        temp: `
        <style>
        :host{display:block;}
        </style>
        <div style="width:40vw;height:10vh;border:#aaa solid 1px;color:#fff;">
        width:{{width}} x height:{{height}}
        </div>
        `,
        ready() {
            this.initSizeObs();
        }
    });

    $("body").push('<size-obs></size-obs>');
})();