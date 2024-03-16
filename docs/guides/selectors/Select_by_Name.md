---
order: 2
group:
  title: 选择器
  order: 9
title:  名称选择器
description: ''
keywords: []
---


要使用Konva通过name属性选择形状，我们可以使用`find()`方法。
`find()`方法返回一个与`.`选择器字符串匹配的节点数组。
这个返回数组是一个`Konva.Collection`数组，也是一个典型的JavaScript数组，有一个特殊的`each()`方法。
这个`each()`方法使我们能够快速遍历数组中的每个节点。

<iframe src="/downloads/code/selectors/Select_by_Name.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Select Shape by Name Demo</title>
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

    var rect1 = new Konva.Rect({
      x: 250,
      y: 90,
      width: 100,
      height: 50,
      fill: 'green',
      strokeWidth: 3,
      stroke : 'black',
      offset: {
        x: 50,
        y: 25
      },
      draggable: true,
      name: 'rectangle'
    });

    var rect2 = new Konva.Rect({
      x: 70,
      y: 90,
      width: 100,
      height: 50,
      fill: 'green',
      strokeWidth: 3,
      stroke : 'black',
      offset: {
        x: 50,
        y: 25
      },
      draggable: true,
      name: 'rectangle'
    });
    layer.add(rect1);
    layer.add(rect2);
    stage.add(layer);

    var tweens = [];

    document.getElementById('activate').addEventListener('click', function() {
      // select shapes by name
      var shapes = stage.find('.rectangle');

      // if there are currently any active tweens, destroy them
      // before creating new ones
      for (var n=0; n<tweens.length; n++) {
        tweens[n].destroy();
      }

      // apply transition to all nodes in the array
      shapes.each(function(shape) {          
        tweens.push(new Konva.Tween({
          node: shape, 
          duration: 1,
          scaleX: Math.random() * 2,
          scaleY: Math.random() * 2,
          easing: Konva.Easings.ElasticEaseOut
        }).play());
      });
    }, false);
  </script>

</body>
</html>
```