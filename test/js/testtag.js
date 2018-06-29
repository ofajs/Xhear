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
    attrs: ['a'],
    temp: `
        <div style="color:red;">content: {{a}} </div>
        <div xv-content></div>
        <div><input xv-module="a" /></div>
    `,
    attached($ele) {
        console.log('new one', $ele);
    },
    detached($ele) {
        console.log('you delete me', $ele);
    }
});