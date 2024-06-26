---
order: 4
group:
  title: 图形
  order: 1
title: Wedge 扇形
description: ''
keywords: []
---



要使用`Konva`创建一个扇形, 我们可以实例化一个`Konva.Wedge()`对象.  

有关属性和方法的完整列表,请参阅<a href="https://konvajs.github.io/api/Konva.Wedge.html" target="__blank" >Konva.Wedge</a>文档


<iframe src="/downloads/code/shapes/Wedge.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Wedge Demo</title>
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

    var wedge = new Konva.Wedge({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      radius: 70,
      angle: 60,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4,
      rotation: -120
    });

    // add the shape to the layer
    layer.add(wedge);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```
