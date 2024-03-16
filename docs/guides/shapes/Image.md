---
order: 10
group:
  title: 图形
  order: 1
title: Image 图片
description: ''
keywords: []
---
要使用`Konva`渲染一个图片, 我们可以实例化一个`Konva.Image()`对象.

有关属性和方法的完整列表,请参阅[Konva.Image](https://konvajs.github.io/api/Konva.Image.html)文档

<iframe src="/downloads/code/shapes/Image.html" style="width: 50vw;height:300px;"></iframe>


{% include_code Konva Image Demo shapes/Image.html %}

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Image Demo</title>
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
    var imageObj = new Image();
    imageObj.onload = function() {

      var yoda = new Konva.Image({
        x: 50,
        y: 50,
        image: imageObj,
        width: 106,
        height: 118
      });

      // add the shape to the layer
      layer.add(yoda);

      // add the layer to the stage
      stage.add(layer);
    };
    imageObj.src = '/assets/yoda.jpg';
  </script>

</body>
</html>
```