---
order: 20
group:
  title: 图形
  order: 1
title: Custom 自定义图形
description: ''
keywords: []
---

T要使用`Konva`创建自定义形状, 我们可以实例化一个`Konva.Shapew()`对象.  
当创建自定义形状时,我们需要定义一个通过Konva.Canvas渲染器传递的绘图函数.
我们可以使用渲染器来访问HTML5 Canvas上下文,并使用像`context.fillStrokeShape(this)`这样的特殊方法,它会自动处理填充,描边和阴影.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.github.io/api/Konva.Shape.html" target="__blank">Konva.Shape</a>文档

<iframe src="/downloads/code/shapes/Custom.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Custom Shape Demo</title>
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

    /*
    * create a triangle shape by defining a
    * drawing function which draws a triangle
    */
    var triangle = new Konva.Shape({
      sceneFunc: function(context) {
        context.beginPath();
        context.moveTo(20, 50);
        context.lineTo(220, 80);
        context.quadraticCurveTo(150, 100, 260, 170);
        context.closePath();

        // Konva specific method
        context.fillStrokeShape(this);
      },
      fill: '#00D2FF',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the triangle shape to the layer
    layer.add(triangle);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```
