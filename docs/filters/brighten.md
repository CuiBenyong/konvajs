---
title: '亮度滤镜'
description: '用 Konva.Filters.Brighten 调整图片明暗：先 cache() 再 filters()，brightness 取正值变亮、负值变暗。'
sidebar_position: 2
---

亮度滤镜给每个像素的 RGB 分量加上一个固定值。简单，但也因此有明显的局限。

## 用法

要使用滤镜在`Konva.Image`我们必须首先使用`cache（）`函数
然后使用滤镜在`filter（）`函数。  

要使用`Konva`使图片变亮或变暗，我们可以使用`Konva.Filters.Brighten`
滤镜并使用`brightness`属性设置亮度。   

亮度属性`brightness`可以设置为-1和1之间的任何整数。
负值使图像变暗，正值使图像变亮。 

查看所有可用的滤镜，请查看<a href="https://konvajs.org/api/Konva.Filters.html" target="_blank">滤镜</a>文档。 


说明：滑动控制旋钮调整亮度
<iframe src="/downloads/code/filters/Brighten.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Brighten Image Demo</title>
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
  <input id="slider" type="range" min="-1" max="1" step="0.05" value="0">
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
      lion.filters([Konva.Filters.Brighten]);
      layer.add(lion);
      stage.add(layer);
      var slider = document.getElementById('slider'); 
      slider.onchange = function() {
        lion.brightness(slider.value);
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

### brightness 的取值范围是多少？

通常在 -1 到 1 之间。正值变亮，负值变暗，0 是原样。

它的实现是给每个通道加上 `brightness * 255`，所以是**线性加法**而非乘法。
这意味着暗部和亮部被抬高的量是一样的，与人眼对亮度的感知曲线不符——视觉上会显得「发灰」而不是「变亮」。

### 调亮之后细节丢失了，能调回来吗？

不能。超过 255 的分量会被截断到 255，这个信息永久丢失了。

所以先 `brightness: 0.5` 再 `brightness: -0.5`，得到的不是原图——高光区域已经被压成一片纯白。

需要可逆的亮度调整，应该保留原图、每次从原图重新处理，
而不是在已处理的结果上继续叠加。

### 怎么让效果更自然？

配合 `Konva.Filters.Contrast` 一起用。单独提亮会让画面发灰，
补一点对比度能把层次拉回来：

```js
node.filters([Konva.Filters.Brighten, Konva.Filters.Contrast]);
node.brightness(0.2);
node.contrast(10);
```

顺序有影响，见[多个滤镜](/docs/filters/multiple-filters)。

## 与其他方案的取舍

**CSS 的 `brightness()`** 是乘法而非加法——`brightness(1.2)` 是把每个分量乘以 1.2。
乘法保持了明暗关系的比例，视觉上比加法自然得多，而且由浏览器原生实现，更快。

多数「想让图片亮一点」的需求，用 CSS 滤镜的效果和性能都更好：

```js
node.filters(['brightness(1.2)']);
node.cache();
```

`Konva.Filters.Brighten` 的适用场景是：你确实需要**线性加法**的语义
（例如给整幅图叠加一层均匀的光），或者需要和其他函数式滤镜组合在同一条链里。

注意两者不能混用而仍走原生路径——数组里混入一个函数式滤镜，整组都会退回逐像素。
