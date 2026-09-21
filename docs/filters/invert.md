---
title: '反相滤镜'
description: '用 Konva.Filters.Invert 反转图片颜色。与其他滤镜一样，需先调用 cache() 缓存节点再通过 filters() 应用。'
sidebar_position: 4
---

反相把每个颜色分量替换为它的补值。它是无参数滤镜里最简单的一个。

## 用法

要使用滤镜在`Konva.Image`我们必须首先使用`cache（）`函数
然后使用滤镜在`filter（）`函数。  

要使用`Konva`反转图像的颜色，我们可以使用 `Konva.Filters.Invert`滤镜. 

查看所有可用的滤镜，请查看<a href="https://konvajs.org/api/Konva.Filters.html" target="_blank">滤镜文档</a>。
<iframe src="/downloads/code/filters/Invert.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Invert Image Demo</title>
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
      lion.filters([Konva.Filters.Invert]);
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

### Alpha 通道会被反转吗？

不会。只反转 RGB 三个分量，透明度保持不变。

这是符合直觉的——如果连 Alpha 也反转，透明区域会变成不透明的黑色，
整张图的轮廓就没了。

### 连续反相两次能回到原图吗？

可以，反相是自逆运算：`255 - (255 - x) = x`，没有精度损失。

这和[亮度滤镜](/docs/filters/brighten)不同——后者会因为截断而丢失信息，
正负抵消也回不到原样。

### 怎么只反相图片的一部分？

滤镜作用于整个节点，做不到局部。两个思路：

一是把要反相的区域做成单独的节点（用[裁剪](/docs/clipping/clipping-regions)
限定范围），只对它应用滤镜。

二是用[混合模式](/docs/styling/blend-mode) `difference`——在目标上方叠一个纯白图形，重叠区域就会呈现反相效果，
而且形状由那个图形决定，比裁剪更灵活。

## 与其他方案的取舍

**CSS 滤镜 `invert(1)`** 更快，而且支持部分反相（`invert(0.5)` 得到灰化的中间态）。
单纯要反相效果时优先用它。

**混合模式 `difference`** 能做到「按形状局部反相」，这是滤镜做不到的。
做探照灯、选区高亮这类效果时它是唯一选择。

**`Konva.Filters.Invert`** 的位置是：需要和其他函数式滤镜串在同一条链里时。
例如先反相再做万花筒——万花筒没有 CSS 对应物，整条链本来就得走逐像素路径。
