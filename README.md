# Xhear

## 什么是Xhear?

Xhear 是 jQuery的精神延续产品，有很多类似jQuery的使用方法，直接在浏览器引用就能使用；但Xhear是一个 **vm模型**，负责做封装组件的底层；

## 什么是 **vm模型**？

数据本身就是视图，视图本身就是数据；

比如下面的table，我们使用 Xhear 给它排序，代码非常简单；

```html
<table>
    <thead>
        <td>人物</td>
        <td>年龄</td>
    </thead>
    <tbody>
        <tr>
            <td>孙悟空</td>
            <td>512</td>
        </tr>
        <tr>
            <td>沉香</td>
            <td>24</td>
        </tr>
        <tr>
            <td>玉皇大帝</td>
            <td>226800000</td>
        </tr>
        <tr>
            <td>杨戬</td>
            <td>1024</td>
        </tr>
    </tbody>
</table>

<script>
$('tbody').sort((a, b) => {
    return a[1].text - b[1].text;
});
</script>
```

只需要三行代码，表格就会按照年龄顺序排列；[查看案例 tableSort](https://kirakiray.github.io/Xhear/readmeSource/table_sort.html)

使用Xhear封装的组件也非常简单；直接使用封装好的 element标签(加上属性`xv-ele`) 即可；

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>markdown test</title>
    <script src="../drill.js"></script>
    <script src="../../dist/xhear.js"></script>
    <script>
        // 加载markdown库
        load("./markdown");
    </script>
</head>

<body>
    <markdown xv-ele src="README.md" style="padding:20px;">
        正在请求数据中；
    </markdown>
</body>

</html>
```

[markdown案例](https://kirakiray.github.io/Xhear/demo/markdown/test.html)，打开案例后，右键选择 查看页面源代码；

## 文档

[中文文档](doc/cn/)

## Xhear的优势？

封装简单，使用更简单；只需要浏览器，没有编译层，不强制依赖webpack，拿上手就能构建控件，轻松实现mvvm或mvc；

Xhear这里推荐和 [drill.js](https://github.com/kirakiray/drill.js) 一起使用，纯web工程，开发更方便；

## Xhear原理

Xhear是基于 [stanz](https://github.com/kirakiray/stanz) 开发的，Xhear组件也能使用 `stanz` 的方法；