---
order: 2
group:
  title: 性能优化
  order: 9
title: 图层管理
description: ''
keywords: []
---

当创建Konva应用程序时，在性能方面最需要的考虑就是层的管理. 让Konva从其他画布库中脱颖而出的一大特点就是, 它使我们能够创建单独的层，每个层都有自己对应的画布元素。这意味着我们可以只动画，转换或更新舞台上的一部分元素，同时不需要重新绘制舞台上其他的元素。如果我们检查一个Konva舞台的DOM结构，我们将看到实际上每一个层都有一个对应的画布元素.
本教程有两个图层，一个是动画图层，另一个是包含文本的静态图层。 由于在动画中不需要重绘文本, 所以可以把它放置在一个单独的图层中.

下面的示例中有两个层, 一个是动画层, 一个是包含文本的静态层. 由于文本上没有动画, 不需要被连续地重绘, 因此被放在一个单独的层里.


<iframe src="/downloads/code/performance/Layer_Management.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Layer Management Demo</title>
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
    var animLayer = new Konva.Layer();
    var staticLayer = new Konva.Layer();
    
    /*
    * leave center point positioned
    * at the default which is at the center
    * of the hexagon
    */
    
    var blueHex = new Konva.RegularPolygon({
      x: 50,
      y: stage.height() / 2,
      sides: 6,
      radius: 40,
      fill: '#00D2FF',
      stroke: 'black',
      strokeWidth: 4,
      draggable: true
    });
    
    var yellowHex = new Konva.RegularPolygon({
      x: stage.width() / 2,
      y: stage.height() / 2,
      sides: 6,
      radius: 30,
      fill: 'yellow',
      stroke: 'black',
      strokeWidth: 4,
      draggable: true
    });
    
    /*
    * move center point to right side
    * of hexagon
    */
    var redHex = new Konva.RegularPolygon({
      x: 250,
      y: stage.height() / 2,
      sides: 6,
      radius: 30,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4,
      offset: {
        x: 30,
        y: 0
      },
      draggable: true
    });
    
    var text = new Konva.Text({
      x: 10,
      y: 10,
      text: 'Static Layer',
      fontSize: '30',
      fontFamily: 'Calibri',
      fill: 'black'
    });
    
    staticLayer.add(text);
    
    animLayer.add(blueHex, yellowHex, redHex);
    stage.add(animLayer, staticLayer);
    
    var period = 2000;
    var anim = new Konva.Animation(function(frame) {
      var scale = Math.sin(frame.time * 2 * Math.PI / period) + 0.001;
      // scale x and y
      blueHex.scale({x : scale, y : scale});
      // scale only y
      yellowHex.scaleY(scale);
      // scale only x
      redHex.scaleX(scale);
    }, animLayer);
    
    anim.start();
  </script>

</body>
</html>

```
