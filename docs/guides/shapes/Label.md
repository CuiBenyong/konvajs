---
order: 16
group:
  title: 图形
  order: 1
title: Label 标签
description: ''
keywords: []
---
要使用`Konva`创建标签,可用于创建带有背景,简单工具提示或带指针提示的文本. 我们可以实例化一个`Konva.Lable()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.github.io/api/Konva.Label.html" target="__blank">Konva.Lable</a>文档

<iframe src="/downloads/code/shapes/Label.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Label Demo</title>
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

    // tooltip
    var tooltip = new Konva.Label({
        x: 170,
        y: 75,
        opacity: 0.75
    });

    tooltip.add(new Konva.Tag({
        fill: 'black',
        pointerDirection: 'down',
        pointerWidth: 10,
        pointerHeight: 10,
        lineJoin: 'round',
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffset: 10,
        shadowOpacity: 0.5
    }));

    tooltip.add(new Konva.Text({
        text: 'Tooltip pointing down',
        fontFamily: 'Calibri',
        fontSize: 18,
        padding: 5,
        fill: 'white'
    }));

    // label with left pointer
    var labelLeft = new Konva.Label({
        x: 20,
        y: 130,
        opacity: 0.75
    });

    labelLeft.add(new Konva.Tag({
        fill: 'green',
        pointerDirection: 'left',
        pointerWidth: 20,
        pointerHeight: 28,
        lineJoin: 'round'
    }));

    labelLeft.add(new Konva.Text({
        text: 'Label pointing left',
        fontFamily: 'Calibri',
        fontSize: 18,
        padding: 5,
        fill: 'white'
    }));

    // simple label
    var simpleLabel = new Konva.Label({
        x: 180,
        y: 150,
        opacity: 0.75
    });

    simpleLabel.add(new Konva.Tag({
        fill: 'yellow'
    }));

    simpleLabel.add(new Konva.Text({
        text: 'Simple label',
        fontFamily: 'Calibri',
        fontSize: 18,
        padding: 5,
        fill: 'black'
    }));

    // add the labels to layer
    layer.add(tooltip).add(labelLeft).add(simpleLabel);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```