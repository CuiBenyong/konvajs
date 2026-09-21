---
title: 'Line Join 边角'
description: '用 Konva 的 lineJoin 属性设置线段拐角样式：miter 尖角（默认）、bevel 斜角、round 圆角。'
sidebar_position: 5
---

要为`Konva`的形状设置线连接，我们可以在实例化形状时设置`lineJoin`属性，或者我们可以使用`lineJoin（）`方法。

`lineJoin`属性可以设置为尖角，斜角或圆。 除非另有说明，否则默认线连接为尖角。

说明：鼠标经过三角形以更改其线连接点样式。  

<iframe src="/downloads/code/styling/Line_Join.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Line Join Demo</title>
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

        var triangle = new Konva.RegularPolygon({
            x: stage.getWidth() / 2,
            y: stage.getHeight() / 2,
            sides: 3,
            radius: 70,
            fill: 'red',
            stroke: 'black',
            strokeWidth: 20,
            lineJoin: 'bevel'
        });

        triangle.on('mouseover', function() {
            this.lineJoin('round');
            layer.draw();
        });

        triangle.on('mouseout', function() {
            this.lineJoin('bevel');
            layer.draw();
        });

        // add the shape to the layer
        layer.add(triangle);

        // add the layer to the stage
        stage.add(layer);
  </script>

</body>
</html>
```