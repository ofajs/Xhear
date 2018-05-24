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
    computed: {
        speed: {
            get() {
                return this.sw.params.speed;
            },
            set(val) {
                this.sw.params.speed = val;
            }
        },
        autoplay: {
            get() {
                return this.sw.params.autoplay;
            },
            set(autoplay) {
                if (autoplay) {
                    this.sw.params.autoplay = autoplay;
                    this.sw.startAutoplay();
                }
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
    },
    render($ele, data) {
        data.sw = new Swiper($ele);
    }
});