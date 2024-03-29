---
order: 4
group:
  title: 性能优化
  order: 9
title: 动画优化
description: ''
keywords: []
---

如果你动画中的某些帧没有发生更新（没有节点的状态发生更改），则可以在动画函数直接`return false`。

这样的话，Konva将不会更新图层。

<iframe src="/downloads/code/performance/Optimize_Animation.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Optimize Animation Demo</title>
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

    // we have animation that do nothing in some cases
    var anim = new Konva.Animation(function(frame) {
        if ((frame.time % (period * 2)) < period) {
            // regular update
            hexagon.x(amplitude * Math.cos(frame.time * 2 * Math.PI / period) + centerX);
        } else {
            // this is "pause" phase
            // we don't need update layer in this case
            // so return false and Konva will skip layer draw
            return false;
        }
    }, layer);

    anim.start();
</script>

</body>
</html>
```
