# Xhear

这个库本来是 [shear.js](https://github.com/kirakiray/shear.js) 2.0版本，但这个库初始的开发是基于jQuery进行的，跟原来的 shear.js（基于smartJQ.js）差别很大，所以区分开来；

名字是将 shear.js 用大剪刀 X 替换原来的开头 s，所以取名 Xhear.js；

## Xhear 是什么？

Xhear 是 类[Web组件化](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components)的实现库，通过柔和 jQuery 和 部分 MVVM 框架的特性，来制作 web视图组件；

```html
<body>
    <swiper id="test_swiper" sv-ele>
        <div class="swiper-slide" style="background-color:red;">slider1</div>
        <div class="swiper-slide" style="background-color:blue;">slider2</div>
        <div class="swiper-slide" style="background-color:green;">slider3</div>
    </swiper>
</body>
```

通过封装 [Swiper](https://github.com/nolimits4web/swiper) 而成的 swiper组件，只需要在定义的web标签上加上 `sv-ele` 属性，就不需操作初始化代码，直接使用；

而且能直接定义属性；

```html
<body>
    <swiper id="test_swiper" sv-ele autoplay="3000">
        <div class="swiper-slide" style="background-color:red;">slider1</div>
        <div class="swiper-slide" style="background-color:blue;">slider2</div>
        <div class="swiper-slide" style="background-color:green;">slider3</div>
    </swiper>
</body>
```

又或者

```javascript
$('#test_swiper').autoplay = 3000;
```

需要增加一页的话：

```javascript
$('#test_swiper').append('<div class="swiper-slide" style="background-color:yellow;">slider4</div>');
```

达到直接修改的效果；

## 与shear.js的区别

Xhear.js 可以使用第三方 `$` 库（jQuery、zepto和smartJQ等）； shear.js 是基于 smartJQ开发，不能替换成第三方的 `$` 库；

相比 shear.js，Xhear.js的Bug会少很多；

取消了 组件依赖 的前后顺序渲染，使用即时渲染规则，shear.js有依赖顺序渲染，出问题很难debug；