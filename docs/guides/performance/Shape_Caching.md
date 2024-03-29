---
order: 4
group:
  title: 性能优化
  order: 9
title: 图形缓存
description: ''
keywords: []
---

在绘制复杂的Konva图形时, 一种能显著提高绘制性能的方法是将它们缓存为图像。这可以通过使用`cache()`方法将节点转换为图像对象来实现。

下面这个特定的教程通过绘制了10个缓存的星星图片，而不是直接绘制10个独立的Konva星星形状, 使绘图性能得到了4倍的提升
缓存方法可以应用于任何节点，包括舞台，图层，组和形状。

注意：`cache()`方法要求图片必须托管在和执行绘制的代码文件相同域名的服务器上.

同样的，`cache()`函数不能自动检测节点的尺寸大小。所以你需要小心拥有阴影和描边的组和形状。
如果你遇到了意外的结果, 可以通过设置`x`, `y`, `width` 和 `height`来给`cache()`函数传递一个弹性的属性值.

<iframe src="/downloads/code/performance/Shape_Caching.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Shape Caching Demo</title>
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
    
    var star = new Konva.Star({
      innerRadius: 20,
      outerRadius: 50,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 5,
      numPoints: 5,
      x: 60,
      y: 60,
      draggable: true,
      shadowOffset: { x : 5, y : 5},
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOpacity: 0.5
    });
    
    layer.add(star);
    stage.add(layer);
    star.cache();
    
    var clone;
    for(var n = 0; n < 10; n++) {
      clone = star.clone({
        x: Math.random() * stage.getWidth(),
        y: Math.random() * stage.getHeight()
      });
      clone.cache();
      layer.add(clone);
    }
    
    layer.draw();
  </script>

</body>
</html>

```
