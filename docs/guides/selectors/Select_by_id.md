---
order: 1
group:
  title: 选择器
  order: 9
title: id 选择器
description: ''
keywords: []
---


要使用Konva通过id属性来选择形状，我们可以使用`find()`方法来搜索带有特定id属性的元素。
`find()`方法总是返回一个元素数组，即使我们期望它只返回一个元素。
如果你只需要一个元素，你可以使用`findOne()`方法。
`find()`方法适用于任何节点，包括舞台，图层，组和形状。

说明：按下“激活矩形”按钮，通过id选择矩形并执行过渡动画。 您也可以拖拽矩形。

<iframe src="/downloads/code/performance/Select_by_id.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Select Shape by id Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #buttons {
        position: absolute;
        top: 5px;
        left: 10px;
      }
    #buttons > input {
      padding: 10px;
      display: block;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="buttons">
    <input type="button" id="activate" value="Activate rectangle">
  </div>
  <script>
    var width = window.innerWidth;
    var height = window.innerHeight;

    var stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height
    });

    var layer = new Konva.Layer();
    for(var n = 0; n < 10; n++) {
      var circle = new Konva.Circle({
        x: Math.random() * stage.getWidth(),
        y: Math.random() * stage.getHeight(),
        radius: Math.random() * 50 + 25,
        fill: 'red',
        strokeWidth: 3,
        stroke : 'black'
      });

      layer.add(circle);
    }

    var rect = new Konva.Rect({
      x: 300,
      y: 90,
      width: 100,
      height: 50,
      fill: 'green',
      strokeWidth: 3,
      offset: {
        x: 50,
        y: 25
      },
      draggable: true,
      id: 'myRect'
    });

    layer.add(rect);
    stage.add(layer);

    var tween;

    document.getElementById('activate').addEventListener('click', function() {
        // or var shape = stage.findOne('#myRect');
      var shape = stage.find('#myRect')[0];

      if (tween) {
        tween.destroy();  
      }

      tween = new Konva.Tween({
        node: shape, 
        duration: 1,
        scaleX: Math.random() * 2,
        scaleY: Math.random() * 2,
        easing: Konva.Easings.ElasticEaseOut
      }).play();
    }, false);
  </script>

</body>
</html>
```