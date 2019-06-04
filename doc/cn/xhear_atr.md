# Xhear实例属性

## 说明

`get` 代表直接获取元素的意思；`set` 代表设置该属性；比如下面这个 `display`；

```javascript
let a = $('body').display; //  这就是 get 操作

$('body').display = "none"; // 这就是 set 操作
```

## display

get: 获取元素的 `display`值；

set: 设置元素的 `display`值；

替代 jQ 的 `show()` 和 `hide()`；元素需要隐藏就 `xele.display = "none"`；还原显示就 `xele.display = ""`

## text

get: 获取元素的文本字符串；

set: 设置元素的文本字符串；

替代 jQ 的 `text()`

## html

get: 获取元素的html内容；

set: 设置元素的html内容；

替代 jQ 的 `html()`

## style

get: 获取元素的style；

set: 设置元素的style；

获取元素的字体颜色 

```javascript
let xxxColor = $(xxx).style.color; // =>
```

设置字体颜色

```javascript
$(xxx).style.color = "red";
```

当使用style直接替换的话，会把元素 `style` 上原本的属性去掉；

```html
<div id="a" style="color:red;font-size:18px;">A<div>
...
<script>
// 这个操作会把原本的 font-size 也干掉
$("#a").style = {
    color:"green"
};
</script>
```

如果只是想合并到 `style` 上，应该如下操作;

```javascript
Object.assign($("#a").style,{
    color:"green"
});
```

替代 jQ 的 `css()`

## css

get: 获取元素的具体样式；

set:不可set

`style` 只会获取设置在元素 `style`标签上的值；而 `css` 是获取元素的全局样式值；

比如

```html
<div id="a" style="color:red;">A<div>
...
<script>
$("#a").style.color // => red
$("#a").style.fontSize // => undefined

$("#a").css.color // => red
$("#a").css.fontSize // => 16px (默认值)
</script>
```

替代 jQ 的 `css()`

## position

get:获取元素定位信息;

set:不可set

## offset

get:获取元素距离最左上的定位信息；

set:不可set

## width

get:获取元素宽度像素值；

set:不可set

## height

get:获取元素高度像素值

set:不可set

## innerWidth

get:获取元素 clientWidth

set:不可set

## innerHeight

get:获取元素 clientHeight

set:不可set

## offsetWidth

get:获取元素 offsetWidth

set:不可set

## offsetHeight

get:获取元素 offsetHeight

set:不可set

## outerWidth

get:获取元素 outerWidth

set:不可set

## outerHeight

get:获取元素 outerHeight

set:不可set

## $content

get: 获取自定义组件的 `content`容器影子元素；

set: 不可set

## hostkey

get:相对父对象的 `key` 名；

set:不可set

从 `stanz` 上继承过来的属性；

更多属性可查看 [`stanz`属性描述](https://github.com/kirakiray/stanz/blob/master/doc/cn/attr_des.md)；基本继承了 `stanz`的所有属性；