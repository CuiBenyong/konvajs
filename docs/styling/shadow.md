---
title: 'Shadow 阴影'
description: '用 Konva 的 shadowColor、shadowOffset、shadowBlur 与 shadowOpacity 给图形添加阴影，实例化后也可用同名方法调整。'
sidebar_position: 4
---

阴影是 Canvas 上最昂贵的绘制操作之一。用它之前值得先想清楚代价。

## 用法

要使用`Konva`绘制阴影，我们可以在实例化形状时设置`shadowColor`，`shadowOffset`，`shadowBlur`和`shadowOpacity`属性。  

我们可以通过使用`shadowColor（）`，`shadowOffset（）`，`shadowBlur（）`和`shadowOpacity（）`方法来调整实例化后的阴影属性。
<iframe src="/downloads/code/styling/Shadow.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Shadow Demo</title>
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

        var text = new Konva.Text({
            text: 'Text Shadow!',
            fontFamily: 'Calibri',
            fontSize: 40,
            x: 20,
            y: 20,
            stroke: 'red',
            strokeWidth: 2,
            shadowColor: 'black',
            shadowBlur: 0,
            shadowOffset: {x : 10, y : 10},
            shadowOpacity: 0.5
        });

        var line = new Konva.Line({
            stroke: 'green',
            strokeWidth: 10,
            lineJoin: 'round',
            lineCap: 'round',
            points: [50, 140, 250, 160],
            shadowColor: 'black',
            shadowBlur: 10,
            shadowOffset: {x : 10, y : 10},
            shadowOpacity: 0.5
        });

        var rect = new Konva.Rect({
            x: 100,
            y: 120,
            width: 100,
            height: 50,
            fill: '#00D2FF',
            stroke: 'black',
            strokeWidth: 4,
            shadowColor: 'black',
            shadowBlur: 10,
            shadowOffset: {x : 10, y : 10},
            shadowOpacity: 0.5
        });

        layer.add(text);
        layer.add(line);
        layer.add(rect);

        // add the layer to the stage
        stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 阴影为什么这么慢？

浏览器要先把图形画一遍、做高斯模糊、再按偏移贴回去。模糊是逐像素的卷积运算，
开销随 `shadowBlur` 的平方增长。

一个带阴影的图形，每帧的绘制成本可能是不带阴影的好几倍。几十个这样的图形同时动起来，掉帧几乎是必然的。

### 怎么只给填充加阴影，不给描边加？

设 `shadowForStrokeEnabled: false`。

默认情况下描边也会产生阴影，这通常不是想要的效果——描边的阴影会让轮廓显得脏。关掉之后只有填充区域投影，视觉上更干净，
同时也省掉了一部分模糊计算。

### 阴影让包围盒变大了？

会。`getClientRect()` 包含阴影范围，`shadowBlur` 和 `shadowOffset` 都会让它扩大。

这在[缓存](/docs/performance/shape-caching)时尤其要注意：
缓存区域按包围盒计算，带大模糊阴影的节点，缓存位图会比图形本身大很多，
内存占用相应增加。

只要几何尺寸用 `getSelfRect()`。

## 性能提示

阴影的处理原则很明确：**能静态化就静态化**。

**静态阴影必须缓存**。不动的带阴影图形，`cache()` 一次之后每帧只是贴图，
模糊计算只做一遍。这是收益最大的一项优化。

**动态阴影考虑替代方案**。如果图形每帧都在动，缓存会不断重建反而更慢。
这种情况下可以考虑：用一个预先做好的半透明模糊图片跟随图形移动，
或者干脆用一层半透明的同形状图形做偏移，模拟出「硬阴影」的效果。

**控制 `shadowBlur`**。开销随它的平方增长，从 20 降到 10 能省四分之三。
视觉上往往看不出多大差别。

**关掉描边阴影**。`shadowForStrokeEnabled: false` 是零风险的改动。
