---
order: 11
group:
  title: 事件
  order: 3
title: 取消事件冒泡
description: ''
keywords: []
---

要使用`Konva`阻止冒泡，我们可以设置`cancelBubble`对象的属性设置为`true`。 




说明：点击圆形可以观察到只有圆形事件绑定被触发,
因为事件传播在触发循环事件时被取消，防止事件对象向上冒泡。 

<iframe src="/downloads/code/events/Cancel_Propagation.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Cancel Event Bubble Propagation Demo</title>
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

    var group = new Konva.Group();

    var circle = new Konva.Circle({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    circle.on('click', function(evt) {
      alert('You clicked the circle!');
      evt.cancelBubble = true;
    });

    group.on('click', function() {
      alert('You clicked on the group!');
    });

    layer.on('click', function() {
      alert('You clicked on the layer!');
    });

    group.add(circle);
    layer.add(group);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```
