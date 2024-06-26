---
order: 4
group:
  title: 样式
  order: 2
title: Shadow 阴影
description: ''
keywords: []
---

要使用`Konva`绘制阴影，我们可以在实例化形状时设置`shadowColor`，`shadowOffset`，`shadowBlur`和`shadowOpacity`属性。  

我们可以通过使用`shadowColor（）`，`shadowOffset（）`，`shadowBlur（）`和`shadowOpacity（）`方法来调整实例化后的阴影属性。


<iframe src="/downloads/code/styling/Shadow.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Shadow Demo</title>
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

        var text = new Konva.Text({
            text: 'Text Shadow!',
            fontFamily: 'Calibri',
            fontSize: 40,
            x: 20,
            y: 20,
            stroke: 'red',
            strokeWidth: 2,
            shadowColor: 'black',
            shadowBlur: 0,
            shadowOffset: {x : 10, y : 10},
            shadowOpacity: 0.5
        });

        var line = new Konva.Line({
            stroke: 'green',
            strokeWidth: 10,
            lineJoin: 'round',
            lineCap: 'round',
            points: [50, 140, 250, 160],
            shadowColor: 'black',
            shadowBlur: 10,
            shadowOffset: {x : 10, y : 10},
            shadowOpacity: 0.5
        });

        var rect = new Konva.Rect({
            x: 100,
            y: 120,
            width: 100,
            height: 50,
            fill: '#00D2FF',
            stroke: 'black',
            strokeWidth: 4,
            shadowColor: 'black',
            shadowBlur: 10,
            shadowOffset: {x : 10, y : 10},
            shadowOpacity: 0.5
        });

        layer.add(text);
        layer.add(line);
        layer.add(rect);

        // add the layer to the stage
        stage.add(layer);
  </script>

</body>
</html>
```