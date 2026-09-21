---
title: 'Ellipse 椭圆'
description: '用 Konva.Ellipse 绘制椭圆：radiusX 与 radiusY 分别定义横纵半径，x、y 为中心点坐标。'
sidebar_position: 3
---

椭圆由两个半轴定义，和圆形一样以中心定位。

## 用法

要使用`Konva`创建一个椭圆, 我们可以实例化一个`Konva.Ellipse()`对象.  

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Ellipse.html" target="_blank">Konva.Ellipse</a>文档

<iframe src="/downloads/code/shapes/Ellipse.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Ellipse Demo</title>
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


    var oval = new Konva.Ellipse({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        radius: {
            x: 100,
            y: 50
        },
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(oval);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### radiusX 是半轴还是直径？

是**半轴**，即从中心到边缘的距离，与 `Konva.Circle` 的 `radius` 口径一致。

想画一个宽 200、高 100 的椭圆，应该写 `radiusX: 100, radiusY: 50`。
误当成直径填写是最常见的错误，结果是图形大了一倍。

### 怎么画一个倾斜的椭圆？

用 `rotation` 属性，单位默认是角度。

不要通过交换 `radiusX` 与 `radiusY` 来「转 90 度」——那样得到的确实是另一个方向的
椭圆，但描边宽度、阴影偏移、渐变方向都不会跟着转，一旦这些属性非默认值，
结果就和预期不符了。

### scaleX 和增大 radiusX 有什么区别？

几何轮廓上两者等价，但 `scale` 会连同描边一起缩放。`strokeWidth: 2` 的椭圆在
`scaleX: 2` 之后，横向的描边视觉宽度变成 4，纵向仍是 2，看起来是歪的。

要改变形状就改半轴；`scale` 留给需要整体（含描边）一起放大的场合，
比如悬停时的放大反馈。

## 与其他方案的取舍

正圆用 [`Circle`](/docs/shapes/circle)，它少一个属性、语义更清楚。椭圆用 `Ellipse`，
不要用 `Circle` + `scale` 代替，理由见上面关于描边失真的说明。

需要椭圆的一段弧时 Konva 没有现成图形，得用 [`Konva.Path`](/docs/shapes/path) 的
`A` 命令手写——SVG 的椭圆弧命令支持两个不同的半径，正好对应这个需求。
