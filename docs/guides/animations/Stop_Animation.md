---
order: 6
group:
  title: 动画
  order: 6
title: 停止动画
description: ''
keywords: []
---

要使用Konva停止动画，我们可以使用`stop()`方法。要重新启动动画，我们可以再次调用`start()`。

说明：单击“开始”开始动画，单击“停止”停止动画。

有关Konva.Animation的属性和方法的完整列表，请查看[Konva.Animation文档](https://konvajs.github.io/api/Konva.Animation.html)。


<iframe src="/downloads/code/animations/Stop_Animation.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Stop Animation Demo</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #F0F0F0;
        }
        #buttons {
            position: absolute;
            top: 5px;
            left: 10px;
        }
        #buttons > input {
            padding: 10px;
            display: block;
            margin-top: 5px;
        }
    </style>
</head>
<body>
<div id="container"></div>
<div id="buttons">
    <input type="button" id="start" value="Start">
    <input type="button" id="stop" value="Stop">
</div>
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
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
    });

    layer.add(hexagon);
    stage.add(layer);

    var amplitude = 150;
    // in ms
    var period = 2000;
    var centerX = stage.getWidth() / 2;

    var anim = new Konva.Animation(function(frame) {
        hexagon.setX(amplitude * Math.sin(frame.time * 2 * Math.PI / period) + centerX);
    }, layer);

    document.getElementById('start').addEventListener('click', function() {
        anim.start();
    }, false);

    document.getElementById('stop').addEventListener('click', function() {
        anim.stop();
    }, false);
</script>

</body>
</html>
```