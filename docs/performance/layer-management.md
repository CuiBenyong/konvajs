---
title: '图层管理'
description: 'Konva 图层管理是性能优化的首要手段：每个 Layer 对应一个独立的 canvas 元素，把动态内容与静态内容分层可避免整屏重绘。'
sidebar_position: 2
---

每个图层是一张独立的 canvas。合理分层，可以让「只有一小块在动」时不必重绘整个画面。

## 用法

当创建Konva应用程序时，在性能方面最需要的考虑就是层的管理. 让Konva从其他画布库中脱颖而出的一大特点就是, 它使我们能够创建单独的层，每个层都有自己对应的画布元素。这意味着我们可以只动画，转换或更新舞台上的一部分元素，同时不需要重新绘制舞台上其他的元素。如果我们检查一个Konva舞台的DOM结构，我们将看到实际上每一个层都有一个对应的画布元素.
本教程有两个图层，一个是动画图层，另一个是包含文本的静态图层。 由于在动画中不需要重绘文本, 所以可以把它放置在一个单独的图层中.

下面的示例中有两个层, 一个是动画层, 一个是包含文本的静态层. 由于文本上没有动画, 不需要被连续地重绘, 因此被放在一个单独的层里.
<iframe src="/downloads/code/performance/Layer_Management.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
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

## 常见问题

### 图层是不是越多越好？

不是。每个 `Konva.Layer` 都会创建一张与舞台等大的 canvas——实际上是两张，场景图和命中图。

一个 1920×1080 的舞台，单张 canvas 的显存占用就是几 MB，高 DPI 屏幕下还要乘以
`pixelRatio` 的平方。图层开到十几个，内存会很可观，而且浏览器合成这些图层本身
也有成本。

实践中个位数的图层足够表达绝大多数场景。

### 怎么划分图层？

按**更新频率**分，不是按业务逻辑分。

典型的三层结构：静态背景（网格、底图）一层，几乎不重绘；主体内容一层；
交互反馈（拖拽中的元素、选择框、辅助线）一层，每帧都在变。

拖拽时把被拖的节点临时移到最上层，松手后移回去——这样拖拽过程中只有
那一层在重绘，主体内容原封不动。

### 图层顺序怎么调整？

图层之间用 `moveToTop()`、`zIndex()` 这些方法，和普通节点一样。

要注意的是**跨图层的层级由图层顺序决定，节点自己的 `zIndex` 管不着**。
一个节点在图层 A 里 `moveToTop()`，它也只是 A 里面最上面的，
仍然会被图层 B 的内容盖住。这是分层最容易造成困惑的地方。

## 性能提示

分层的收益来自**避免无谓重绘**，所以它只在「画面大部分静止」时才有意义。
如果每帧所有内容都在变，分层不但不省，还多了合成开销。

几个实操要点：

**静态层要真的静态**。背景层里混进一个会动的元素，整层就白分了。
检查办法是给每层的 `draw` 打点计数，看静态层是不是真的不重绘。

**拖拽时临时提层**。`node.moveTo(dragLayer)` 把节点搬到专用图层，
`dragend` 时搬回。这是 Konva 应用里收益最稳定的一项优化。

**不监听的图层设 `listening: false`**。Konva 10.3.2 起这类图层会释放掉
与舞台等大的命中画布，内存收益直接可见。
