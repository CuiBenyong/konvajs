---
title: 'Regular Polygon 等边多边形'
description: '用 Konva.RegularPolygon 绘制正多边形：sides 指定边数、radius 指定外接圆半径，Konva 10 起还支持 cornerRadius 圆角。'
sidebar_position: 18
---

要使用`Konva`添加正多边形, 我们可以实例化一个`Konva.RegularPolygon()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.RegularPolygon.html" target="_blank" >Konva.RegularPolygon</a>文档


## 圆角

Konva 10 起 `RegularPolygon` 支持 `cornerRadius`，可以把正多边形的尖角磨圆：

```js
const hexagon = new Konva.RegularPolygon({
  x: 100,
  y: 100,
  sides: 6,
  radius: 70,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4,
  cornerRadius: 10,
});
```

`cornerRadius` 不能为负值。Konva 10.4.0 之前负的 `radius` 或 `cornerRadius`
会在绘制时抛错，并导致它之后的图形全部不显示；10.4.0 起改为拒绝该值而不再中断绘制。

<iframe src="/downloads/code/shapes/RegularPolygon.html" style="width: 50vw; height: 300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva RegularPolygon Demo</title>
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
    var stage = new Konva.Stage({
      container: 'container',
      width: 300,
      height: 300
    });

    var layer = new Konva.Layer();

    var hexagon = new Konva.RegularPolygon({
      x: 100,
      y: 150,
      sides: 6,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    layer.add(hexagon);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```