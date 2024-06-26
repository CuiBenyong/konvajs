---
order: 15
group:
  title: 图形
  order: 1
title: Arc 弧形
description: ''
keywords: []
---
要使用`Konva`添加弧形, 我们可以实例化一个`Konva.Arc()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.github.io/api/Konva.Arc.html" target="__blank">Konva.Arc</a>文档

<iframe src="/downloads/code/shapes/Arc.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Arc Demo</title>
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

    var arc = new Konva.Arc({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      innerRadius: 40,
      outerRadius: 70,
      angle: 60,
      fill: 'yellow',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(arc);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>

```
