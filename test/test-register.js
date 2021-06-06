(() => {
    $.register({
        tag: "test-reg",
        attrs: {
            color: "green"
        },
        data: {
            name: "I am test reg"
        },
        temp: `
            <div :parname="name" :parcolor="color" @blur="logName()" :cna="getCAN(0)">{{name}}</div>
            <div @click="logName" @change="logName">test-reg</div>
            <div style="color:red;font-size:14px;">
                <slot></slot>
            </div>
            <div x-if="color == 'red'" class="ctarget">
                <div @click="logName()">color red</div>
                <div x-if="name == 'change'">{{name}}</div>
            </div>
        `,
        proto: {
            logName() {
                console.log(this.name);
                return "2";
            },
            get colorAndName() {
                return this.color + "," + this.name;
            },
            getCAN(val) {
                return this.colorAndName + "," + val;
            },
            set sColor(val) {
                this.color = "#" + val;
            }
        }
    });

    let testele = $({
        tag: "test-reg"
    });

    $("body").push(testele);

    window.testele = testele;
})();