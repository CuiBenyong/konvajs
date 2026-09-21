---
title: '灰度滤镜'
description: '用 Konva.Filters.Grayscale 把图片转为灰度。使用任何滤镜前都必须先调用 cache() 缓存节点。'
sidebar_position: 3
---

灰度滤镜把彩色图像转为黑白。它用的是人眼亮度加权，不是简单平均。

## 用法

要使用滤镜在`Konva.Image`我们必须首先使用`cache（）`函数
然后使用滤镜在`filter（）`函数。  

要使用`Konva`反转图像的灰度，我们可以使用
`Konva.Filters.Grayscale`滤镜。

查看所有可用的滤镜，请查看<a href="https://konvajs.org/api/Konva.Filters.html" target="_blank">滤镜文档</a>。
<iframe src="/downloads/code/filters/Grayscale.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Grayscale Image Demo</title>
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
        draggable: true
      });

      lion.cache();
      lion.filters([Konva.Filters.Grayscale]);
      layer.add(lion);
      stage.add(layer);
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

### 灰度值是怎么算的？

按人眼对不同颜色的敏感度加权，绿色权重最高、蓝色最低。
大致是 `0.21 * R + 0.72 * G + 0.07 * B`。

不是简单的 `(R + G + B) / 3`。简单平均会让纯绿和纯蓝得到相同的灰度，
而人眼看到的绿色明显更亮。加权后的结果更符合视觉直觉。

### 有参数可以调吗？

没有。`Konva.Filters.Grayscale` 是全有或全无的。

需要「部分去色」（保留一点原色）时，用 CSS 滤镜：`'grayscale(0.6)'`，
参数 0 到 1 控制去色程度。或者用 `Konva.Filters.HSV` 把饱和度调低。

### 和 Sepia 有什么区别？

灰度是把颜色映射到中性灰轴上，结果是纯黑白。

Sepia（褐色调）是映射到一条偏黄褐的色轴上，模拟老照片的效果，
结果仍然有色彩倾向。

两者都是「去掉原有色相」，区别在于替换成什么。

## 与其他方案的取舍

有三条路可以得到灰度效果，代价差别很大。

**CSS 滤镜 `grayscale(1)`**：浏览器原生，最快，还支持部分去色。
绝大多数情况下这是正确选择。

**`Konva.Filters.Grayscale`**：逐像素 JavaScript 处理。只在需要和其他
函数式滤镜组合时才值得用——混用会让整条链退回逐像素路径，
那时多一个函数式滤镜也不额外亏。

**直接用灰度图片资源**：如果某张图**永远**是灰度显示，最快的办法是
让设计师直接提供灰度图。零运行时开销，文件体积通常也更小。
只有需要在彩色与灰度之间切换时（比如禁用态），才需要运行时处理。
