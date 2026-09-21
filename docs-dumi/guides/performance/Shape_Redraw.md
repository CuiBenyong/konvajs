---
order: 8
group:
  title: 性能优化
  order: 9
title: 形状重绘
description: ''
keywords: []
---
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
    <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
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
