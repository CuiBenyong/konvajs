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

## 性能提示

每段补间在 `onFinish` 里调用了 `destroy()`，`Animation` 到点也会 `stop()`。
重复点击时先执行 `stopAnimation()` 把上一轮全部清掉——否则多轮动画会同时
作用在同一个节点上互相打架，`Animation` 也会一直跑下去持续占用每一帧。

这类「多段动画 + 可重复触发」的结构里，清理的开销远小于不清理的代价。
一个没停下来的 `Animation` 会让它绑定的图层每帧都重绘，即使画面已经静止；
几次重复触发之后，后台可能同时跑着三四个这样的循环，而用户什么都看不出来，
只觉得页面越来越卡。

统一的中止入口（这里的 `stopAnimation()`）是可靠的做法：所有启动路径都先调它，
不必在每处分别判断当前有哪些动画在跑。

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

## 常见问题

### 为什么渐变色标不能用 Tween？

`fillLinearGradientColorStops` 是一个「位置、颜色」交替排列的数组，
里面混着数字和颜色字符串。`Konva.Tween` 只能对数值做插值，
面对这种混合结构无从下手。

所以要用 [`Konva.Animation`](/docs/animations/create-an-animation) 每帧自己算出
新的色标数组再写回去。同理，任何数组型或结构化的属性都只能这样处理。

### 多段动画的清理时机是什么？

每段补间在它自己的 `onFinish` 里 `destroy()`，`Animation` 在不需要时 `stop()`。

关键是要有一个**统一的中止入口**。上面演示里的 `stopAnimation()` 就是这个作用——
它把所有正在进行的补间和动画一次性清掉，供重复触发时调用。

没有这个入口的话，用户连点几次，多轮动画会同时作用在同一个节点上，
属性被反复覆盖，画面表现完全不可预测。

### 重复触发时怎么避免动画叠加？

在启动新一轮之前先执行中止逻辑，这是最简单可靠的做法：

```js
circle.on('click', () => {
  stopAnimation();  // 先清掉上一轮
  // 再启动新的
});
```

另一种思路是加一个「动画进行中」的标志位，进行中时忽略新的触发。
两者的区别是产品语义：前者是「以最后一次点击为准」，
后者是「动画期间不响应」。选哪个取决于你希望用户感受到什么。
