---
order: 3
group:
  title: 样式
  order: 2
title: Opacity 透明度
description: ''
keywords: []
---

要使用`Konva`设置图形的不透明度,我们可以在实例化形状时设置`opacity`属性,也可以使用`opacity()`方法  

图形可以具有0和1之间的不透明度值，其中0是完全透明的，1是完全不透明的。 除非另有说明，否则所有形状都默认使用不透明度值1。


说明：鼠标经过五边形以更改其透明度。


<iframe src="/downloads/code/styling/Opacity.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Opacity Demo</title>
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

        var pentagon = new Konva.RegularPolygon({
            x: stage.getWidth() / 2,
            y: stage.getHeight() / 2,
            sides: 5,
            radius: 70,
            fill: 'red',
            stroke: 'black',
            strokeWidth: 4,
            opacity: 0.5
        });

        pentagon.on('mouseover', function() {
            this.opacity(1);
            layer.draw();
        });

        pentagon.on('mouseout', function() {
            this.opacity(0.5);
            layer.draw();
        });

        // add the shape to the layer
        layer.add(pentagon);

        // add the layer to the stage
        stage.add(layer);
  </script>

</body>
</html>
```