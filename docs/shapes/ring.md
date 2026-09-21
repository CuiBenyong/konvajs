---
title: 'Ring 环形'
description: '用 Konva.Ring 绘制环形：innerRadius 与 outerRadius 分别定义内外半径，常用于进度环与甜甜圈图。'
sidebar_position: 14
---

环形是挖空了中心的圆，常用于进度环、甜甜圈图这类需要「中间留白」的场景。

## 用法

要使用`Konva`添加环形, 我们可以实例化一个`Konva.Ring()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Ring.html" target="_blank">Konva.Ring</a>文档

<iframe src="/downloads/code/shapes/Ring.html" style="width: 50vw;height:300px;"></iframe>


```html
/**
 * shapes/Ring.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Ring Demo</title>
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

    var ring = new Konva.Ring({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      innerRadius: 40,
      outerRadius: 70,
      fill: 'yellow',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(ring);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 设置了 innerRadius 却什么都没画出来？

检查 `innerRadius` 是不是大于或等于 `outerRadius`。两者相等时环的宽度为零，
大于时形状无效，两种情况都是什么都不显示，而且不会报错。

这在用变量计算半径时尤其容易发生，例如按百分比算内径却忘了它是相对外径的。

### 环形的 x、y 是圆心吗？

是圆心，和 [`Circle`](/docs/shapes/circle) 一致。所有以「半径」定义的图形
（`Circle`、`Ring`、`Wedge`、`Arc`、`Star`、`RegularPolygon`）都以中心定位，
只有 `Rect`、`Image`、`Text` 用左上角。

### 怎么画只有一部分的环，比如进度环？

`Konva.Ring` 总是完整的一圈，没有起止角度。要画一段环用
[`Konva.Arc`](/docs/shapes/arc)，它同时有 `innerRadius`、`outerRadius` 和 `angle`，
正是为这个场景准备的。

典型做法是底下铺一个灰色 `Ring` 当轨道，上面叠一个彩色 `Arc` 表示进度。

## 与其他方案的取舍

完整圆环用 `Ring`，一段圆环用 [`Arc`](/docs/shapes/arc)，两者都是真正挖空的，
放在任何背景上都正确。

不要用「大圆 + 背景色小圆」模拟环形。它在纯色背景上看着没问题，但只要环形本身
带了透明度、或者下面有图片、或者需要导出成带透明通道的 PNG，中间那块「假挖空」
就会暴露成一个实心色块。

需要更复杂的挖空形状（比如非圆形的孔）时，用 [`Path`](/docs/shapes/path) 配合
SVG 的填充规则，或者用容器的 `clipFunc`。
