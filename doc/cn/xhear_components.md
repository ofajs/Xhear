# Xhear组件编写

下面列出知识点，看完就是掌握90%的 Xhear组件的开发了；

注册组件的属性：

* attrs
* props
* data
* watch
* proto

生命周期callback：

* inited
* attached
* detached

模板语法：

* `{{keyName}}` 文本渲染模板语法；
* `xv-content` 和 `xv-slot` 插槽元素；
* `xv-tar` 暴露影子元素；
* `xv-module` 绑定value数据；

下面以谷歌 Material Design 的 输入线 为案例做个控件；(案例中没有使用模块化和模板引用，后面的XDFrame会补充解决这两个问题；只是简单的 `script`标签引用方便理解)

<img src="../img/input_line.png" alt="输入线" width="800">

首先把基础的静态模板写出来；

**注意！！！！** 注册组件不能出现大写字符，element标签不能识别大写字母，请使用 `-` 分开词义；

这里定义组件名 `input-line`；

主体的元素就三个；

```html
<input-line>
    <!-- 主体输入框 -->
    <input type="text" class="main_input">
    <!-- 底部线 -->
    <div class="bottom_line"></div>
    <!-- placeholder提示元素 -->
    <div class="tips_text">Label</div>
</input-line>
```

[点击查看 input-line 静态模板(html+css)](https://kirakiray.github.io/Xhear/readmeSource/input_line/static.html)；

那么 `input-line` 的最基础静态组件就这么定义：

```html
$.register({
    tag: "input-line",
    temp:`
    <input type="text" class="main_input">
    <div class="bottom_line"></div>
    <div class="tips_text">Label</div>
    <div xv-content></div>
    `
});
```

**tag** 自定义标签名；

**temp** 存放自定义组件的模板元素；

`temp` 里加了个 `<div xv-content></div>` 是用于存放 content元素；**所有的组件都必须带有 `xv-content` 的元素**；至于有什么用后面会讲；

[点击查看 input-line 组件](https://kirakiray.github.io/Xhear/readmeSource/input_line/static.html)；

下面开始添加基础交互；

```javascript
$.register({
    tag: "input-line",
    temp: `
    <input type="text" class="main_input" xv-tar="mainInput">
    <div class="bottom_line"></div>
    <div class="tips_text">Label</div>
    <div xv-content></div>
    `,
    data: {
        // 默认istat为空
        istat: ""
    },
    attrs: ["istat"],
    inited() {
        this.$mainInput.on("focus", e => {
            // mainInput聚焦时，修改istat属性为infocus
            this.istat = "infocus";
        });
        this.$mainInput.on("blur", e => {
            // mainInput失去焦点时，清空istat
            this.istat = "";
        });
    }
});
```

**inited** 元素初始化完成后，会进入 `inited` 方法内， `this` 指向的就是初始化后的组件元素；

**data** 定义组件自身的默认数据；

**attrs** 定义自身数据的 `key`值 是否映射到元素属性上；案例中通过css定义了 `istat` 属性修改组件的界面变化；

组件的 `xv-tar` 定义了影子元素在组件上的key；而要使用该元素只需要前置 `$` 符即可；方便实例函数快速调用影子元素；

temp模板内，给 `.main_input` 添加了 `[xv-tar="mainInput"]` 属性；使用元素只需要 `$mainInput` 获取；

内元素渲染完成后`(inited后)`，给内部的的 `input` 元素注册 聚焦和失焦 (focus blur)事件，修改元素的 `istat` 值；

而 `istat` 的值绑定组件元素的外部属性，css上定义了改动的样式变化；

```css
input-line[istat="infocus"]>.bottom_line {
    background-color: #4078f6;
    height: 2px
}

input-line[istat="infocus"]>.tips_text {
    top: -18px;
    font-size: 10px;
    color: #4078f6
}
```

效果查看

```html
<input-line xv-ele></input-line>
```

<img src="../img/input-line1.gif" width="416" alt="初始交互" />

### 特性说明

`temp` 填充到元素内的模板元素被称为 `影子元素`；通过debug工具可以查看到，模板元素上都会带 `xv-shadow` 属性，外部是无法通过`que`获取影子元素；但通过提供的 `queShadow` 可以查找组件自身的影子元素；

```javascript
$('input-line').que('.main_input'); // => null
$('input-line').queShadow('.main_input'); // => {tag:"input",...}
```

外部也可以使用组件的快捷影子元素：

```javascript
$("input-line").$mainInput // => {tag:"input",...}
```

接下来自定义文本的 `placeholder` 值；

```javascript
$.register({
    tag: "input-line",
    temp: `
    <input type="text" class="main_input" xv-tar="mainInput">
    <div class="bottom_line"></div>
    <div class="tips_text">{{placeholder}}</div>
    <div xv-content></div>
    `,
    data: {
        // 默认istat为空
        istat: "",
        // placeholder默认值
        placeholder: "Label"
    },
    attrs: ["istat", "placeholder"],
    inited() {
        this.$mainInput.on("focus", e => {
            // mainInput聚焦时，修改istat属性为infocus
            this.istat = "infocus";
        });
        this.$mainInput.on("blur", e => {
            // mainInput失去焦点时，清空istat
            this.istat = "";
        });
    }
});
```

组件 `temp` 内的 **{{keyName}}** 会被渲染成 `文本元素`，文本内容是组件相应的key值；

效果查看

```html
<input-line placeholder="UserName" xv-ele></input-line>
```

<img src="../img/input-line2.gif" width="416" alt="初始交互" />

### 特性说明

在使用组件时，直接设置的属性key在组件 `attrs` 内时，会变成该实例组件的默认数据；

接下来到定义组件的 `value` 值；

```javascript
$.register({
    tag: "input-line",
    temp: `
    <input type="text" class="main_input" xv-tar="mainInput" xv-module="iVal">
    <div class="bottom_line"></div>
    <div class="tips_text">{{placeholder}}</div>
    <div xv-content></div>
    `,
    data: {
        // 默认istat为空
        istat: "",
        // placeholder值
        placeholder: "Label",
        // 属性值
        iVal: ""
    },
    attrs: ["istat", "placeholder"],
    inited() {
        this.$mainInput.on("focus", e => {
            // mainInput聚焦时，修改istat属性为infocus
            this.istat = "infocus";
        });
        this.$mainInput.on("blur", e => {
            if (!this.iVal) {
                // mainInput失去焦点时，清空istat
                this.istat = "";
            }
        });
    }
});
```

组件 `temp` 内的 **[xv-module]** 元素的 `value` 值会跟组件相应的 `key`值绑定；

在失去焦点事件（blur）添加判断，当不为空值，就不用切换回 placeholder 居中的状态；

<img src="../img/input-line3.gif" width="416" alt="初始交互" />

这时候获取值得方式是

```javascript
$('input-line').iVal // => Jack
```

正常情况下，控件的值都会设置在 `value` 上，所以修改下代码，将 `iVal` 改成 `value`，就能成为别的组件的 `input`子组件；

```javascript
$.register({
    tag: "input-line",
    temp: `
    <input type="text" class="main_input" xv-tar="mainInput" xv-module="value">
    <div class="bottom_line"></div>
    <div class="tips_text">{{placeholder}}</div>
    <div xv-content></div>
    `,
    data: {
        // 默认istat为空
        istat: "",
        // placeholder值
        placeholder: "Label",
        // 属性值
        value: ""
    },
    attrs: ["istat", "placeholder", "value"],
    inited() {
        this.$mainInput.on("focus", e => {
            // mainInput聚焦时，修改istat属性为infocus
            this.istat = "infocus";
        });
        this.$mainInput.on("blur", e => {
            if (!this.value) {
                // mainInput失去焦点时，清空istat
                this.istat = "";
            }
        });
    }
});
```

```javascript
$('input-line').value // => Jack
```

将 `value` 加入到 `attrs` ，value值也能设置到组件上；

```html
<input-line placeholder="UserName" value="Jack" xv-ele></input-line>
```

到这里 `input-line` 基础使用没问题，但要添加两个新需求：

* 组件主题颜色可自定义，默认是现在的蓝色，我想换成红色的；
* 在右边添加三角形下拉框，不仅可以输入文本，还能有默认可选项；

### 自定义组件主题色


