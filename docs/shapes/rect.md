---
title: 'Rect 矩形'
description: '用 Konva.Rect 绘制矩形：设置位置、宽高、填充与描边，并可通过 cornerRadius 指定统一圆角或四角独立的圆角数组。'
sidebar_position: 1
---

矩形是 Konva 里最常用的图形，也是理解其他图形定位方式的起点。

## 用法

要使用`Konva`创建一个矩形, 我们可以实例化一个`Konva.Rect()`对象.  

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Rect.html" target="_blank">Konva.Rect</a>文档

`cornerRadius` 既可以是一个数字（四角统一），也可以是 `[左上, 右上, 右下, 左下]` 形式的数组。

<iframe src="/downloads/code/shapes/rect.html" style="width: 50vw; height: 200px;"></iframe>


```html
/**
 * shapes/rect.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Rect Demo</title>
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

    var rect = new Konva.Rect({
      x: 50,
      y: 50,
      width: 100,
      height: 50,
      fill: 'green',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(rect);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 为什么设置了 rotation，矩形像是绕着左上角在转？

`Konva.Rect` 的 `x`、`y` 是**左上角**坐标，不是中心点——这一点和 `Konva.Circle`、
`Konva.Ellipse` 正好相反，后两者的 `x`、`y` 指的是圆心。所以给矩形设置 `rotation` 时，
它默认绕左上角旋转。

想让它绕自身中心旋转，把 `offsetX` 设为宽的一半、`offsetY` 设为高的一半。注意设置
`offset` 之后，`x`、`y` 的含义也随之变成了中心点位置，原有的定位代码要一起调整。

### 描边为什么比设定的粗一点、边缘还发虚？

Canvas 的描边是以路径为中线、向两侧各画一半的。`strokeWidth: 1` 的竖线如果落在整数
坐标上，就会横跨相邻两个像素、各画半格，视觉上呈现为两像素宽的灰线。

把坐标偏移半个像素（例如 `x: 50.5`）可以让 1 像素的描边正好落在单个物理像素内。
这是 Canvas 的固有行为，不是 Konva 的问题，画网格线、表格边框时尤其明显。

### 设置了 fill 却什么都看不到？

先确认三件事：图形已经 `layer.add(rect)`、图层已经 `stage.add(layer)`、
以及 `width` 与 `height` 都给了非零值。

`Konva.Rect` 不像 CSS 盒子会有内容撑开的默认尺寸，宽高必须显式给出，缺省时为 0，
填充色再鲜艳也画不出任何东西。

## 性能提示

矩形是绘制开销最低的图形之一，通常不需要缓存。但一旦加上 `shadow`，情况就完全不同——
阴影在每一帧都要重新计算，是 Canvas 上最昂贵的操作之一。静态的带阴影矩形应当调用
`cache()`，把它一次性渲染成位图，之后每帧只是贴图。

另外，只用作背景或遮罩、不需要响应事件的矩形，设置 `listening(false)` 可以让它不参与
命中检测，详见[禁用事件监听](/docs/performance/listening-false)。命中检测是逐图形做的，
在图形数量多的场景下这项收益很可观。
