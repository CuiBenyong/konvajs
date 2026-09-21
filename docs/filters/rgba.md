---
title: 'RGB滤镜'
description: '用 Konva.Filters.RGBA 调整图片的红、绿、蓝与透明度分量，实现整体调色或半透明叠色效果。'
sidebar_position: 7
---

RGBA 滤镜按通道调整颜色。它是在原像素上做加权混合，不是直接替换颜色。

## 用法

要使用滤镜在`Konva.Image`我们必须首先使用`cache（）`函数
然后使用滤镜在`filter（）`函数。  

要使用`Konva`更改图像的rgba组合，我们可以使用`Konva.Filters.RGBA`。  
查看所有可用的滤镜，请查看<a href="https://konvajs.org/api/Konva.Filters.html" target="_blank">滤镜文档</a>。  

说明：滑动控件以更改rgba值。 

For all available filters go to<a href="https://konvajs.org/api/Konva.Filters.html" target="_blank">Filters Documentation</a>.
<iframe src="/downloads/code/filters/RGBA.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva RGBA Image Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #controls {
      position: absolute;
      top: 20px;
      left: 20px; 
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="controls">
    Red: <input id="red" type="range" min="0" max="256" step="1" value="150">
    Green: <input id="green" type="range" min="0" max="256" step="1" value="150">
    Blue: <input id="blue" type="range" min="0" max="256" step="1" value="150">
    Alpha: <input id="alpha" type="range" min="0" max="1" step="0.05" value="0.5">
  </div>
  <script>
    Konva.Image.fromURL('../../../assets/lion.png', function(lion) {
      var stage = new Konva.Stage({
        container: 'container',
        width: 300,
        height: 200
      });

      var layer = new Konva.Layer();

      lion.position({
        x: 50,
        y: 50
      });
      lion.cache();
      lion.filters([Konva.Filters.RGBA]);
      layer.add(lion);
      stage.add(layer);

      var sliders = ['red', 'green', 'blue', 'alpha'];
      sliders.forEach(function(attr) {
          var slider = document.getElementById(attr); 
          function update() {
            lion[attr](parseFloat(slider.value));
            layer.batchDraw();    
          }
          slider.oninput = update;
          update();
      });
    });
  </script>

</body>
</html>
```

## 常见问题

### 四个分量分别怎么取值？

`red`、`green`、`blue` 取 0 到 255，`alpha` 取 0 到 1。

要点在于 `alpha` 不是节点的透明度，而是**这层颜色的混合权重**：
`alpha` 为 0 时完全不影响原图，为 1 时原图被目标颜色完全覆盖。

所以想做「淡淡的蓝色滤镜」，是设 `red: 0, green: 100, blue: 255, alpha: 0.3`，
而不是把节点 `opacity` 调低。

### 和直接设 fill 有什么区别？

`fill` 是替换整个填充区域的颜色，原有的图案、渐变、图片内容全没了。

RGBA 滤镜是在**已有像素之上**做混合，图片的明暗层次、纹理细节都保留着，
只是整体色调偏向目标颜色。

给照片加暖色调、做选中态的蒙层，要的是后者。

### 和节点的 opacity 冲突吗？

不冲突，两者作用在不同阶段。滤镜的 `alpha` 决定颜色混合的强度，
节点的 `opacity` 决定最终结果与下方内容的合成透明度。

两个都设会叠加生效：先按 `alpha` 混出偏色的图像，再整体按 `opacity` 半透明贴上去。

## 与其他方案的取舍

要给内容整体染色，有三条路。

**RGBA 滤镜**保留原有明暗层次，适合照片调色、状态蒙层。代价是逐像素处理，
且必须先 `cache()`。

**在上方叠一个半透明色块**不需要缓存、开销极低，视觉上与 RGBA 滤镜的
`alpha` 混合几乎一致。多数「加个蒙层」的需求用这个就够了，
而且色块可以单独控制形状与动画。

**CSS 滤镜 `sepia` / `hue-rotate` 组合**由浏览器原生实现，性能最好，
但只能表达特定的色调变换，无法精确指定目标颜色。

判断依据：需要精确的目标色且要保留层次，用 RGBA 滤镜；只是要个蒙层，
叠色块更省；要的是「老照片」「冷色调」这类风格化效果，用 CSS 滤镜。
