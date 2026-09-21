---
title: '缩放'
description: '用 Konva.Animation 实现缩放动画：分别演示 x 轴、y 轴单独缩放与以指定边为基准的缩放，通过每帧修改 scale 完成。'
sidebar_position: 4
---

缩放动画要注意两件事：缩放会同时作用于描边和阴影，以及从 0 开始缩放的陷阱。

## 用法

要使用Konva为形状创建缩放动画，我们可以使用`Konva.Animation`创建一个新的动画, 并在每个动画帧中修改形状的缩放比例.

在本教程中，我们将缩放蓝色六边形的x和y分量，黄色六边形的y分量, 并让红色六边形相对于它的右侧边缩放。

说明：在六边形做动画的同时, 您也能拖拽它们

有关Konva.Animation的属性和方法的完整列表，请查看<a href="https://konvajs.org/api/Konva.Animation.html" target="_blank">Konva.Animation文档</a>。
<iframe src="/downloads/code/animations/Scaling.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
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

## 常见问题

### 缩放之后描边为什么变粗了？

`scale` 是对整个图形做几何变换，描边宽度也在被变换的范围内。
`strokeWidth: 2` 的图形放大两倍，视觉描边就是 4。

不想让描边跟着变，设 `strokeScaleEnabled: false`。这与
[Transformer 缩放时的处理](/docs/select-and-transform/ignore-stroke)是同一个属性。

阴影同理——`shadowBlur` 也会跟着放大，画面可能变得过于模糊。

### 从 scale 为 0 开始动画，图形消失了回不来？

`scaleX(0)` 会让变换矩阵退化，某些图形在这个状态下的后续计算会得到
`NaN`，之后即使把 scale 改回 1 也恢复不了。

做「从无到有」的出现动画时，起始值用一个极小的正数而不是 0：

```js
node.scale({ x: 0.01, y: 0.01 });
node.to({ scaleX: 1, scaleY: 1, duration: 0.3 });
```

视觉上和 0 没有区别，但避开了退化。

### 缩放以哪个点为基准？

以节点的**原点**为基准，也就是 `offset` 所指的位置。

`Konva.Rect` 默认原点在左上角，所以放大时向右下方长；
设了 `offset` 到中心，就变成向四周均匀长。

这与[从中心缩放](/docs/select-and-transform/centered-scaling)那一页
讲的是同一个机制——Transformer 的 `centeredScaling` 本质上也是在
处理基准点的问题。

## 与其他方案的取舍

改变大小有两条路，语义不同。

**改 `scale`** 是几何变换，一切都等比放大——描边、阴影、子节点、文字字形。
适合「整体放大」的语义，比如悬停时的强调效果。

**改 `width` / `height`** 是改变图形本身的尺寸，描边粗细不变，
文字会重新换行而不是被拉伸。适合「改变容器大小」的语义。

两者在文字上的区别最明显，见[缩放文字](/docs/select-and-transform/resize-text)。

性能上 `scale` 更便宜——它只改变换矩阵，不触发图形的重新布局。
对[已缓存](/docs/performance/shape-caching)的节点尤其如此：
缩放只是把同一张位图贴大一点，不需要重建缓存（代价是放大后会糊）。
