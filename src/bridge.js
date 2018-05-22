$.bridge = (...args) => {
    // 之前的值得
    let beforeOriVal = undefined;

    each(args, options => {
        let {
            tar,
            key
        } = options;

        if (options instanceof $) {
            tar = options;
            key = 'val';
        }

        tar.watch(key, (val, beforeVal, oriVal) => {
            if (beforeOriVal === oriVal) {
                return;
            }
            beforeOriVal = oriVal;
            each(args, opt => {
                let tar2, key2;

                if (opt instanceof $) {
                    tar2 = opt;
                    key2 = "val"
                } else {
                    tar2 = opt.tar;
                    key2 = opt.key;
                }


                if (tar !== tar2) {
                    if (key2 === "val") {
                        tar2.val(oriVal);
                    } else {
                        tar2[key2] = oriVal;
                    }
                }
            });
        });
    });
}