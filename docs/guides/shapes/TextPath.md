---
order: 12
group:
  title: 图形
  order: 1
title: Text 路径文字
description: ''
keywords: []
---
要使用`Konva`添加文本路径, 我们可以实例化一个`Konva.TextPath()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.github.io/api/Konva.TextPath.html" target="__blank">Konva.TextPath</a>文档


<iframe src="/downloads/code/shapes/TextPath.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva TextPath Demo</title>
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

    var textpath = new Konva.TextPath({
      x: 0,
      y: 50,
      fill: '#333',
      fontSize: 16,
      fontFamily: 'Arial',
      text: 'All the world\'s a stage, and all the men and women merely players.',
      data: 'M10,10 C0,0 10,150 100,100 S300,150 400,50'
    });

    layer.add(textpath);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>

```
