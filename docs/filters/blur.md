---
title: '模糊滤镜'
description: '用 Konva.Filters.Blur 给图片做模糊：先调 cache() 缓存节点，再用 filters() 应用滤镜，模糊强度由 blurRadius 控制。'
sidebar_position: 1
---

模糊是最常用也最昂贵的滤镜。它的半径有上限，而且会让图形超出原来的包围盒。

## 用法

要使用滤镜在`Konva.Image`我们必须首先使用`cache（）`函数
然后使用滤镜在`filter（）`函数。    

要使用`Konva`模糊图像，我们可以使用`Konva.Filters.Blur`滤镜
并使用`blurRadius`属性设置模糊量。 

查看所有可用的滤镜，请查看<a href="https://konvajs.org/api/Konva.Filters.html" target="_blank">滤镜</a>文档。     

说明：滑动控制以调整模糊半径。
<iframe src="/downloads/code/filters/Blur.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Blur Image Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #slider {
      position: absolute;
      top: 20px;
      left: 20px; 
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <input id="slider" type="range" min="0" max="40" step="0.05" value="20">
  <script>
    function loadImages(sources, callback) {
      var images = {};
      var loadedImages = 0;
      var numImages = 0;
      for(var src in sources) {
        numImages++;
      }
      for(var src in sources) {
        images[src] = new Image();
        images[src].onload = function() {
          if(++loadedImages >= numImages) {
            callback(images);
          }
        };
        images[src].src = sources[src];
      }
    }
    function buildStage(images) {
      var stage = new Konva.Stage({
        container: 'container',
        width: 300,
        height: 200
      });

      var layer = new Konva.Layer();

      var lion = new Konva.Image({
        image: images.lion,
        x: 80,
        y: 30,
        blurRadius: 20,
        draggable: true
      });

      lion.cache();
      lion.filters([Konva.Filters.Blur]);
      layer.add(lion);
      stage.add(layer);
      var slider = document.getElementById('slider'); 
      slider.onchange = function() {
        lion.blurRadius(slider.value);
        layer.batchDraw();    
      };
    }

    var sources = {
      lion: '/assets/lion.png'
    };

    loadImages(sources, buildStage);
  </script>

</body>
</html>
```

## 常见问题

### 为什么必须先 cache()？

滤镜作用在**位图像素**上，而不是矢量路径。Konva 需要先把节点渲染成一张位图，
才能逐像素处理。没有缓存就没有像素可处理，滤镜静默不生效。

这是所有 `Konva.Filters` 的共同前提，不只是模糊。忘记 `cache()` 是滤镜
「没反应」的头号原因——它不报错，只是什么都不发生。

### blurRadius 能设多大？

Konva 10.4.0 起上限是 180，超过会被截断。该版本同时修复了一个问题：
此前过大的半径会产生一张全空的图像，表现为图形直接消失。

实际上很少需要接近上限的值。模糊开销随半径增长得很快，
半径 20 以上就该考虑是不是有更便宜的实现方式。

### 模糊之后图形边缘被切掉了？

因为缓存区域是按节点原本的包围盒算的，而模糊会向外扩散。

给 `cache()` 传 `offset` 把缓存区域扩大：

```js
node.cache({ offset: blurRadius });
```

扩大的量至少要等于模糊半径。这会增加缓存位图的尺寸和内存占用，
是必要的代价。

## 性能提示

模糊是逐像素的卷积运算，开销大致随半径的平方增长。

**静态模糊必须缓存后复用**。缓存本来就是滤镜的前提，关键是不要反复重建——
每次 `clearCache()` + `cache()` 都要重跑一遍完整的模糊计算。

**动画中改 blurRadius 代价极高**。每一帧都是一次完整的重新模糊。
[补间滤镜](/docs/tweens/tween-filter)那一页演示了这个用法，但要清楚它的成本。

**优先考虑 CSS 滤镜**。`filters: ['blur(6px)']` 由浏览器原生实现，
通常比 JavaScript 逐像素快得多。代价是可用效果受 CSS 规范限制，
详见 [CSS 原生滤镜](/docs/filters/css-filters)。
