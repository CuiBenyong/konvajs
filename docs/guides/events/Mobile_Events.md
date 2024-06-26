---
order: 3
group:
  title: 事件
  order: 3
title: 移动端事件
description: ''
keywords: []
---

要使用`Konva`将事件处理程序绑定到移动设备上的形状，我们可以使用`on（）`方法.      
  
使用`on（）`方法需要事件类型和回调函数 .   
`Konva` 支持  `touchstart`，`touchmove`，`touchend`，`tap`，`dbltap`，`dragstart`，`dragmove`和`dragend`移动事件。 



注意：此示例仅适用于iOS和Android移动设备，因为它使用触摸事件而不是鼠标事件。  

说明：将手指移动到三角形上以查看触摸坐标，然后开始触摸、结束触摸圆形。


<iframe src="/downloads/code/events/Mobile_Events.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Mobile Touch Events Demo</title>
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
    function writeMessage(message) {
      text.setText(message);
      layer.draw();
    }

    var stage = new Konva.Stage({
      container: 'container',
      width: 300,
      height: 300
    });

    var layer = new Konva.Layer();

    var triangle = new Konva.RegularPolygon({
      x: 80,
      y: 120,
      sides: 3,
      radius: 80,
      fill: '#00D2FF',
      stroke: 'black',
      strokeWidth: 4
    });

    var text = new Konva.Text({
      x: 10,
      y: 10,
      fontFamily: 'Calibri',
      fontSize: 24,
      text: '',
      fill: 'black'
    });


    var circle = new Konva.Circle({
      x: 230,
      y: 100,
      radius: 60,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    triangle.on('touchmove', function() {
      var touchPos = stage.getPointerPosition();
      var x = touchPos.x - 190;
      var y = touchPos.y - 40;
      writeMessage('x: ' + x + ', y: ' + y);
    });

    circle.on('touchstart', function() {
      writeMessage('Touchstart circle');
    });
    circle.on('touchend', function() {
      writeMessage('Touchend circle');
    });

    layer.add(triangle);
    layer.add(circle);
    layer.add(text);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```
