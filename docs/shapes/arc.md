---
title: 'Arc 弧形'
description: '用 Konva.Arc 绘制弧形：由 innerRadius、outerRadius、angle 与 clockwise 定义，可做成环形的一段或扇环。'
sidebar_position: 15
---

弧形是圆环的一段，由内外半径和张角定义，进度环、仪表盘都靠它实现。

## 用法

要使用`Konva`添加弧形, 我们可以实例化一个`Konva.Arc()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Arc.html" target="_blank">Konva.Arc</a>文档

<iframe src="/downloads/code/shapes/Arc.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Arc Demo</title>
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

    var arc = new Konva.Arc({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      innerRadius: 40,
      outerRadius: 70,
      angle: 60,
      fill: 'yellow',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(arc);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>

```

## 常见问题

### Arc 和 Wedge 有什么区别？

`Arc` 有 `innerRadius`，画出来是**环的一段**，中间是空的；
[`Wedge`](/docs/shapes/wedge) 从圆心张开，画出来是**实心的扇形**，像一块披萨。

做进度环、仪表盘用 `Arc`；做饼图用 `Wedge`。把 `Arc` 的 `innerRadius` 设为 0
确实也能得到扇形，但语义上不如直接用 `Wedge` 清楚。

### 设置了 clockwise 之后起止位置全乱了？

`clockwise: true` 会让弧从起始角度**反向**扫过 `angle` 度。也就是说，
同样的 `rotation` 与 `angle`，翻转 `clockwise` 后弧出现在圆的另一侧。

比较稳妥的做法是先只调 `rotation` 把起点摆对，再决定 `clockwise`，
而不是两个一起试。

### 进度为 0 时为什么还残留一个点？

`angle: 0` 的弧虽然没有面积，但它仍然是一条有效路径。如果设了 `stroke`，
描边会在起点位置画出一个小点或短线。

正确做法是进度为 0 时整个隐藏该节点（`visible(false)`），而不是把角度设成 0。
这同时也省掉了一次无意义的绘制。

## 与其他方案的取舍

完整圆环用 [`Ring`](/docs/shapes/ring)，一段圆环用 `Arc`，实心扇形用
[`Wedge`](/docs/shapes/wedge)。这三个覆盖了绝大多数圆形相关的需求，
都不需要手写路径。

`Konva.Path` 的 `A`（椭圆弧）命令更灵活——它支持长短半径不同、可以任意旋转，
还能和其他路径命令拼接。代价是没有 `innerRadius` 这种现成语义，
画环的一段要自己算出内外两条弧并闭合。只在 `Arc` 表达不了时才值得这样做。
