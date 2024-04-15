---
order: 2
group:
  title: 补间动画
  order: 10
title:  简单的补间动画
description: ''
keywords: []
---
要使用Konva创建一个非线性缓动的tween动画，我们可以将它的`easing`属性设置为其他类型的缓动函数。 除了`Konva.Easings.Linear`，其他常用的缓动函数有`Konva.Easings.EaseIn`,
`Konva.Easings.EaseInOut`, 和 `Konva.Easings.EaseOut`。


本教程演示了Konva提供的所有缓动函数集，包括Linear, Ease, Back, Elastic, Bounce, and Strong.。

有关所有可用的缓动函数，请访问[Easings 文档](https://konvajs.github.io/api/Konva.Easing.html){target="_blank"}。

说明：鼠标悬浮或者直接触摸下面的盒子, 它们会分别以不同的缓动函数做动画

<iframe src="/downloads/code/tweens/Common_Easing.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Common Easing Demo</title>
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

    var greenBox = new Konva.Rect({
        x: 70,
        y: stage.getHeight() / 2,
        width: 100,
        height: 50,
        fill: 'green',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: 50,
            y: 25
        }
    });

    var blueBox = new Konva.Rect({
        x: 190,
        y: stage.getHeight() / 2,
        width: 100,
        height: 50,
        fill: 'blue',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: 50,
            y: 25
        }
    });

    var redBox = new Konva.Rect({
        x: 310,
        y: stage.getHeight() / 2,
        width: 100,
        height: 50,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: 50,
            y: 25
        }
    });

    layer.add(greenBox);
    layer.add(blueBox);
    layer.add(redBox);
    stage.add(layer);

    // the tween has to be created after the node has been added to the layer
    greenBox.tween = new Konva.Tween({
        node: greenBox,
        scaleX: 2,
        scaleY: 1.5,
        easing: Konva.Easings.EaseIn,
        duration: 1
    });

    blueBox.tween = new Konva.Tween({
        node: blueBox,
        scaleX: 2,
        scaleY: 1.5,
        easing: Konva.Easings.EaseInOut,
        duration: 1
    });

    redBox.tween = new Konva.Tween({
        node: redBox,
        scaleX: 2,
        scaleY: 1.5,
        easing: Konva.Easings.EaseOut,
        duration: 1
    });

    // use event delegation
    layer.on('mouseover touchstart', function(evt) {
        evt.target.tween.play();
    });

    layer.on('mouseout touchend', function(evt) {
        evt.target.tween.reverse();
    });
  </script>

</body>
</html>
```
