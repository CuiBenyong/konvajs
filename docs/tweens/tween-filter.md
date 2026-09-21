---
title: '滤镜效果'
description: '用 Konva.Tween 对滤镜参数做过渡动画，本例演示让 blurRadius 在动画过程中变化，实现由清晰到模糊的渐变效果。'
sidebar_position: 6
---

滤镜参数是数值，因此可以补间。但每一帧都要重新跑一遍滤镜，代价需要心里有数。

## 用法

要使用Konva创建一个改变滤镜效果的tween动画, 我们可以通过给滤镜上绑定的属性添加过渡效果来实现. 

在本教程中，我们将为滤镜的`blurRadius`属性添加过渡效果，使图像的模糊度在动画中发生改变。

说明：将鼠标悬停在图像上以获得焦点。
<iframe src="/downloads/code/tweens/Tween_Filter.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Tween Filter Demo</title>
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

    var lion = new Konva.Image({
        x: 80,
        y: 30,
        draggable: true
    });
    layer.add(lion);
    stage.add(layer);

    var image = new Image();
    image.onload = function() {
        lion.image(image);
        lion.cache();
        lion.filters([Konva.Filters.Blur]);
        lion.blurRadius(10);
        layer.draw();

        // the tween has to be created after the node has been added to the layer
        var tween = new Konva.Tween({
            node: lion,
            duration: 0.6,
            blurRadius: 0,
            easing: Konva.Easings.EaseInOut
        });

        lion.on('mouseover', function() {
            tween.play();
        });

        lion.on('mouseout', function() {
            tween.reverse();
        });
    };
    image.src = '/assets/lion.png';
  </script>

</body>
</html>
```

## 常见问题

### 补间滤镜之前要做什么？

节点必须已经 `cache()`，并且 `filters` 已经设好。补间改的只是参数，
不能用它来「添加」滤镜。

```js
node.filters([Konva.Filters.Blur]);
node.cache();
node.to({ blurRadius: 20, duration: 1 });
```

### 为什么补间滤镜特别卡？

因为每一帧都要重新执行一遍滤镜计算。普通属性补间只是写个数字，
滤镜补间是整张位图重新处理。

[模糊](/docs/filters/blur)尤其贵——开销随半径的平方增长，
从 0 补到 20 的过程中，后期每帧的成本是前期的几十倍。

### CSS 滤镜字符串能补间吗？

不能。补间需要数值，而 CSS 滤镜是字符串。

想要类似效果，可以用 `Konva.Animation` 每帧重新拼字符串：

```js
new Konva.Animation((frame) => {
  const r = (frame.time / 1000) * 10;
  node.filters([`blur(${r}px)`]);
}, layer);
```

注意这样每帧都要重设 `filters` 并重建缓存，比数值补间更贵。

## 性能提示

滤镜补间是「明知很贵但效果需要」的典型场景，可以做的是尽量压缩成本。

**降低缓存分辨率**。`node.cache({ pixelRatio: 0.5 })` 让处理的像素数减到四分之一。
模糊这类本来就在抹细节的滤镜，分辨率降低几乎看不出来。

**缩短时长、减少帧数**。半秒的滤镜过渡和两秒的，观感差别不大，成本差四倍。

**考虑用不透明度代替**。想要「从模糊到清晰」的效果，
可以准备清晰和模糊两个静态节点，补间它们的 `opacity` 做交叉淡入。
滤镜只在初始化时算两次，动画过程零滤镜开销。这个办法在多数场景下
视觉上难以分辨，性能却是数量级的差距。
