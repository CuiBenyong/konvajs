---
title: 'Rect 矩形'
description: '用 Konva.Rect 绘制矩形：设置位置、宽高、填充与描边，并可通过 cornerRadius 指定统一圆角或四角独立的圆角数组。'
sidebar_position: 1
---

要使用`Konva`创建一个矩形, 我们可以实例化一个`Konva.Rect()`对象.  

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Rect.html" target="_blank">Konva.Rect</a>文档


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