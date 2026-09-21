---
title: 'CSS 原生滤镜'
description: 'Konva 10 支持直接用 CSS 滤镜字符串（如 blur(10px)、saturate(2)）替代 Konva.Filters，由浏览器原生实现，且不需要先调用 cache()。'
sidebar_position: 8
---

Konva 10 起，`filters()` 除了接受 `Konva.Filters` 下的滤镜函数，还接受 CSS
滤镜字符串。这类滤镜由浏览器原生实现，通常比 JavaScript 逐像素处理快得多，
而且**不需要先调用 `cache()`**：

```js
const image = new Konva.Image({
  image: imageObj,
  x: 50,
  y: 50,
  filters: ['blur(10px)', 'saturate(1.8)'],
});
```

## 与 Konva.Filters 的取舍

| | CSS 滤镜 | Konva.Filters |
|---|---|---|
| 是否需要 cache() | 否 | 是 |
| 性能 | 浏览器原生，通常更快 | JavaScript 逐像素 |
| 可用效果 | CSS filter 规范定义的那些 | Konva 提供的全部，含万花筒等 CSS 没有的 |
| 能否自定义 | 否 | 可以写自定义滤镜函数 |

需要[万花筒](/docs/filters/kaleidoscope)这类 CSS 规范里没有的效果时，仍然用
[Konva.Filters](/docs/filters/blur)。两者也可以混用，写在同一个 `filters` 数组里。

## 长度单位按节点坐标计算

`blur(8px)` 里的长度是**节点坐标**而非缓存像素。这一点在 Konva 10.6.0 修正过——
此前它按缓存像素计算，导致同一个 `blur(8px)` 在更高的 `pixelRatio` 下看起来
反而更清晰。如果你在 10.6.0 之前调过模糊半径来「凑」效果，升级后需要复核。

写自定义滤镜函数时也要注意：10.6.0 起回调签名是 `(imageData, pixelRatio)`，
需要用第二个参数把节点长度换算成像素。

<iframe src="/downloads/code/filters/CSS_Filters.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * filters/CSS_Filters.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva CSS Filters Demo</title>
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
    stage.add(layer);

    var imageObj = new Image();
    imageObj.onload = function () {
      // 左边：原图
      var original = new Konva.Image({
        x: 20,
        y: 20,
        image: imageObj,
        width: 180,
        height: 180
      });
      layer.add(original);

      // 右边：CSS 原生滤镜。注意这里没有调用 cache()——
      // CSS 滤镜由浏览器实现，不需要先把节点缓存成位图。
      var filtered = new Konva.Image({
        x: 230,
        y: 20,
        image: imageObj,
        width: 180,
        height: 180,
        filters: ['blur(6px)', 'saturate(1.8)']
      });
      layer.add(filtered);

      var label = new Konva.Text({
        x: 20,
        y: 210,
        text: '左：原图    右：blur(6px) + saturate(1.8)',
        fontSize: 14,
        fill: '#333'
      });
      layer.add(label);
    };
    imageObj.src = '/assets/yoda.jpg';
  </script>

</body>
</html>
```
