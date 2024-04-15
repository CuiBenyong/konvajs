---
order: 18
group:
  title: 图形
  order: 1
title: Regular Polygon 等边多边形
description: ''
keywords: []
---

要使用`Konva`添加正多边形, 我们可以实例化一个`Konva.RegularPolygon()`对象.

有关属性和方法的完整列表,请参阅[Konva.RegularPolygon](https://konvajs.github.io/api/Konva.RegularPolygon.html){target="_blank"}文档


<iframe src="/downloads/code/shapes/RegularPolygon.html" style="width: 50vw; height: 300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva RegularPolygon Demo</title>
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

    var hexagon = new Konva.RegularPolygon({
      x: 100,
      y: 150,
      sides: 6,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    layer.add(hexagon);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```