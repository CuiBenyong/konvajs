---
title: 'Star 星形'
description: '用 Konva.Star 绘制星形：numPoints 指定角数，innerRadius 与 outerRadius 分别定义内外顶点到中心的距离。'
sidebar_position: 13
---
要使用`Konva`添加星形, 我们可以实例化一个`Konva.Star()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Star.html" target="_blank">Konva.Star</a>文档

<iframe src="/downloads/code/shapes/Star.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Star Demo</title>
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
    var stage = new Konva.Stage({
      container: 'container',
      width: 300,
      height: 300
    });

    var layer = new Konva.Layer();

    var star = new Konva.Star({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      numPoints: 6,
      innerRadius: 40,
      outerRadius: 70,
      fill: 'yellow',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(star);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```
