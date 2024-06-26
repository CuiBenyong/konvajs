---
order: 6
group:
  title: 样式
  order: 2
title: 隐藏/显示图形
description: ''
keywords: []
---
要使用`Konva`隐藏和显示形状，我们可以在实例化形状时设置`visible`属性，也可以使用`hide（）`和`show（）`方法。


说明：单击按钮显示和隐藏形状。  
 

<iframe src="/downloads/code/styling/Hide_and_Show.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Hide and Show Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #buttons {
        position: absolute;
        left: 10px;
        top: 0px;
    }
    button {
        margin-top: 10px;
        display: block;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="buttons">
      <button id="show">
          show
      </button>
      <button id="hide">
          hide
      </button>
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

        var pentagon = new Konva.RegularPolygon({
            x: stage.getWidth() / 2,
            y: stage.getHeight() / 2,
            sides: 5,
            radius: 70,
            fill: 'red',
            stroke: 'black',
            strokeWidth: 4,
            visible: false
        });

        // add the shape to the layer
        layer.add(pentagon);

        // add the layer to the stage
        stage.add(layer);

        // add button event bindings
        document.getElementById('show').addEventListener('click', function() {
            pentagon.show();
            layer.draw();
        }, false);

        document.getElementById('hide').addEventListener('click', function() {
            pentagon.hide();
            layer.draw();
        }, false);
  </script>

</body>
</html>
```