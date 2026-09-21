---
title: '形状重绘'
description: '用 shape.draw() 只重绘单个节点而非整个图层。注意该图形会画在当前画布之上，若节点位于其他节点下方或设有透明度则不适用。'
sidebar_position: 8
---

`shape.draw()` 只重绘单个节点。它比 `layer.draw()` 快，但适用面窄得多。

## 用法

通常当你需要更新画布时你应该调用`layer.draw()` 方法。

但在个别情况下，我们也可以通过调用`shape.draw()` 来只更新某个`Konva.Node`而不用更新整个层。
*但请千万记住，在这种情况下，形状将被绘制在当前的画布上。
因此，如果节点位于在其他节点下面或者设置了透明度，就不能使用这种方法了。*

说明：鼠标悬停到的方框会变成高亮状态。
<iframe src="/downloads/code/performance/Shape_Redraw.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Shape Redraw Demo</title>
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

    var BOX_SIZE = 15;
    var box;
    // generate boxes
    for (var ix = 0; ix < width / BOX_SIZE; ix++) {
        for (var iy = 0; iy < height / BOX_SIZE; iy++) {
            box = new Konva.Rect({
                x : ix * BOX_SIZE,
                y : iy * BOX_SIZE,
                width : BOX_SIZE - 1,
                height : BOX_SIZE - 1,
                fill : 'darkgrey',
                stroke : 'white'
            });
            layer.add(box);
        }
    }
    layer.draw();

    // as all boxes stay separately with no overlap
    // and they have no opacity
    // we can call 'box.draw()' and we will have expected result
    // REMEMBER that is this case box will be drawn on top of existing layer
    // without clearing
    layer.on('mouseover', function(evt) {
        var box = evt.target;
        box.fill('#E5FF80');
        box.draw();
    });
    layer.on('mouseout', function(evt) {
        var box = evt.target;
        box.fill('darkgrey');
        box.draw();
    });
</script>

</body>
</html>
```

## 常见问题

### 单个节点重绘为什么会画错？

因为它是**画在当前画布之上**的，不会先清除原来的内容。

这带来两个问题：如果节点位置变了，旧位置的图像还留在画布上，
成了一道残影；如果节点是半透明的，新画的会和旧的叠加，颜色越来越深。

所以它只在「节点原地不动、且不透明」时才可能正确。

### 被其他节点遮挡时会怎样？

重绘的节点会盖到遮挡它的节点上面去。

因为 `shape.draw()` 不管层级，就是在当前画布上画一遍。
原本在它上面的兄弟节点，这一帧就被盖住了，下一次图层重绘才恢复。

画面上表现为闪烁——节点时而在上时而在下。

### 那它到底什么时候有用？

场景相当有限：节点不透明、位置不变、没有任何东西遮挡它、且尺寸不增大。

一个实际例子是仪表盘上原地变色的指示灯——固定位置、不透明、最上层。
除此之外，老老实实用 `layer.draw()` 或依赖自动重绘。

## 与其他方案的取舍

想省重绘开销，`shape.draw()` 几乎总不是正确答案，它的约束太多而收益有限。

**分层**是更可靠的手段：把频繁变化的节点单独放一层，
`layer.draw()` 那一层的成本本来就很低。见[图层管理](/docs/performance/layer-management)。

**`batchDraw()`** 解决的是「重绘太频繁」而不是「重绘范围太大」，
它把一帧内的多次请求合并成一次。见[批量绘制](/docs/performance/batch-draw)。

真要精确控制重绘区域，Canvas 的做法是脏矩形——只清除并重绘变化的那一小块。
Konva 没有内置这个机制，自己实现的复杂度远高于分层，除非有极端性能要求，
否则不值得。
