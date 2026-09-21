---
title: '裁剪区域'
description: '用 Konva 容器的 clip 属性设置矩形裁剪区域，超出 x、y、width、height 范围的内容不会绘制。适用于 Group、Layer 与 Stage。'
sidebar_position: 1
---

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
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
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
