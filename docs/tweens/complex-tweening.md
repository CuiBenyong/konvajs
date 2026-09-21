---
title: '复杂补间动画'
description: '把多段 Konva.Tween 用 onFinish 串联，并配合 Konva.Animation 逐帧更新渐变色标——fillLinearGradientColorStops 无法用 Tween 直接过渡。'
sidebar_position: 4
---

复杂动画往往不是一段补间能表达的。这一页演示两件事：用 `onFinish` 把多段
`Konva.Tween` 串成序列，以及用 `Konva.Animation` 处理 `Tween` 无法直接过渡的属性。

点击圆形后会依次发生：先以 `EaseInOut` 放大到 1.5 倍，结束时自动启动第二段补间
以 `BounceEaseOut` 弹回原尺寸；与此同时，一个 `Konva.Animation` 每帧改写
`fillLinearGradientColorStops`，让渐变的中间色标持续移动，2 秒后停止。

## 为什么渐变要用 Animation 而不是 Tween

`Konva.Tween` 过渡的是数值型属性。`fillLinearGradientColorStops` 是一个
「位置、颜色」交替排列的数组，中间还夹着颜色字符串，不能按数值插值，
所以这里用 `Konva.Animation` 在每一帧里自己算出新的色标数组再写回去。

## 记得清理

每段补间在 `onFinish` 里调用了 `destroy()`，`Animation` 到点也会 `stop()`。
重复点击时先执行 `stopAnimation()` 把上一轮全部清掉——否则多轮动画会同时
作用在同一个节点上互相打架，`Animation` 也会一直跑下去持续占用每一帧。

<iframe src="/downloads/code/tweens/Complex_Tweening.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * tweens/Complex_Tweening.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Complex Tweening Demo</title>
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

    var circle = new Konva.Circle({
      x: width / 2,
      y: height / 2,
      radius: 70,
      fillLinearGradientStartPoint: { x: -50, y: -50 },
      fillLinearGradientEndPoint: { x: 50, y: 50 },
      fillLinearGradientColorStops: [0, 'red', 1, 'yellow'],
      stroke: 'black',
      strokeWidth: 4,
      draggable: true
    });

    layer.add(circle);
    stage.add(layer);

    var scaleUpTween, scaleDownTween, gradientAnimation, gradientTimer;

    function stopAnimation() {
      if (scaleUpTween) scaleUpTween.destroy();
      if (scaleDownTween) scaleDownTween.destroy();
      if (gradientAnimation) gradientAnimation.stop();
      clearTimeout(gradientTimer);
      scaleUpTween = scaleDownTween = gradientAnimation = gradientTimer = undefined;
    }

    circle.on('click tap', function () {
      stopAnimation();

      // 第一段补间：放大
      scaleUpTween = new Konva.Tween({
        node: circle,
        duration: 1,
        scaleX: 1.5,
        scaleY: 1.5,
        easing: Konva.Easings.EaseInOut,
        onFinish: function () {
          scaleUpTween.destroy();
          scaleUpTween = undefined;
          // 在上一段结束时启动第二段：弹回原尺寸
          scaleDownTween = new Konva.Tween({
            node: circle,
            duration: 1,
            scaleX: 1,
            scaleY: 1,
            easing: Konva.Easings.BounceEaseOut,
            onFinish: function () {
              scaleDownTween.destroy();
              scaleDownTween = undefined;
            }
          });
          scaleDownTween.play();
        }
      });
      scaleUpTween.play();

      // 渐变色标无法用 Tween 直接过渡，改用 Animation 每帧手动更新
      var ratio = 0;
      gradientAnimation = new Konva.Animation(function (frame) {
        ratio += frame.timeDiff / 1000;
        if (ratio > 1) ratio = 0;
        circle.fillLinearGradientColorStops([0, 'red', ratio, 'yellow', 1, 'blue']);
      }, layer);
      gradientAnimation.start();

      gradientTimer = setTimeout(function () {
        gradientAnimation.stop();
        gradientAnimation = undefined;
        gradientTimer = undefined;
      }, 2000);
    });

    // 首屏就让读者看到效果，不必等点击
    circle.fire('click');
  </script>

</body>
</html>
```
