xhear.register({
    tag: "swiper",
    temp: `
    <div class="swiper-wrapper" sv-content></div>
    `,
    data: {
        // 只有没attached后才会更新
        sw: "",
        // 默认速度
        speed: 300,
        // 是否自动播放
        autoplay: 0
    },
    attrs: ["speed", "autoplay"],
    render($ele, data) {
        data.sw = new Swiper($ele);
    },
    watch: {
        speed(val) {
            this.sw.params.speed = val;
        },
        autoplay(val) {
            if (val) {
                this.sw.params.autoplay = val;
                this.sw.startAutoplay();
            }
        }
    },
    // inited(){},
    proto: {
        update() {
            this.sw.update();
        }
    },
    // 插入正文
    attached($ele) {
        $ele.update();
    },
    // 改变子元素
    childChange($ele) {
        $ele.update();
    }
});