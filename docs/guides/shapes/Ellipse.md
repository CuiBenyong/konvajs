---
order: 3
group:
  title: 图形
  order: 1
title: Ellipse 椭圆
description: ''
keywords: []
---

要使用`Konva`创建一个椭圆, 我们可以实例化一个`Konva.Ellipse()`对象.  

有关属性和方法的完整列表,请参阅<a href="https://konvajs.github.io/api/Konva.Ellipse.html" target="__blank">Konva.Ellipse</a>文档

<iframe src="/downloads/code/shapes/Ellipse.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Ellipse Demo</title>
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


    var oval = new Konva.Ellipse({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        radius: {
            x: 100,
            y: 50
        },
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(oval);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

