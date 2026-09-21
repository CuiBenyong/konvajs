---
title: 'Polygon 多边形'
description: '用 Konva.Line 配合 closed 为 true 绘制多边形：points 数组按顺序给出各顶点坐标，首尾自动闭合。'
sidebar_position: 6
---

给 `Konva.Line` 加上 `closed: true` 就得到多边形——首尾自动相连，内部可以填充。

## 用法

要使用`Konva`创建一个多边形, 我们可以实例化一个`Konva.Line()`对象和`closed=true`属性.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Line.html" target="_blank">Konva.Line</a>文档

<iframe src="/downloads/code/shapes/Line_-_Polygon.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Line Polygon Demo</title>
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

    var poly = new Konva.Line({
      points: [23, 20, 23, 160, 70, 93, 150, 109, 290, 139, 270, 93],
      fill: '#00D2FF',
      stroke: 'black',
      strokeWidth: 5,
      closed : true
    });

    // add the shape to the layer
    layer.add(poly);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 设置了 fill 为什么没有填充？

多边形必须显式设置 `closed: true`。未闭合的线条即使首尾坐标相同，Konva 也当它是
开放路径，`fill` 不生效。

这和「把最后一个点设成和第一个点一样」不是一回事——那样只是视觉上闭合，
填充规则仍然不启用。

### 自相交的多边形填充结果为什么有空洞？

Canvas 默认按非零环绕规则填充。路径自相交时，被反向环绕两次的区域会被判定为
「在形状之外」而留空。

这不是 bug，是填充规则的定义。如果不想要空洞，调整顶点顺序消除自相交；
如果恰恰想要这个效果（例如画五角星的镂空版），保持自相交即可。

### 多边形的 x、y 是重心吗？

不是。`x`、`y` 是整个 `points` 坐标系的原点偏移量，`points` 里的数值都相对它计算。

所以设置 `rotation` 时，多边形绕的是这个原点而非重心。想绕重心旋转，
需要自己算出重心并设为 `offsetX`、`offsetY`。

## 与其他方案的取舍

**正**多边形不要手算顶点，用 [`Konva.RegularPolygon`](/docs/shapes/regular-polygon)——
给个 `sides` 和 `radius` 就行，改边数时不用重算数组。

不规则多边形用 `Line` 加 `closed: true`，顶点完全由你控制。

如果形状是美术用矢量工具画好的，直接导出 SVG 把 `d` 贴进
[`Konva.Path`](/docs/shapes/path)，比把路径翻译成顶点数组可靠得多——
尤其当路径里含曲线命令时，转成折线顶点必然损失精度。
