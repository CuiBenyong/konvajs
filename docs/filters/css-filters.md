---
title: 'CSS 原生滤镜'
description: 'Konva 10 的 filters 除了接受 Konva.Filters 函数，还接受 blur(6px)、saturate(1.8) 这类 CSS 滤镜字符串。全部为字符串时走浏览器原生实现，比逐像素处理快。'
sidebar_position: 8
---

Konva 10 起，`filters` 除了接受 `Konva.Filters` 下的滤镜函数，还接受 CSS
滤镜字符串：

```js
const image = new Konva.Image({
  image: imageObj,
  x: 50,
  y: 50,
  filters: ['blur(6px)', 'saturate(1.8)'],
});
image.cache();
```

## 仍然需要 cache()

和函数式滤镜一样，**CSS 滤镜也必须先调用 `cache()` 才会生效**。Konva 的滤镜
统一作用在缓存出来的位图上，换成字符串写法并不改变这一点——漏掉 `cache()`
不会报错，只是画面上什么变化都没有，很容易误以为写法不对。

## 真正的好处：走浏览器原生实现

当 `filters` 数组里**全部**是字符串、且浏览器支持 canvas 的 `filter` 属性时，
Konva 会直接把滤镜交给浏览器执行，不再逐像素跑 JavaScript。数组里只要混入
一个函数式滤镜，整组就退回逐像素路径。

浏览器不支持时，Konva 用 JavaScript 实现兜底，但**兜底只覆盖六种**：
`blur`、`brightness`、`contrast`、`grayscale`、`sepia`、`invert`。
用到这六种之外的 CSS 滤镜（如 `saturate`、`hue-rotate`）时，兜底路径会在
控制台打印警告并跳过该滤镜。

## 与其他方案的取舍

| | CSS 滤镜字符串 | Konva.Filters 函数 |
|---|---|---|
| 需要 cache() | 是 | 是 |
| 实现 | 浏览器原生（全字符串时） | JavaScript 逐像素 |
| 可用效果 | CSS filter 规范定义的那些 | Konva 提供的全部，含万花筒等 CSS 没有的 |
| 不支持时的兜底 | 仅 blur/brightness/contrast/grayscale/sepia/invert | 不涉及 |
| 能否自定义 | 否 | 可以写自定义滤镜函数 |

需要[万花筒](/docs/filters/kaleidoscope)这类 CSS 规范里没有的效果时，仍然用
[Konva.Filters](/docs/filters/blur)。

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

      // 右边：CSS 滤镜字符串。和函数式滤镜一样必须先 cache()——
      // 漏掉不会报错，只是画面毫无变化。
      var filtered = new Konva.Image({
        x: 230,
        y: 20,
        image: imageObj,
        width: 180,
        height: 180,
        filters: ['blur(6px)', 'saturate(1.8)']
      });
      filtered.cache();
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

## 常见问题

### 怎么确认走的是原生路径还是兜底路径？

判断规则是确定的：`filters` 数组里**全部**是字符串、且浏览器支持 canvas 的
`filter` 属性时走原生；否则逐像素。

想在代码里确认浏览器是否支持，可以建一个临时 2D 上下文看有没有 `filter` 属性：

```js
const supported = 'filter' in document.createElement('canvas').getContext('2d');
```

更直接的办法是看性能——原生路径下大图的滤镜几乎不耗时，
逐像素路径在 Performance 面板里会有明显的脚本执行时间。

### 混用字符串和函数式滤镜会怎样？

能正常工作，但**整条链退回逐像素路径**，原生实现的性能优势完全消失。

所以滤镜链的设计原则是：要么全用字符串，要么接受逐像素的代价。
为了省一个函数式滤镜而把其余都改成字符串，是没有收益的。

### 用了 CSS 规范里有但兜底不支持的滤镜会怎样？

兜底实现只覆盖六种：`blur`、`brightness`、`contrast`、`grayscale`、`sepia`、`invert`。

用 `saturate`、`hue-rotate`、`drop-shadow` 这些时，如果浏览器支持原生路径，
一切正常；一旦退回兜底（因为链里混了函数式滤镜，或浏览器不支持），
这些滤镜会被**静默跳过**并在控制台打印一条警告。

结果是效果只实现了一部分，而且不报错。依赖这几个滤镜时值得在目标浏览器上实测一遍。
