---
title: '裁剪区域'
description: '用 Konva 容器的 clip 属性设置矩形裁剪区域，超出 x、y、width、height 范围的内容不会绘制。适用于 Group、Layer 与 Stage。'
sidebar_position: 1
---

容器的 `clip` 属性定义一个矩形裁剪区域，超出部分不绘制。

## 用法

使用 `Konva` 在裁剪区域内绘制内容，我们可以设置任何容器的 `clip` 属性，
包括组、图层或舞台。裁剪区域由 `x`、`y`、`width` 和 `height` 定义，
落在该矩形之外的部分不会被绘制。

在本教程中，我们将在应用于组的矩形裁剪区域内绘制不规则图形。

如果矩形不足以描述你要的裁剪形状，改用
<a href="/docs/clipping/clipping-function">裁剪函数</a>。
<iframe src="/downloads/code/clipping/Clipping_Regions.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Simple Clipping Demo</title>
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

    var group = new Konva.Group({
        clip: {
            x : 100,
            y : 40,
            width : 200,
            height : 100
        },
        draggable: true
    });

    var blueBlob = new Konva.Line({
        points: [73, 140, 340, 23, 500, 109, 300, 170],
        stroke: 'blue',
        strokeWidth: 10,
        fill: '#aaf',
        tension: 0.8,
        closed : true
    });

    var redBlob = new Konva.Line({
        points: [73, 140, 340, 23, 500, 109],
        stroke: 'red',
        strokeWidth: 10,
        fill: '#faa',
        tension: 1.2,
        scale: {x : 0.5, y : 0.5},
        x: 100,
        y: 50,
        closed : true
    });

    group.add(blueBlob);
    group.add(redBlob);
    layer.add(group);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>

```

## 常见问题

### 裁剪区域的坐标是相对什么的？

相对**容器自身的坐标系**。给一个 `x: 100` 的分组设 `clip: { x: 0, ... }`，
裁剪框的左边缘在舞台上的位置是 100，不是 0。

这和子节点的坐标是同一套参照系，所以「让裁剪框正好框住某个子节点」
可以直接用那个子节点的坐标，不需要换算。

### 被裁掉的部分还能点中吗？

能。**裁剪只影响绘制，不影响命中检测**。

这经常导致意外：用户点在裁剪框外的空白处，却触发了那个「看不见」的图形。

要让命中也被裁剪，需要给被裁的节点自己加约束——例如把它们的
[`listening`](/docs/events/listen-for-events) 按是否在可见范围内动态切换，
或者在事件处理里判断坐标是否落在裁剪区内。

### 给图形本身设 clip 有用吗？

没用。`clip` 是**容器**的属性——只有 `Stage`、`Layer`、`Group` 支持。

要裁剪单个图形，把它放进一个分组，给分组设裁剪。
或者换个思路：用 [`Konva.Path`](/docs/shapes/path) 直接画出裁剪后的形状，
如果形状是固定的，这样更省。

## 性能提示

裁剪本身的开销很小——它设置的是 canvas 的裁剪路径，由浏览器在光栅化阶段处理。

但它**不会减少绘制调用**。被裁掉的子节点仍然会执行完整的绘制流程，
只是最终像素被丢弃。上千个子节点里只有十个在可见区内，
那另外九百九十个的绘制成本照样要付。

真正要省这部分开销，需要**视口剔除**：自己判断哪些节点在可见范围内，
把范围外的设为 `visible(false)`。这在大画布、可滚动内容的场景里是必要的优化，
Konva 没有内置，得自己实现。

判断依据：裁剪是为了**视觉效果**，视口剔除是为了**性能**。两者可以并存，
不要指望前者带来后者的收益。
