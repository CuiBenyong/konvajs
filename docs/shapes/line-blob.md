---
title: 'Blob 图形'
description: '用 Konva.Line 配合 closed 为 true 与 tension 绘制不规则闭合曲线（blob），tension 越大曲线越圆润。'
sidebar_position: 8
---

Blob 是闭合的平滑曲线——`Konva.Line` 同时设置 `closed: true` 与 `tension` 即可。

## 用法

要使用`Konva`创建一个不规则图形, 我们可以实例化一个`Konva.Line()`对象和`closed = true` `tension`属性.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Line.html" target="_blank">Konva.Line</a>文档

<iframe src="/downloads/code/shapes/Line_-_Blob.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Line Blob Demo</title>
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

    var blob = new Konva.Line({
      points: [23, 20, 23, 160, 70, 93, 150, 109, 290, 139, 270, 93],
      fill: '#00D2FF',
      stroke: 'black',
      strokeWidth: 5,
      closed : true,
      tension : 0.3
    });

    // add the shape to the layer
    layer.add(blob);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### tension 设了却看不出平滑效果？

先确认点数：`tension` 需要至少三个点才有视觉效果，两个点之间无论张力多大都只能是直线。

再确认数值：`tension` 默认为 0，也就是不平滑。忘记设置时画出来就是普通折线，
很容易误以为功能没生效。常用取值在 0.3 到 0.6 之间。

### tension 调大之后曲线打结了？

`tension` 超过 1 左右时，Konva 推导出的控制点会越过相邻顶点，曲线于是向外甩出
并自我交叉，看起来像打了结。

这是插值算法的固有行为，不是缺陷。需要更夸张的弧度时，与其加大 `tension`，
不如增加顶点来引导曲线走向。

### Blob 和 Spline 到底差在哪？

只差一个 `closed`。两者都是 `Konva.Line` 加 `tension`，
[Spline](/docs/shapes/line-spline) 是开放曲线，Blob 首尾相连因而可以填充。

换句话说，它们不是两种图形，而是同一种图形的两种配置。

## 与其他方案的取舍

`tension` 的优点是只给顶点、控制点由 Konva 自动推导，改一个点整条曲线自然重算，
很适合「拖动锚点改形状」这类交互。代价是无法精确控制某一段的弯曲方式。

需要精确控制时用 [`Konva.Path`](/docs/shapes/path) 的贝塞尔命令（`C`、`Q`、`S`），
每段的控制点都由你指定。设计稿导出的曲线走这条路，才能和设计稿一致。

一个折中做法：交互编辑阶段用 `tension` 让用户拖点，定稿后导出为 `Path` 数据存档。
