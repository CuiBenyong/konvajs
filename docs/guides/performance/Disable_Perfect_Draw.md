---
order: 6
group:
  title: 性能优化
  order: 9
title: 关闭 Perfect Drawing
description: ''
keywords: []
---

在某些情况下，直接在canvas画布上绘图出现意外的结果。
例如，我们绘制一个形状, 并且同时设置了填充, 描边和透明度. 由于描边在填充的上面绘制,因此描边和填充交叉的部分, 会出现一条颜色加深的细线.

这可能这不是你所期望的, 所以KonvaJS使用缓冲区画布来修复了这种行为。

在这种情况下KonvaJS是这样做的：

1. 在缓冲区画布上绘制形状
2. 在没有设置透明度的情况下, 绘制描边和填充
3. 将透明度设置到图层上
4. 将缓冲区画布上绘制好的形状绘制到当前画布上

但是使用缓冲区画布可能会降低性能。你可以使用下面的代码来禁用它：

```javascript
shape.perfectDrawEnabled(false);
```

看看有什么区别:

<iframe src="/downloads/code/performance/Disable_Perfect_Draw.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Disable Perfect Drawing Demo</title>
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

    var group1 = new Konva.Group({
        x : 50,
        y : 50
    });
    layer.add(group1);
    var lebel1 = new Konva.Text({
        text : 'Shape with defaul drawing behaviour'
    });
    group1.add(lebel1)
    var rect = new Konva.Rect({
        y : 20,
        width: 100,
        height: 50,
        fill: 'green',
        stroke: 'black',
        strokeWidth: 10,
        opacity : 0.5
    });
    group1.add(rect);


    var group1 = new Konva.Group({
        x : 200,
        y : 100
    });
    layer.add(group1);
    var lebel1 = new Konva.Text({
        text : 'Shape with perfectDrawEnabled = false'
    });
    group1.add(lebel1)
    var rect = new Konva.Rect({
        y : 20,
        width: 100,
        height: 50,
        fill: 'green',
        stroke: 'black',
        strokeWidth: 10,
        opacity : 0.5,
        perfectDrawEnabled : false
    });
    group1.add(rect);

    layer.draw();

</script>

</body>
</html>
```
