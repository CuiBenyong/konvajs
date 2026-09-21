---
title: '简单的补间动画'
description: 'Konva 常用缓动函数：EaseIn 由慢到快、EaseOut 由快到慢、EaseInOut 两头慢中间快，通过 Tween 的 easing 属性设置。'
sidebar_position: 2
---

缓动函数改变的是进度曲线，不是时长。同样 1 秒的动画，不同缓动的观感差别很大。

## 用法

要使用Konva创建一个非线性缓动的tween动画，我们可以将它的`easing`属性设置为其他类型的缓动函数。 除了`Konva.Easings.Linear`，其他常用的缓动函数有`Konva.Easings.EaseIn`,
`Konva.Easings.EaseInOut`, 和 `Konva.Easings.EaseOut`。


本教程演示了Konva提供的所有缓动函数集，包括Linear, Ease, Back, Elastic, Bounce, and Strong.。

有关所有可用的缓动函数，请访问<a href="https://konvajs.org/api/Konva.Easing.html" target="_blank">Easings 文档</a>。

说明：鼠标悬浮或者直接触摸下面的盒子, 它们会分别以不同的缓动函数做动画
<iframe src="/downloads/code/tweens/Common_Easing.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Common Easing Demo</title>
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

    var greenBox = new Konva.Rect({
        x: 70,
        y: stage.getHeight() / 2,
        width: 100,
        height: 50,
        fill: 'green',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: 50,
            y: 25
        }
    });

    var blueBox = new Konva.Rect({
        x: 190,
        y: stage.getHeight() / 2,
        width: 100,
        height: 50,
        fill: 'blue',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: 50,
            y: 25
        }
    });

    var redBox = new Konva.Rect({
        x: 310,
        y: stage.getHeight() / 2,
        width: 100,
        height: 50,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: 50,
            y: 25
        }
    });

    layer.add(greenBox);
    layer.add(blueBox);
    layer.add(redBox);
    stage.add(layer);

    // the tween has to be created after the node has been added to the layer
    greenBox.tween = new Konva.Tween({
        node: greenBox,
        scaleX: 2,
        scaleY: 1.5,
        easing: Konva.Easings.EaseIn,
        duration: 1
    });

    blueBox.tween = new Konva.Tween({
        node: blueBox,
        scaleX: 2,
        scaleY: 1.5,
        easing: Konva.Easings.EaseInOut,
        duration: 1
    });

    redBox.tween = new Konva.Tween({
        node: redBox,
        scaleX: 2,
        scaleY: 1.5,
        easing: Konva.Easings.EaseOut,
        duration: 1
    });

    // use event delegation
    layer.on('mouseover touchstart', function(evt) {
        evt.target.tween.play();
    });

    layer.on('mouseout touchend', function(evt) {
        evt.target.tween.reverse();
    });
  </script>

</body>
</html>
```

## 常见问题

### 缓动会改变动画时长吗？

不会。`duration` 是多少就是多少，缓动只决定「这段时间里进度怎么分配」。

`EaseIn` 是前慢后快——前半段走的距离少，后半段快速追上；
`EaseOut` 相反。总时长完全一样。

### 该选哪一种？

有个经验规则：**物体进入视野用 EaseOut，离开视野用 EaseIn**。

进入时一开始快、逐渐减速停下，符合物体有惯性的直觉；
离开时先慢后快，像是被加速带走。反过来会显得别扭。

两端都在画面内的位移（比如拖回原位）用 `EaseInOut`，
两头慢中间快，是最自然的通用选择。

### 线性缓动什么时候用？

匀速运动的场合——进度条、加载动画、匀速旋转的齿轮。

对于「物体移动」类的动画，线性通常显得机械，因为现实中的物体
总有加速和减速的过程。但如果你要表达的就是机械感，线性是对的。

## 与其他方案的取舍

Konva 内置的缓动函数覆盖了常见需求，直接用就好。

需要自定义时，`easing` 接受任意函数，签名是 `(t, b, c, d)`——当前时间、起始值、变化量、总时长，返回当前应有的值。
这是 Robert Penner 缓动函数的经典签名，网上大量现成实现可以直接拿来用。

如果你的项目里已经在用 GSAP、anime.js 这类动画库，也可以让它们驱动数值、
在回调里写回 Konva 节点。但这样就绕过了 Konva 的 Tween，
`pause()`、`reverse()` 这些控制要用那个库的 API。
除非确实需要时间轴编排，否则不值得引入。
