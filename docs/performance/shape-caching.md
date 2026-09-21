---
title: '图形缓存'
description: '用 Konva 的 cache() 把复杂图形预渲染为位图，显著降低每帧重绘开销。教程实测缓存后绘制性能提升约 4 倍，适用于舞台、图层、分组与图形。'
sidebar_position: 4
---

`cache()` 把节点预渲染成位图，之后每帧只贴图。用对了收益巨大，用错了适得其反。

## 用法

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
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
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

## 常见问题

### 什么样的节点值得缓存？

判断标准是**绘制成本高、变化频率低**。

绘制成本高：带阴影、带滤镜、路径顶点多、或者是包含很多子节点的分组。
变化频率低：几秒才变一次，甚至完全静止。

注意**位移和整体缩放不算「变」**——移动一个缓存节点只是把位图贴到新位置，
不需要重建缓存。所以「会动但形状不变」的节点非常适合缓存，这是最大的收益来源。

### 缓存之后图形变糊了？

缓存是按当前尺寸渲染成位图的，之后放大就是在放大位图。

两个办法：一是建缓存时提高分辨率，`node.cache({ pixelRatio: 2 })`；
二是缩放后重新缓存，`node.clearCache(); node.cache();`。

前者内存翻四倍，后者有重建开销。做可缩放的画布时，通常的策略是
缩放过程中容忍模糊，缩放结束后重建一次缓存。

### 改了属性之后画面没更新？

缓存不会自动失效。改了被缓存节点的填充色、子节点内容之后，
画面上还是旧位图。

```js
node.clearCache();
node.cache();
```

这是缓存最容易出问题的地方——bug 表现为「代码改了属性但界面没反应」，
很容易往数据流的方向去查，而根源在渲染层。

如果一个节点需要频繁 `clearCache` + `cache`，那说明它本来就不该被缓存。

## 性能提示

缓存的代价是**内存**和**重建开销**，两者都容易被低估。

内存方面：缓存位图的大小是节点包围盒面积乘以 `pixelRatio` 的平方，再乘 4 字节。
一个 500×500 的节点在 2 倍屏上就是 4MB。缓存几十个这样的节点，内存会很快吃紧。
不再需要时记得 `clearCache()`——Konva 10.4.0 修复了容器 `clearCache()` 时
泄漏子节点缓存画布的问题，但主动清理仍然是好习惯。

重建开销方面：每次 `cache()` 都是一次完整的离屏渲染。在动画循环里重建缓存，
比不缓存还慢。

Konva 10.4.0 还降低了 `cache()` 及各类导出方法的内存占用，
但基本的取舍没有变化：缓存换的是「用内存和一次性开销，省掉每帧的重复绘制」。
