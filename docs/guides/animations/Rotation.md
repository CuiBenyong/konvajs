---
order: 3
group:
  title: 动画
  order: 6
title: 旋转
description: ''
keywords: []
---

要使用Konva为形状创建旋转动画，我们可以使用`Konva.Animation`创建一个新的动画, 并在每个动画帧中修改形状的旋转角度.

在本教程中，我们将围绕左上角旋转一个蓝色矩形，围绕其自身中心点旋转一个黄色矩形，以及围绕一个外部点旋转一个红色矩形。

有关Konva.Animation的属性和方法的完整列表，请查看<a href="https://konvajs.github.io/api/Konva.Animation.html" target="__blank">Konva.Animation文档</a>。

<iframe src="/downloads/code/animations/Rotation.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Rotation Animation Demo</title>
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
    * at the default which is the top left
    * corner of the rectangle
    */

    var blueRect = new Konva.Rect({
        x: 50,
        y: 75,
        width: 100,
        height: 50,
        fill: '#00D2FF',
        stroke: 'black',
        strokeWidth: 4
    });

    /*
    * move center point to the center
    * of the rectangle with offset
    */
    var yellowRect = new Konva.Rect({
        x: 220,
        y: 75,
        width: 100,
        height: 50,
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: 50,
            y: 25
        }
    });

    /*
    * move center point outside of the rectangle
    * with offset
    */

    var redRect = new Konva.Rect({
        x: 400,
        y: 75,
        width: 100,
        height: 50,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: -100,
            y: 0
        }
    });

    layer.add(blueRect);
    layer.add(yellowRect);
    layer.add(redRect);
    stage.add(layer);

    // one revolution per 4 seconds
    var angularSpeed = 90;
    var anim = new Konva.Animation(function(frame) {
        var angleDiff = frame.timeDiff * angularSpeed / 1000;
        blueRect.rotate(angleDiff);
        yellowRect.rotate(angleDiff);
        redRect.rotate(angleDiff);
    }, layer);

    anim.start();
</script>

</body>
</html>
```