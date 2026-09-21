---
title: 'Wedge 扇形'
description: '用 Konva.Wedge 绘制扇形：radius 定义半径、angle 定义张角、rotation 定义起始角度，常用于饼图。'
sidebar_position: 4
---

扇形是从圆心张开的一块，饼图就是由一组扇形拼成的。

## 用法

要使用`Konva`创建一个扇形, 我们可以实例化一个`Konva.Wedge()`对象.  

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Wedge.html" target="_blank" >Konva.Wedge</a>文档

<iframe src="/downloads/code/shapes/Wedge.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Wedge Demo</title>
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

    var wedge = new Konva.Wedge({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      radius: 70,
      angle: 60,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4,
      rotation: -120
    });

    // add the shape to the layer
    layer.add(wedge);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### angle 填的是角度还是弧度？

默认是**角度**（0–360）。这由全局开关 `Konva.angleDeg` 控制，它默认为 `true`。

如果项目里有人把 `Konva.angleDeg` 设成了 `false`，全站所有图形的角度属性
（包括 `rotation`）都会改按弧度解释。这是个全局开关，改动它会影响每一处，
排查「角度突然全错了」时值得先确认这个值。

### 扇形从哪个方向开始张开？

默认从 3 点钟方向（正右）开始，顺时针张开 `angle` 度。用 `rotation` 调整起始方向——
画饼图时通常希望从 12 点开始，设 `rotation: -90` 即可。

每一块的 `rotation` 等于它之前所有扇形角度之和（再加上起始偏移），
按顺序累加即可，不需要额外的三角计算。

### 饼图相邻两块之间为什么有一条细缝？

这是抗锯齿造成的。两个扇形共享一条边时，各自的边缘像素都只被画了「一半的覆盖率」，
叠加后仍然不足以填满，于是露出底色形成细线。

让相邻扇形的角度略微重叠（例如每块多画 0.5 度）就能消除。另一种做法是给每块
加上与填充同色的 `stroke`，用描边把缝盖住。

## 性能提示

单个扇形很便宜，但饼图往往由十几块组成，且多数时候是静态的。这种情况下把整张饼图
放进一个 `Konva.Group` 并对该组调用 `cache()`，一次渲染成位图，之后每帧只贴一张图，
比逐块重绘划算得多。

需要注意缓存会固定当前外观，任何一块的颜色或角度变化后都要 `clearCache()` 再重新
`cache()`。所以带悬停高亮的饼图不适合整体缓存——那种场景下更好的做法是只给
不变的部分做缓存，把会变的那块单独留在外面。
