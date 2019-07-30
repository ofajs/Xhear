class XhearElement extends XData {
    constructor(ele) {
        super({});
        delete this.parent;
        ele.__xhear__ = this;
        Object.defineProperties(this, {
            tag: {
                enumerable: true,
                value: ele.tagName.toLowerCase()
            },
            ele: {
                value: ele
            },
            // parent: {
            //     get() {
            //         
            //     }
            // }
        });
    }

    get parent() {
        return (this.ele.parentNode === document) ? null : createXhearElement(this.ele.parentNode);
    }

    // setData(key, value) {
    //     debugger
    // }

    // getData(key) {
    //     debugger
    // }
}