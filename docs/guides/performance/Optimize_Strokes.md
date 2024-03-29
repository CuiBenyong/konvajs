---
order: 5
group:
  title: 性能优化
  order: 9
title: 描边绘制优化
description: ''
keywords: []
---

### 从命中检测中删除描边

如果您的图形同时拥有填充和非常小的描边, 您可以通过设置`shape.strokeHitEnabled(false)`将描边从命中检测区域中删除.
如果描边对于命中检测至关重要，请不要使用此属性。

### 禁用描边阴影

如果您真的不需要描边的阴影, 你可以设置`shape.shadowForStrokeEnabled(false)`。
请记住，如果您创建`Konva.Line`时没有设置填充属性，阴影也将会被禁用。


<iframe src="/downloads/code/performance/Optimize_Strokes.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Optimizing Strokes Demo</title>
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
    stage.add(layer);

    var n = 100, shape;
    for (var i = 0; i < n; i++) {
        shape = new Konva.Circle({
            x : stage.width() * Math.random(),
            y : stage.height() * Math.random(),
            radius : 10 + 10 * Math.random(),
            fill : Konva.Util.getRandomColor(),
            stroke : 'black',
            shadowColor : 'black',
            draggable : true,
            shadowOffset : {
                x : 5,
                y : 5
            }
        });
        layer.add(shape);
    }

    var drawTimes = 30;
    console.time('default params');
    for(i = 0; i < drawTimes; i++) {
        layer.draw();
    }
    console.timeEnd('default params');

    layer.children.each(function(shape) {
        shape.strokeHitEnabled(false);
    });

    console.time('strokeHitEnabled = false');
    for(i = 0; i < drawTimes; i++) {
        layer.draw();
    }
    console.timeEnd('strokeHitEnabled = false');

    layer.children.each(function(shape) {
        shape.strokeHitEnabled(true);
        shape.shadowForStrokeEnabled(false)
    });

    console.time('shadowForStrokeEnabled = false');
    for(i = 0; i < drawTimes; i++) {
        layer.draw();
    }
    console.timeEnd('shadowForStrokeEnabled = false');


    layer.children.each(function(shape) {
        shape.strokeHitEnabled(false);
        shape.shadowForStrokeEnabled(false);
    });

    console.time('shadowForStrokeEnabled = false, strokeHitEnabled = false');
    for(i = 0; i < drawTimes; i++) {
        layer.draw();
    }
    console.timeEnd('shadowForStrokeEnabled = false, strokeHitEnabled = false');
</script>

</body>
</html>
```
