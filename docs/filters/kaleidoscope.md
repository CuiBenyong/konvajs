---
title: '万花筒'
description: '用 Konva.Filters.Kaleidoscope 制作万花筒效果，由 kaleidoscopePower 控制分片数量、kaleidoscopeAngle 控制起始角度。'
sidebar_position: 5
---

万花筒把图像按扇形切片并镜像重复。它是 CSS 滤镜完全没有对应物的效果之一。

## 用法

要使用滤镜在`Konva.Image`我们必须首先使用`cache（）`函数
然后使用滤镜在`filter（）`函数。    

要使用`Konva`创建万花筒，我们可以使用`Konva.Filters.Kaleidoscope`
滤镜并设置`kaleidoscopePower`和`kaleidoscopeAngle`属性。 

查看所有可用的滤镜，请查看<a href="https://konvajs.org/api/Konva.Filters.html" target="_blank">滤镜文档</a>。    



说明：滑动控制以调整万花筒角度。
<iframe src="/downloads/code/filters/Kaleidoscope.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Kaleidoscope Image Demo</title>
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
  <input id="slider" type="range" min="0" max="360" step="5" value="20">
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
      lion.filters([Konva.Filters.Kaleidoscope]);
      lion.kaleidoscopePower(3);
      layer.add(lion);
      stage.add(layer);
      var slider = document.getElementById('slider'); 
      slider.onchange = function() {
        lion.kaleidoscopeAngle(slider.value);
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

### 两个参数分别控制什么？

`kaleidoscopePower` 控制切片数量——它是 2 的指数，值为 2 时得到 4 片，
值为 3 时 8 片，以此类推。

`kaleidoscopeAngle` 控制起始角度，决定从原图的哪个方向开始取样。
改这个值可以在不换图的前提下得到完全不同的图案。

### 效果和预期差很多？

万花筒是从图像**中心**取一个扇形区域再重复的。如果画面主体不在中心，
取到的可能是一块空白或者无关的边角。

调整办法是先把图像位置摆好，让想要的内容落在中心附近，
再应用滤镜。必要时配合 `offset` 移动节点原点。

### 为什么这么卡？

它是所有内置滤镜里计算量最大的之一——每个输出像素都要做坐标变换、
反查源像素、做插值。

静态使用时只在 `cache()` 那一刻算一次，不成问题。
但如果在动画里逐帧改参数，每帧都是一次全图重算，几乎必然掉帧。

## 性能提示

万花筒是「一次性算好、长期复用」的典型场景。

**静态图案预先生成**。如果参数固定，与其在运行时算，不如把结果
`toDataURL()` 导出成图片，下次直接当图片用。省掉全部运行时开销。

**需要动画时降低分辨率**。`cache({ pixelRatio: 0.5 })` 让处理的像素数减到四分之一，
万花筒本身是高度对称的图案，分辨率降低不太容易察觉。

**不要和其他重滤镜叠加**。它已经是最贵的一个，再串一个模糊上去，
开销是相乘而不是相加。确实需要多种效果时，考虑分步预渲染。
