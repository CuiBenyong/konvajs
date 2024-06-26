---
order: 2
group:
  title: 样式
  order: 2
title: Stroke 笔画
description: ''
keywords: []
---

要使用`Konva`设置绘制形状和笔画宽度,我们可以在实例化形状时设置`stroke`和`strokeWidth`属性,也可以使用`stroke()`和`strokeWidth()`方法



说明：鼠标经过五边形以更改其笔画颜色和宽度。


<iframe src="/downloads/code/styling/Stroke.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Stroke Demo</title>
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
            strokeWidth: 4
        });

        pentagon.on('mouseover', function() {
            this.stroke('blue');
            this.strokeWidth(20);
            layer.draw();
        });

        pentagon.on('mouseout', function() {
            this.stroke('black');
            this.strokeWidth(4);
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