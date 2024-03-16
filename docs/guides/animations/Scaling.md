---
order: 4
group:
  title: 动画
  order: 6
title: 缩放
description: ''
keywords: []
---

要使用Konva为形状创建缩放动画，我们可以使用`Konva.Animation`创建一个新的动画, 并在每个动画帧中修改形状的缩放比例.

在本教程中，我们将缩放蓝色六边形的x和y分量，黄色六边形的y分量, 并让红色六边形相对于它的右侧边缩放。

说明：在六边形做动画的同时, 您也能拖拽它们

有关Konva.Animation的属性和方法的完整列表，请查看[Konva.Animation文档](https://konvajs.github.io/api/Konva.Animation.html)。


<iframe src="/downloads/code/animations/Scaling.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Scale Animation Demo</title>
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

    /*
    * leave center point positioned
    * at the default which is at the center
    * of the hexagon
    */
    var blueHex = new Konva.RegularPolygon({
        x: 50,
        y: stage.getHeight() / 2,
        sides: 6,
        radius: 40,
        fill: '#00D2FF',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
    });

    var yellowHex = new Konva.RegularPolygon({
        x: 150,
        y: stage.getHeight() / 2,
        sides: 6,
        radius: 50,
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
    });

    /*
    * move center point to right side
    * of hexagon
    */
    var redHex = new Konva.RegularPolygon({
        x: 300,
        y: stage.getHeight() / 2,
        sides: 6,
        radius: 50,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: 50,
            y: 0
        },
        draggable: true
    });

    layer.add(blueHex);
    layer.add(yellowHex);
    layer.add(redHex);
    stage.add(layer);

    var period = 2000;

    var anim = new Konva.Animation(function(frame) {
        var scale = Math.sin(frame.time * 2 * Math.PI / period) + 0.001;
        // scale x and y
        blueHex.scale({ x :scale, y : scale});
        // scale only y
        yellowHex.scaleY(scale);
        // scale only x
        redHex.scaleX(scale);
    }, layer);

    anim.start();
</script>

</body>
</html>
```