---
title: '混合模式'
description: '用 Konva 的 globalCompositeOperation 设置混合模式，支持 multiply、screen、overlay 等全部 Canvas 合成操作，可实现遮罩与叠色效果。'
sidebar_position: 8
---

混合模式决定图形与它下方已绘制内容如何合成，可以做出遮罩、提亮、去色等效果。

## 用法

<a href="https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation" target="_blank">globalCompositeOperation</a>文档.
在 Konva 里你可以通过 `globalCompositeOperation` 属性来设置 `globalCompositeOperation` 和 混合模式。

说明：拖动红色矩形到文字上面看看。
<iframe src="/downloads/code/styling/Blend_Mode.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Blend Mode Demo</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #f0f0f0;
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
        fill: 'green',
        // stroke: 'red',
        strokeWidth: 2,
        shadowColor: 'white',
        // shadowBlur: 0,
        shadowOffset: { x: 10, y: 10 }
        // shadowOpacity: 0.5
      });
      layer.add(text);

      var rect = new Konva.Rect({
        x: 50,
        y: 50,
        // stroke: 'red',
        width: 100,
        height: 100,
        fill: 'red',
        draggable: true,
        globalCompositeOperation: 'xor'
      });

      layer.add(rect);
      stage.add(layer);
    </script>
  </body>
</html>
```

## 常见问题

### 跨图层的混合为什么不生效？

因为每个 `Konva.Layer` 是一张独立的 canvas。混合模式作用于**同一张画布上**
已经绘制的内容，跨图层时下方图层的像素不在同一张画布里。

所以要让 A 与 B 混合，两者必须在同一图层内，而且 A 的绘制顺序在 B 之后。
把它们放进同一个分组是最可靠的做法。

### 混合的对象包括哪些？

同一图层内**已经画上去的所有内容**，不只是正下方那一个图形。

这意味着结果受绘制顺序影响很大：同样两个图形，交换 `zIndex` 后效果可能完全不同。
调试时先确认层级，再调模式。

如果只想和特定几个图形混合，把它们和目标图形一起放进分组，
分组内的合成是独立的。

### 不同浏览器效果不一样？

大部分模式的实现是一致的，但 `color-dodge`、`color-burn`、`saturation` 这类
在边界值（纯黑、纯白、零饱和度）上各家处理有细微差异。

做视觉要求严格的效果时，至少在 Chrome 与 Safari 上各看一眼。
国内还要考虑各类 WebView，它们的内核版本往往落后。

## 与其他方案的取舍

很多效果既可以用混合模式，也可以用别的办法，取舍主要在**可控性**与**性能**。

**做遮罩**：混合模式（`destination-in` 一类）写起来短，但影响整层已绘内容，
容易误伤。用容器的 [`clipFunc`](/docs/clipping/clipping-function) 范围更明确，
只作用于该容器的子节点。复杂形状的遮罩推荐后者。

**做半透明叠加**：直接设 `opacity` 更直观，性能也更好。
只有需要「相乘」「滤色」这类非线性合成时，混合模式才不可替代。

**做提亮压暗**：[滤镜](/docs/filters/brighten)作用于单个节点、可精确控制参数；
混合模式作用于合成结果、受下方内容影响。前者可预测，后者更有「氛围」。
