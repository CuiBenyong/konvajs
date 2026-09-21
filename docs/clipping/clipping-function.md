---
title: '裁剪函数'
description: '用 Konva 容器的 clipFunc 属性以自定义函数定义任意形状的裁剪区域，在回调中拿到 canvas 上下文自行绘制路径，不受矩形限制。'
sidebar_position: 2
---

当矩形裁剪区域不够用时，可以设置容器的 `clipFunc` 属性。它接收一个函数，
参数是 canvas 的绘图上下文，你在其中绘制的任意路径都会成为裁剪区域，
因此可以裁出圆形、多边形或任何自定义形状。

在本教程中，我们将用 `clipFunc` 在组上定义一个非矩形的裁剪区域。

只需要矩形区域的话，用更简单的
<a href="/docs/clipping/clipping-regions">裁剪区域</a>即可。

<iframe src="/downloads/code/clipping/Clipping_Function.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Clipping Function Demo</title>
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
        clipFunc: function(ctx) {
          ctx.arc(250, 120, 50, 0, Math.PI * 2, false);
          ctx.arc(150, 120, 60, 0, Math.PI * 2, false);
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
