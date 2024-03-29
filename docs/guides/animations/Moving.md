---
order: 2
group:
  title: 动画
  order: 6
title: 移动
description: ''
keywords: []
---

要使用Konva为形状设置移动动画，我们可以使用`Konva.Animation`创建一个新的动画, 并在每个动画帧中修改形状的位置。

有关Konva.Animation的属性和方法的完整列表，请查看[Konva.Animation文档](https://konvajs.github.io/api/Konva.Animation.html)。

<iframe src="/downloads/code/animations/Moving.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Animate Position Demo</title>
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

    var hexagon = new Konva.RegularPolygon({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        sides: 6,
        radius: 20,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
    });

    layer.add(hexagon);
    stage.add(layer);

    var amplitude = 100;
    var period = 2000;
    // in ms
    var centerX = stage.getWidth() / 2;

    var anim = new Konva.Animation(function(frame) {
        hexagon.setX(amplitude * Math.sin(frame.time * 2 * Math.PI / period) + centerX);
    }, layer);

    anim.start();
</script>

</body>
</html>
```