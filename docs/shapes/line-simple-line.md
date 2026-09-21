---
title: 'Line 简单线条'
description: '用 Konva.Line 绘制简单线条：points 数组以 [x1,y1,x2,y2,...] 的形式给出各点坐标，可设置 stroke 与 strokeWidth。'
sidebar_position: 5
---

线条是 Konva 里唯一用扁平数组描述坐标的图形，这个约定贯穿 Line、Polygon、Blob 与 Spline。

## 用法

要使用`Konva`创建一个简单的线条, 我们可以实例化一个`Konva.Line()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Line.html" target="_blank">Konva.Line</a>文档

<iframe src="/downloads/code/shapes/Line_-_Simple_line.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Simple Line Demo</title>
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

    var redLine = new Konva.Line({
      points: [5, 70, 140, 23, 250, 60, 300, 20],
      stroke: 'red',
      strokeWidth: 15,
      lineCap: 'round',
      lineJoin: 'round'
    });

    // dashed line
    var greenLine = new Konva.Line({
      points: [5, 70, 140, 23, 250, 60, 300, 20],
      stroke: 'green',
      strokeWidth: 2,
      lineJoin: 'round',
      /*
       * line segments with a length of 33px
       * with a gap of 10px
       */
      dash: [33, 10]
    });

    // complex dashed and dotted line
    var blueLine = new Konva.Line({
      points: [5, 70, 140, 23, 250, 60, 300, 20],
      stroke: 'blue',
      strokeWidth: 10,
      lineCap: 'round',
      lineJoin: 'round',
      /*
       * line segments with a length of 29px with a gap
       * of 20px followed by a line segment of 0.001px (a dot)
       * followed by a gap of 20px
       */
      dash: [29, 20, 0.001, 20]
    });

    /*
     * since each line has the same point array, we can
     * adjust the position of each one using the
     * move() method
     */
    redLine.move({
      x : 0,
      y : 5
    });
    greenLine.move({
      x : 0,
      y : 55
    });
    blueLine.move({
      x : 0,
      y : 105
    });

    layer.add(redLine);
    layer.add(greenLine);
    layer.add(blueLine);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### points 该传点对象数组还是扁平数组？

必须是**扁平数组**：`[x1, y1, x2, y2, ...]`，不是 `[{x, y}, ...]`。

传错结构时 Konva 不会报错，只是画不出任何东西——对象被当作数字参与坐标计算，
结果是 `NaN`。排查「线条不显示」时，先把 `points` 打印出来确认它是一串数字。

### 改了 points 数组，画面为什么没变？

要重新赋值整个数组才会触发更新：`line.points([...])`。对 `line.points()` 返回的
数组原地 `push` 或改元素不会通知 Konva，它无从得知内容变了。

Konva 10.4.0 起，未显式设置过的数组属性每次读取都返回**新数组**，这条尤其要注意——原地修改的那份根本不是节点持有的数据。

### 水平线和垂直线为什么看起来发虚？

和矩形描边是同一个原因：`strokeWidth: 1` 的线以路径为中线、向两侧各画半像素，
落在整数坐标上时会横跨两个物理像素，各画一半，视觉上成为两像素宽的灰线。

把坐标偏移半像素（例如 `y: 100.5`）能让它落在单个像素内。画网格、刻度、
分隔线时这个差别很明显。

## 性能提示

一条折线应当用**一个** `Konva.Line` 加多个点，而不是拆成多段各建一个节点。
节点数量是 Konva 性能的主要成本项，一百段折线拆成一百个节点，命中检测和
变换计算都要做一百次。

纯描边、无填充无阴影的线条可以设 `perfectDrawEnabled(false)`。这个开关关掉的是
「用缓冲画布消除描边与填充交叠处色差」的处理，而纯描边图形本来就没有这个问题，
关掉是净收益。详见[关闭 Perfect Drawing](/docs/performance/disable-perfect-draw)。
