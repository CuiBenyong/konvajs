---
title: 'Line Join 边角'
description: '用 Konva 的 lineJoin 属性设置线段拐角样式：miter 尖角（默认）、bevel 斜角、round 圆角。'
sidebar_position: 5
---

`lineJoin` 决定折线拐角的形状。默认的尖角在锐角处会伸出很长，需要留意。

## 用法

要为`Konva`的形状设置线连接，我们可以在实例化形状时设置`lineJoin`属性，或者我们可以使用`lineJoin（）`方法。

`lineJoin`属性可以设置为尖角，斜角或圆。 除非另有说明，否则默认线连接为尖角。

说明：鼠标经过三角形以更改其线连接点样式。
<iframe src="/downloads/code/styling/Line_Join.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Line Join Demo</title>
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

        var triangle = new Konva.RegularPolygon({
            x: stage.getWidth() / 2,
            y: stage.getHeight() / 2,
            sides: 3,
            radius: 70,
            fill: 'red',
            stroke: 'black',
            strokeWidth: 20,
            lineJoin: 'bevel'
        });

        triangle.on('mouseover', function() {
            this.lineJoin('round');
            layer.draw();
        });

        triangle.on('mouseout', function() {
            this.lineJoin('bevel');
            layer.draw();
        });

        // add the shape to the layer
        layer.add(triangle);

        // add the layer to the stage
        stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 三种取值该怎么选？

`miter`（尖角，默认）适合直角和钝角，视觉上最锐利；
`round`（圆角）适合手绘风格、粗线条，任何角度都平滑；
`bevel`（斜角）是把尖角削平，介于两者之间。

实践中：技术图纸、流程图用 `miter`；手写笔迹、涂鸦用 `round`；
不确定角度范围又不想处理尖刺时用 `bevel`。

### 为什么锐角处伸出一根很长的刺？

这是 `miter` 的固有行为——两条边的外侧延长线相交，角度越尖交点越远。
接近 180 度的折返时，尖角可以长到几十倍线宽。

用 `miterLimit` 限制：超过这个比例时自动退化为 `bevel`。
Canvas 的默认值是 10，需要更保守就调小。

或者干脆对可能出现锐角的线条用 `round`。

### 设了但看不出效果？

`lineJoin` 只作用于**折线的拐角**。单段直线没有拐角，自然没有区别。

另外它和 `lineCap` 是两回事：前者管中间的连接处，后者管线条的两端。
想让线头也是圆的，要单独设 `lineCap: 'round'`。

## 与其他方案的取舍

`lineJoin` 与 `lineCap` 分工明确：连接处 vs 端点。
做手绘笔迹这类效果时通常两个都设为 `round`，否则线段的起止端会是方的，
与圆润的拐角不协调。

如果你需要的是「每一段线都有独立的端点样式」，那 `Konva.Line` 做不到——
它是一条连续路径。得拆成多个节点，或者用 [`Konva.Path`](/docs/shapes/path) 写多段子路径。

性能上三种取值差别很小，不必为此纠结。真正影响性能的是线条的顶点数量，
以及是否开了阴影。
