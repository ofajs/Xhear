xhear.register({
    tag: "testtag",
    data: {
        a: "I am a"
    },
    watch: {
        value(val) {
            this.a = val;
        },
        a(val, oldVal) {
            this.value = val;
            console.log(val);
        }
    },
    proto: {
        get aa() {
            return this.a;
        }
    },
    attrs: ['a'],
    temp: `
        <div style="color:red;">content: {{a}} </div>
        <div xv-content></div>
        <div><input xv-module="a" /></div>
        <stext xv-ele xv-module="value"></stext>
    `,
    attached($ele) {
        console.log('new one', $ele);
    },
    detached($ele) {
        console.log('you delete me', $ele);
    }
});

xhear.register({
    tag: "t1",
    data: {
        tname: "t1 default",
        // value: "i am value"
    },
    temp: `
        <div style="color:red;">title:{{tname}}</div>
        <div xv-content style="padding-left:10px;border-left:red solid 1px;"></div>
        <div style="color:red;">footer:{{tname}}</div>
    `,
    // watch: {
    //     value(d, e) {
    //         debugger
    //     }
    // }
});
xhear.register({
    tag: "t2",
    data: {
        tname: "t2 default",
        // value: "i am value"
    },
    temp: `
        <div style="color:green;">title:{{tname}}</div>
        <div xv-content style="padding-left:15px;border-left:green solid 1px;"></div>
        <div style="color:green;">footer:{{tname}} </div>
    `,
    // watch: {
    //     value(d, e) {
    //         debugger
    //     }
    // }
});