---
order: 2
group:
  title: 数据序列化
  order: 7
title: 简单导出
description: ''
keywords: []
---

要使用Konva反序列化一个JSON字符串，我们可以使用`Konva.Node.create()`方法，它可以解析JSON字符串并创建节点。 如果我们想反序列化一个舞台节点，我们还可以传入一个可选的`container`参数。

<iframe src="/downloads/code/data_and_serialization/Simple_Load.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Simple Load Demo</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #F0F0F0;
        }
    </style>
</head>
<body>
<div id="container"></div>
<script>
    var json = '{"attrs":{"width":578,"height":200},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[{"attrs":{"x":100,"y":100,"sides":6,"radius":70,"fill":"red","stroke":"black","strokeWidth":4},"className":"RegularPolygon"}]}]}';

    // create node using json string
    var stage = Konva.Node.create(json, 'container');
</script>

</body>
</html>
```
