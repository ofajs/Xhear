# Xhear

## 什么是Xhear?

Xhear 是 jQuery的精神延续产品，有很多类似jQuery的api，直接在浏览器上跑；但Xhear是一个 **vm模型**，负责做封装组件的底层；

## 什么是 **vm模型**？

数据本身就是视图，视图本身就是数据；

比如下面的table，我们使用 Xhear 给它排序，代码非常简单；

```html
<table>
    <thead>
        <td>姓名</td>
        <td>年龄</td>
    </thead>
    <tbody>
        <tr>
            <td>大白</td>
            <td>28</td>
        </tr>
        <tr>
            <td>小张</td>
            <td>23</td>
        </tr>
        <tr>
            <td>老王</td>
            <td>40</td>
        </tr>
        <tr>
            <td>阿山</td>
            <td>33</td>
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

使用Xhear封装的组件也非常简单；直接使用封装好的html标签即可；

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

[markdown案例](https://kirakiray.github.io/Xhear/demo/markdown/test.html)

## Xhear的优势？

封装简单，使用更简单；只需要浏览器哦，没有编译层，不强制依赖webpack，拿上手就能构建控件，实现mvvm或mvc；