xhear.register({
    tag: "stext",
    temp: `
    <div class="s_text_input" contenteditable="true" sv-tar="sInput"></div>
    <div class="s_text_before_bottomline"></div>
    <div class="s_text_bottomline"></div>
    <div class="s_text_dislayer"></div>
    `,
    data: {
        maxlength: "",
        type: "",
        pattern: "",
        ftype: 1
    },
    attrs: ['maxlength', 'type', 'ftype'],
});