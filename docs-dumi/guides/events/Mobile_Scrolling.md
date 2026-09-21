---
order: 4
group:
  title: 事件
  order: 3
title: 移动端的滚动和原生事件
description: ''
keywords: []
---
默认情况下，`Konva`将阻止所有指针与舞台交互的默认行为。
当您尝试在移动设备上拖放形状时，这将防止意外滚动页面。  

但在某些情况下，您可能希望保留浏览器事件的默认行为。 在这种情况下，您可以将形状的`preventDefault`属性设置为`false`。   


说明：如果您使用移动设备，请尝试按每个矩形滚动页面。  
绿色 - 应防止默认行为（无页面滚动）。  
红色 - 将保持默认行为（滚动工作）。  

<iframe src="/downloads/code/events/Mobile_Scrolling.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Mobile Scrolling and Native Events Demo</title>
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

    var defaultBehaviourRect = new Konva.Rect({
      width: 100,
      height: 100,
      fill: 'green'
    });
    layer.add(defaultBehaviourRect);

    var noPreventDefaultRect = new Konva.Rect({
      x: 200,
      y: 50,
      width: 100,
      height: 100,
      fill: 'red',
      preventDefault: false
    });

    layer.add(noPreventDefaultRect);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>

```
