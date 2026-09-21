---
title: 'Circle 圆形'
description: '用 Konva.Circle 绘制圆形：radius 定义半径，x、y 为圆心坐标，可设置 fill、stroke 与 strokeWidth。'
sidebar_position: 2
---

圆形的定位方式与矩形不同，`x`、`y` 指的是圆心——这是初学 Konva 时最容易混淆的一处。

## 用法

要使用`Konva`创建一个圆形, 我们可以实例化一个`Konva.Circle()`对象.  

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Circle.html" target="_blank">Konva.Circle</a>文档

<iframe src="/downloads/code/shapes/Circle.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * shapes/circle.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Circle Demo</title>
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

    var circle = new Konva.Circle({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(circle);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 圆形的 x、y 是圆心还是外接矩形的左上角？

是**圆心**。这和 `Konva.Rect` 正好相反，后者的 `x`、`y` 是左上角。

同一个场景里混用矩形和圆形时，这个差异会让布局计算频频出错。一个实用的习惯是：
凡是以中心定位的图形（`Circle`、`Ellipse`、`Ring`、`Wedge`、`Star`、`RegularPolygon`），
心里都按「中心」记；只有 `Rect`、`Image`、`Text` 是左上角。

### 为什么没有 radiusX 和 radiusY？

`Konva.Circle` 只有一个 `radius`，按定义它就是正圆。需要长短轴不同的形状时用
[`Konva.Ellipse`](/docs/shapes/ellipse)，它提供 `radiusX` 与 `radiusY`。

不要用 `scaleX` 把圆压扁来代替椭圆——缩放会同时作用在描边上，`strokeWidth: 2`
横向看起来会比纵向粗。

### getClientRect 量出来的尺寸比 radius × 2 大？

描边是以路径为中线向两侧各画一半的，所以带 `strokeWidth: 4` 的圆，实际占据的
范围比直径大 4 像素（两侧各 2）。`getClientRect()` 返回的是包含描边与阴影的
视觉包围盒。

只想要几何尺寸时用 `getSelfRect()`，它不计描边。做碰撞检测或自动布局时，
选错这两个方法会带来几像素的系统性偏差。

## 与其他方案的取舍

画正圆一定用 `Circle`，它的绘制路径最短。需要椭圆时用 `Ellipse` 而不是给 `Circle`
加 `scale`，原因见上面关于描边失真的说明。

想画圆环或圆环的一段，不要用「大圆叠一个背景色小圆」的做法——在半透明背景或
有底图的场景下会立刻露馅。完整圆环用 [`Konva.Ring`](/docs/shapes/ring)，
一段圆环用 [`Konva.Arc`](/docs/shapes/arc)，两者都是真正挖空的。

另外，`RegularPolygon` 把 `sides` 设到 64 以上视觉上也接近圆，但顶点越多绘制越贵，
没有理由这样代替 `Circle`。
