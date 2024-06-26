---
order: 19
group:
  title: 图形
  order: 1
title: Arrow 箭头
description: ''
keywords: []
---

要使用`Konva`创建箭头, 我们可以实例化一个`Konva.Arrow()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.github.io/api/Konva.Arrow.html" target="__blank">Konva.Arrow</a>文档


<iframe src="/downloads/code/shapes/Arrow.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Arrow Demo</title>
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

    var arrow = new Konva.Arrow({
      x: stage.getWidth() / 4,
      y: stage.getHeight() / 4,
      points: [0,0, width / 2, height / 2],
      pointerLength: 20,
      pointerWidth : 20,
      fill: 'black',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(arrow);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```