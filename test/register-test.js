(() => {
    let tester = expect(8, 'register test');

    let testEle = $("#register_test");

    $.register({
        tag: "reg-sub-ele",
        data: {
            itext: "default itext",
            icolor: "#aaa"
        },
        temp: `
        <div>
            <br>
            <input type="text" xv-tar="dInput" xv-model="itext" />
            <br>
        </div>
        `,
        watch: {
            icolor(e, val) {
                this.$dInput.style["color"] = val;
            }
        }

    });

    $.register({
        tag: "reg-ele",
        data: {
            size: 16,
            imgwidth: 20,
            imgheight: 10,
            weight: "700",
            color: "#9999ff",
            titleName: "default",
            tarimg: "https://www.baidu.com/img/baidu_jgylogo3.gif"
        },
        temp: `
        <div xv-tar="mtitle">reg-ele-title -- {{titleName}}</div>
        <img :src="tarimg" :width="imgwidth" :height="imgheight" />
        <reg-sub-ele xv-tar="sub1" :itext="titleName" :icolor="color"></reg-sub-ele>
        <reg-sub-ele xv-tar="sub2"></reg-sub-ele>
        <slot></slot>
        `,
        proto: {
            getTitle() {
                return this.$mtitle.text;
            },
            get titletext() {
                return this.$mtitle.text;
            }
        },
        watch: {
            size(e, val) {
                this.$mtitle.style.fontSize = val + "px";
            },
            weight(e, val) {
                this.$mtitle.style.fontWeight = val;

            },
            color(e, val) {
                this.$mtitle.style.color = val;
            }
        },
        inited() {
            tester.ok(true, "init ok");
        },
        attached() {
            tester.ok(true, "attached ok");
        }
    });

    testEle.push({
        tag: "reg-ele",
        text: "test reg ele"
    });

    let regele = $("reg-ele");

    $.nextTick(() => {
        tester.ok(regele.getTitle() === "reg-ele-title -- default", "getTitle ok");
        tester.ok(regele.titletext === "reg-ele-title -- default", "titletext ok");
        tester.ok(regele.$sub2.icolor != regele.color, "no binding color ok");
        tester.ok(regele.$sub2.itext != regele.titleName, "no ƒbinding titleName ok");
        tester.ok(regele.$sub1.icolor === regele.color, "binding color ok");
        tester.ok(regele.$sub1.itext === regele.titleName, "binding titleName ok");
    });
})();