# Xhear实例方法

## que

查找子元素；

比如：

```html
<div id="a">
    <div class="a1">haha</div>
    <div class="a2">haha</div>
</div>

<script>
$("#a").que(".a1"); // => {tag:"div",class:"a1",...}

// 即使多个匹配，也只会取第一个
$("#a").que("div"); // => {tag:"div",class:"a1",...}
</script>
```

注意，即使存在多个匹配的元素，也只会去第一个返回；

与 `seek` 不同的是，`que` 只会取元素数组内的对象，并不会查找子属性的所有值；

`seek`的搜查语法和`que`也不一样，`que`查询语法与 `document.querySelector` 保持一致；`seek` 查询值没有引号，详细参考 `stanz` 的 [`seek`使用方法](https://github.com/kirakiray/stanz/blob/master/doc/cn/method_about_data.md#seek)；

## queAll

查找子元素，并已数组的形式返回所有匹配的元素；

```html
<div id="a">
    <div class="a1">haha</div>
    <div class="a2">haha</div>
</div>

<script>
$("#a").que(".a1"); // => [{tag:"div",class:"a1",...}]

$("#a").que("div"); // => [{tag:"div",class:"a1",...},{tag:"div",class:"a2",...}]
</script>
```

## queShadow

`que` 的查找影子元素版；查找组件元素自身符合条件的影子元素；

## queAllShadow

`queAll` 的查找影子元素版；查找组件元素自身符合条件的影子元素，以数组形式返回；

### siblings

### remove

### parents

### parentsUntil

### attr

### removeAttr

### removeAttr

### is

### clone

上面的api参照 jQuery 的使用就行了；

更多方法参考 `stanz` ，继承了 `stanz` 的所有方法；

[`stanz`方法1](https://github.com/kirakiray/stanz/blob/master/doc/cn/method_about_data.md)

[`stanz`方法2](https://github.com/kirakiray/stanz/blob/master/doc/cn/method_about_other.md)
