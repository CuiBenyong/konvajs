---
title: '关闭 Perfect Drawing'
description: '关闭 Konva 的完美绘制：同时设置填充、描边与透明度时，引擎会启用缓冲画布消除交叠处的深色细线，用 perfectDrawEnabled(false) 可省去这层开销。'
sidebar_position: 6
---

「完美绘制」为了消除描边与填充交叠处的色差而引入一层缓冲画布。不需要它时可以关掉。

## 用法

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
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
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

## 常见问题

### 它到底在解决什么问题？

同时设置 `fill`、`stroke` 和 `opacity` 时，描边画在填充之上，
两者交叠的半个描边宽度内颜色会叠加，形成一条比预期更深的边。

Konva 的做法是先把图形画到一张离屏画布上，合成好之后再整体以指定透明度贴回来，
交叠处因此不会叠加。代价是多了一次离屏绘制和一次合成。

### 什么情况下可以安全关掉？

满足以下任一条件时，这层处理本就没有作用，关掉是净收益：

- 图形**只有填充没有描边**，或只有描边没有填充
- 图形**不透明**（`opacity` 为 1）——不透明时描边覆盖填充，本来就不会叠加

换句话说，只有「半透明 + 同时有填充和描边」这一种组合才需要它。

### 关掉之后会看到什么变化？

如果图形确实属于上面说的需要它的那类，关掉后会在填充与描边的交界处
看到一圈略深的轮廓。程度取决于透明度——`opacity: 0.5` 时最明显。

判断办法很直接：关掉，看一眼。看不出区别就说明本来就不需要。

## 性能提示

收益大小取决于图形数量与尺寸。每个启用完美绘制的图形，每帧都要多一次
离屏绘制加一次合成——离屏画布的尺寸与图形包围盒相关，大图形代价更高。

几个实用做法：

**批量关闭**。如果整个应用里没有半透明描边图形，可以在创建时统一设
`perfectDrawEnabled: false`，不必逐个判断。

**优先照顾动态内容**。静态图形通常已经被缓存，完美绘制只在建缓存时跑一次，
关不关差别不大。真正值得关的是每帧都在重绘的那些。

**和描边优化一起做**。[描边绘制优化](/docs/performance/optimize-strokes)里的
`strokeHitEnabled(false)` 省的是命中图的开销，与这里省的绘制开销是两笔账，
两个一起关收益叠加。
