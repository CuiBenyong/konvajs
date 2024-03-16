---
order: 1
group:
  title: 数据序列化
  order: 7
title: 序列化
description: ''
keywords: []
---

要使用Konva将舞台保存为JSON字符串，我们可以使用`toJSON()`方法, 将Konva节点树序列化为可以在网络存储中或在离线数据库中保存的文本。 我们还可以序列化其他的节点，包括图层，组和形状。

<iframe src="/downloads/code/data_and_serialization/Serialize_a_Stage.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Save Stage Demo</title>
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
    var width = window.innerWidth;
    var height = window.innerHeight;

    var stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height
    });

    var layer = new Konva.Layer();

    var hexagon = new Konva.RegularPolygon({
        x: width / 2,
        y: height / 2,
        sides: 6,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(hexagon);

    // add the layer to the stage
    stage.add(layer);

    // save stage as a json string
    var json = stage.toJSON();

    console.log(json);
</script>

</body>
</html>
```