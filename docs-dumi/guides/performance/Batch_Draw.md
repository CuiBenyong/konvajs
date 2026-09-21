---
order: 3
group:
  title: 性能优化
  order: 9
title: 批量绘制
description: ''
keywords: []
---

在某些情况下，我们可能希望既不造成过多的重绘, 并且尽可能快地更新Konva形状.例如，如果我们要在mousemove事件中更新舞台上某个元素的状态, 我们并不愿意使用`draw()`方法来重绘图层, 因为mousemove事件可以在一秒内被触发成百上千次, 从而导致动画的帧率达到每秒一百多帧, 这样常常会使动画出现'跳跃', 毕竟浏览器处理重绘的能力是有限的.

对于这种情况，最好使用`batchDraw()`方法, 它会自动将重绘操作交给Konva动画引擎来处理。无论你调用`batchDraw()`多少次，Konva引擎都会根据浏览器每个时间点每秒所能处理的最大帧数自动限制图层每秒重绘的次数.

说明：将鼠标移到舞台上来快速旋转矩形

<iframe src="/downloads/code/performance/BatchDraw.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Batch Draw Demo</title>
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
      height: 250
    });
    
    var layer = new Konva.Layer();
    
    var rect = new Konva.Rect({
      x: 110,
      y: 100,
      width: 200,
      height: 20,
      offset: {
        x : 100,
        y : 10
      },
      fill: 'green',
      stroke: 'black',
      strokeWidth: 4
    });
    
    // add the shape to the layer
    layer.add(rect);
    
    // add the layer to the stage
    stage.add(layer);
    
    stage.on('contentMousemove', function() {
      rect.rotate(5);
      layer.batchDraw();
    });
  </script>

</body>
</html>

```
