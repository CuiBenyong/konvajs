---
title: 'Regular Polygon 等边多边形'
description: '用 Konva.RegularPolygon 绘制正多边形：sides 指定边数、radius 指定外接圆半径，Konva 10 起还支持 cornerRadius 圆角。'
sidebar_position: 18
---

正多边形只需要边数和半径两个参数，不用自己算顶点坐标。

## 用法

要使用`Konva`添加正多边形, 我们可以实例化一个`Konva.RegularPolygon()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.RegularPolygon.html" target="_blank" >Konva.RegularPolygon</a>文档

<iframe src="/downloads/code/shapes/RegularPolygon.html" style="width: 50vw; height: 300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva RegularPolygon Demo</title>
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
    var stage = new Konva.Stage({
      container: 'container',
      width: 300,
      height: 300
    });

    var layer = new Konva.Layer();

    var hexagon = new Konva.RegularPolygon({
      x: 100,
      y: 150,
      sides: 6,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    layer.add(hexagon);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 圆角

Konva 10 起 `RegularPolygon` 支持 `cornerRadius`，可以把正多边形的尖角磨圆：

```js
const hexagon = new Konva.RegularPolygon({
  x: 100,
  y: 100,
  sides: 6,
  radius: 70,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4,
  cornerRadius: 10,
});
```

`cornerRadius` 不能为负值。Konva 10.4.0 之前负的 `radius` 或 `cornerRadius`
会在绘制时抛错，并导致它之后的图形全部不显示；10.4.0 起改为拒绝该值而不再中断绘制。

## 常见问题

### radius 是边长还是半径？

是**外接圆半径**，即中心到任一顶点的距离，不是边长。

这意味着相同 `radius` 下，边数越多图形看起来越「大」——三角形的三个顶点之间空得多，
而十二边形几乎填满整个外接圆。做一组不同边数的图标时，想让它们视觉大小一致，
需要按边数反推 `radius`，而不是取同一个值。

### sides 设成 2 或不设会怎样？

`sides` 必须至少为 3。Konva 10.4.0 修复了一个相关问题：此前不设置 `sides` 会让
该节点**每次绘制都抛错**，进而中断整个图层的渲染——表现为这个图形之后的所有内容
都不显示，很难定位到根源。

升级到 10.4.0 及以上后不再中断绘制，但仍然应当显式给出 `sides`。

### 第一个顶点朝哪个方向？

默认朝上（12 点方向），与 [`Konva.Star`](/docs/shapes/star) 一致。
用 `rotation` 调整朝向，`x`、`y` 是中心，旋转默认绕中心进行，不需要额外设 `offset`。

## 与其他方案的取舍

正多边形一律用 `RegularPolygon`，不要用 [`Konva.Line`](/docs/shapes/line-polygon)
手算顶点。手算的问题不在于算不出来，而在于边数一改就要重算整个数组，
而且很容易把外接圆半径和边长搞混。

反过来，需要**不规则**多边形——顶点不在同一个圆上、或者边长不等——`RegularPolygon`
就表达不了，这时才用 `Line` 配合 `closed: true` 自己给顶点。

有一种常见的误用是把 `sides` 设到 64 以上来模拟圆形。视觉上确实接近，
但顶点越多绘制越贵，而 [`Konva.Circle`](/docs/shapes/circle) 是浏览器原生的
圆弧绘制，无论如何都更快也更圆。没有理由这样代替。

