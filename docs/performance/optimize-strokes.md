---
title: '描边绘制优化'
description: '优化 Konva 描边性能：图形同时有填充与极细描边时，用 strokeHitEnabled(false) 把描边移出命中检测。描边对命中判定关键时不要使用。'
sidebar_position: 5
---

描边会同时进入场景图和命中图。多数时候，命中图上那一份是可以省掉的。

## 用法

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
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
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

    layer.children.forEach(function(shape) {
        shape.strokeHitEnabled(false);
    });

    console.time('strokeHitEnabled = false');
    for(i = 0; i < drawTimes; i++) {
        layer.draw();
    }
    console.timeEnd('strokeHitEnabled = false');

    layer.children.forEach(function(shape) {
        shape.strokeHitEnabled(true);
        shape.shadowForStrokeEnabled(false)
    });

    console.time('shadowForStrokeEnabled = false');
    for(i = 0; i < drawTimes; i++) {
        layer.draw();
    }
    console.timeEnd('shadowForStrokeEnabled = false');


    layer.children.forEach(function(shape) {
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

## 常见问题

### strokeHitEnabled 关掉之后有什么变化？

命中图上不再绘制描边，只有填充区域可点。视觉上毫无变化。

对一个有填充的图形来说，描边只是它边缘那几个像素，把它排除在命中之外
用户几乎察觉不到。但命中图少画一遍描边，尤其是复杂路径的描边，
省下的时间很实在。

### 什么时候不能关？

描边本身就是可点区域的时候。最典型的是**没有填充的线条**——
一条 `Konva.Line` 全部的存在就是那条描边，关掉命中就完全点不中了。

另一类是描边很粗、用户预期能点到边框的场景，比如边框本身是一个可拖拽的手柄。

判断依据：去掉描边后，剩下的填充区域还够不够用户点。

### 线条太细点不中怎么办？

不是关掉描边命中，而是**放大**它——用 `hitStrokeWidth`：

```js
line.hitStrokeWidth(20);
```

视觉上仍是 1 像素的细线，命中区域却有 20 像素宽，手感立刻变好。
这在流程图连线、图表坐标轴这类场景里几乎是必备设置。

更精细的控制见[自定义事件监听范围](/docs/events/custom-hit-region)。

## 与其他方案的取舍

三种手段针对的是不同问题，不要混淆：

**`strokeHitEnabled(false)`** 省的是命中图上绘制描边的开销，适合「有填充、
描边只是装饰」的图形。改动最小，风险最低。

**`hitStrokeWidth`** 解决的是反过来的问题——描边太细点不中。它不省开销，
是为了手感。

**自定义 `hitFunc`** 最灵活也最麻烦，适合形状复杂、需要大幅简化命中区域的场景。
比如一个上百顶点的路径，命中用一个矩形近似就够了。

还有一个更彻底的选项：这个图形压根不需要响应事件，那就
[`listening(false)`](/docs/performance/listening-false)，连命中图都不进。
