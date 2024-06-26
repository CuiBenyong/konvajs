---
order: 8
group:
  title: 样式
  order: 2
title: 混合模式
description: ''
keywords: []
---

<a href="https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation" target="__blank">globalCompositeOperation</a>文档.
在 Konva 里你可以通过 `globalCompositeOperation` 属性来设置 `globalCompositeOperation` 和 混合模式。

说明：拖动红色矩形到文字上面看看。

<iframe src="/downloads/code/styling/Blend_Mode.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@4.0.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Blend Mode Demo</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #f0f0f0;
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

      var text = new Konva.Text({
        text: 'Text Shadow!',
        fontFamily: 'Calibri',
        fontSize: 40,
        x: 20,
        y: 20,
        fill: 'green',
        // stroke: 'red',
        strokeWidth: 2,
        shadowColor: 'white',
        // shadowBlur: 0,
        shadowOffset: { x: 10, y: 10 }
        // shadowOpacity: 0.5
      });
      layer.add(text);

      var rect = new Konva.Rect({
        x: 50,
        y: 50,
        // stroke: 'red',
        width: 100,
        height: 100,
        fill: 'red',
        draggable: true,
        globalCompositeOperation: 'xor'
      });

      layer.add(rect);
      stage.add(layer);
    </script>
  </body>
</html>
```