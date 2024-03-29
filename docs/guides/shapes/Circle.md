---
order: 2
group:
  title: 图形
  order: 1
title: Circle 圆形
description: ''
keywords: []
---

要使用`Konva`创建一个圆形, 我们可以实例化一个`Konva.Circle()`对象.  

有关属性和方法的完整列表,请参阅[Konva.Circle](https://konvajs.github.io/api/Konva.Circle.html)文档

<iframe src="/downloads/code/shapes/Circle.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * shapes/circle.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Circle Demo</title>
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

    var circle = new Konva.Circle({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(circle);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```