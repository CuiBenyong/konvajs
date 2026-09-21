---
title: '多个滤镜'
description: '给同一个 Konva 节点叠加多个滤镜：filters() 接收一个滤镜数组，按数组顺序依次作用于缓存后的位图。'
sidebar_position: 6
---

`filters` 接受一个数组，滤镜按顺序依次作用。顺序不同，结果不同。

## 用法

要使用多个滤镜在`Konva.Image`我们必须首先使用`cache（）`函数
然后使用滤镜在`filter（）`函数里。       

查看所有可用的滤镜，请查看<a href="https://konvajs.org/api/Konva.Filters.html" target="_blank">滤镜文档</a>。
<iframe src="/downloads/code/filters/Multiple_Filters.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Multiple Filters Demo</title>
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
      lion.filters([Konva.Filters.Blur, Konva.Filters.Invert]);
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

### 顺序真的会影响结果吗？

会，而且往往差别很大。滤镜是流水线——后一个处理的是前一个的输出。

先模糊再提亮，得到的是「柔和的亮图」；先提亮再模糊，高光已经被截断，
模糊的是一张丢了细节的图，结果更平。

同理，先灰度再调色相不会有任何变化（灰度已无色相可调），
反过来则正常。排查「某个滤镜好像没生效」时，先检查它前面有没有
把它依赖的信息抹掉的滤镜。

### 能混用 CSS 滤镜字符串和函数式滤镜吗？

可以放在同一个数组里，Konva 会依次处理。但有个重要后果：

**只要数组里有一个不是字符串，整组都会走逐像素路径**，
失去浏览器原生实现的性能优势。

所以如果你的滤镜链里有一个万花筒（没有 CSS 对应物），
其余的用不用 CSS 写法在性能上就没区别了。反过来，如果全部都能用 CSS 表达，
就不要混入任何函数式滤镜。详见 [CSS 原生滤镜](/docs/filters/css-filters)。

### 滤镜参数设在哪里？

设在**节点**上，不是滤镜上。滤镜本身是无状态的函数：

```js
node.filters([Konva.Filters.Blur, Konva.Filters.Brighten]);
node.blurRadius(10);
node.brightness(0.2);
node.cache();
```

这带来一个限制：**同一个滤镜不能在链里用两次不同的参数**，
因为参数只有一份。需要两次不同强度的模糊，只能分成两个节点或分两步缓存。

## 性能提示

滤镜链的开销是各环节之和，但有几个非线性的地方值得注意。

**尽早缩小数据量**。如果链里有降低分辨率的操作（比如 `Pixelate`），
把它放在前面，后续滤镜处理的有效信息更少。

**避免重复的全图扫描**。每个函数式滤镜都要完整遍历一遍像素数组。
五个滤镜就是五遍。能用一个 CSS 滤镜字符串表达多种效果时
（`'blur(4px) saturate(1.5)'` 写在同一个字符串里），浏览器会一次处理完。

**链越长越要缓存**。多滤镜节点的重建成本很高，务必确认它不会频繁
`clearCache()` + `cache()`。
