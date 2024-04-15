---
order: 11
group:
  title: 图形
  order: 1
title: Text 文字
description: ''
keywords: []
---
要使用`Konva`添加文本, 我们可以实例化一个`Konva.Text()`对象.

有关属性和方法的完整列表,请参阅[Konva.Text](https://konvajs.github.io/api/Konva.Text.html){target="_blank"}文档

<iframe src="/downloads/code/shapes/Text.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Text Demo</title>
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
      width: 340,
      height: 300
    });

    var layer = new Konva.Layer();

    var simpleText = new Konva.Text({
      x: stage.getWidth() / 2,
      y: 15,
      text: 'Simple Text',
      fontSize: 30,
      fontFamily: 'Calibri',
      fill: 'green'
    });

    // to align text in the middle of the screen, we can set the
    // shape offset to the center of the text shape after instantiating it
    simpleText.setOffset({
      x: simpleText.getWidth() / 2
    });

    // since this text is inside of a defined area, we can center it using
    // align: 'center'
    var complexText = new Konva.Text({
      x: 20,
      y: 60,
      text: 'COMPLEX TEXT\n\nAll the world\'s a stage, and all the men and women merely players. They have their exits and their entrances.',
      fontSize: 18,
      fontFamily: 'Calibri',
      fill: '#555',
      width: 300,
      padding: 20,
      align: 'center'
    });

    var rect = new Konva.Rect({
      x: 20,
      y: 60,
      stroke: '#555',
      strokeWidth: 5,
      fill: '#ddd',
      width: 300,
      height: complexText.getHeight(),
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: [10, 10],
      shadowOpacity: 0.2,
      cornerRadius: 10
    });

    // add the shapes to the layer
    layer.add(simpleText);
    layer.add(rect);
    layer.add(complexText);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```
