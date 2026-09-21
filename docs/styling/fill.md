---
title: 'Fill 填充'
description: '用 Konva 的 fill 属性或 fill() 方法填充图形。除纯色外还支持图案填充、线性渐变与径向渐变。'
sidebar_position: 1
---

填充支持纯色、渐变和图案。渐变的坐标系是最容易搞错的一处。

## 用法

使用`Konva`填充图形,我们可以在实例化图形是设置`fill`属性,也可以使用`fill()`方法.

`Konva`支持颜色.图案.线性渐变和径向渐变.



说明：鼠标悬停在每个五边形以更改其填充。 您也可以拖放形状。
<iframe src="/downloads/code/styling/Fill.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Fill Demo</title>
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
    function loadImages(sources, callback) {
        var images = {};
        var loadedImages = 0;
        var numImages = 0;
        // get num of sources
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
    function draw(images) {
        var width = window.innerWidth;
        var height = window.innerHeight;

        var stage = new Konva.Stage({
            container: 'container',
            width: width,
            height: height
        });
        var layer = new Konva.Layer();

        var colorPentagon = new Konva.RegularPolygon({
            x: 80,
            y: stage.getHeight() / 2,
            sides: 5,
            radius: 70,
            fill: 'red',
            stroke: 'black',
            strokeWidth: 4,
            draggable: true
        });

        var patternPentagon = new Konva.RegularPolygon({
            x: 220,
            y: stage.getHeight() / 2,
            sides: 5,
            radius: 70,
            fillPatternImage: images.darthVader,
            fillPatternOffset: { x : -220, y : 70},
            stroke: 'black',
            strokeWidth: 4,
            draggable: true
        });

        var linearGradPentagon = new Konva.RegularPolygon({
            x: 360,
            y: stage.getHeight() / 2,
            sides: 5,
            radius: 70,
            fillLinearGradientStartPoint: { x : -50, y : -50},
            fillLinearGradientEndPoint: { x : 50, y : 50},
            fillLinearGradientColorStops: [0, 'red', 1, 'yellow'],
            stroke: 'black',
            strokeWidth: 4,
            draggable: true
        });

        var radialGradPentagon = new Konva.RegularPolygon({
            x: 500,
            y: stage.getHeight() / 2,
            sides: 5,
            radius: 70,
            fillRadialGradientStartPoint: 0,
            fillRadialGradientStartRadius: 0,
            fillRadialGradientEndPoint: 0,
            fillRadialGradientEndRadius: 70,
            fillRadialGradientColorStops: [0, 'red', 0.5, 'yellow', 1, 'blue'],
            stroke: 'black',
            strokeWidth: 4,
            draggable: true
        });

        /*
               * bind listeners
               */
        colorPentagon.on('mouseover touchstart', function() {
            this.setFill('blue');
            layer.draw();
        });

        colorPentagon.on('mouseout touchend', function() {
            this.setFill('red');
            layer.draw();
        });

        patternPentagon.on('mouseover touchstart', function() {
            this.setFillPatternImage(images.yoda);
            this.setFillPatternOffset({ x : -100, y : 70});
            layer.draw();
        });

        patternPentagon.on('mouseout touchend', function() {
            this.setFillPatternImage(images.darthVader);
            this.setFillPatternOffset({x : -220, y :70});
            layer.draw();
        });

        linearGradPentagon.on('mouseover touchstart', function() {
            this.setFillLinearGradientStartPoint({ x: -50});
            this.setFillLinearGradientEndPoint({ x : 50});
            this.setFillLinearGradientColorStops([0, 'green', 1, 'yellow']);
            layer.draw();
        });

        linearGradPentagon.on('mouseout touchend', function() {
            // set multiple properties at once with setAttrs
            this.setAttrs({
                fillLinearGradientStartPoint: {x : -50, y : -50},
                fillLinearGradientEndPoint: { x : 50, y : 50},
                fillLinearGradientColorStops: [0, 'red', 1, 'yellow']
            });
            layer.draw();
        });

        radialGradPentagon.on('mouseover touchstart', function() {
            this.setFillRadialGradientColorStops([0, 'red', 0.5, 'yellow', 1, 'green']);
            layer.draw();
        });

        radialGradPentagon.on('mouseout touchend', function() {
            // set multiple properties at once with setAttrs
            this.setAttrs({
                fillRadialGradientStartPoint: 0,
                fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: 0,
                fillRadialGradientEndRadius: 70,
                fillRadialGradientColorStops: [0, 'red', 0.5, 'yellow', 1, 'blue']
            });
            layer.draw();
        });

        layer.add(colorPentagon);
        layer.add(patternPentagon);
        layer.add(linearGradPentagon);
        layer.add(radialGradPentagon);
        stage.add(layer);
    }
    var sources = {
        darthVader: '/assets/darth-vader.jpg',
        yoda: '/assets/yoda.jpg'
    };

    loadImages(sources, function(images) {
        draw(images);
    });
  </script>

</body>
</html>
```

## 常见问题

### 渐变的坐标是相对什么的？

相对**图形自身的坐标系**，不是舞台。

所以 `fillLinearGradientStartPoint: { x: 0, y: 0 }` 指的是图形的原点，
对 `Konva.Rect` 是左上角，对 `Konva.Circle` 是圆心。

这意味着图形移动时渐变跟着走，不需要重新设置——这通常是想要的。
但如果你希望渐变固定在画布上（比如整体的背景光效），就得在移动时手动更新坐标。

### 同时设了 fill 和 fillPattern，哪个生效？

由 `fillPriority` 决定，取值是 `'color'`、`'pattern'`、`'linear-gradient'`、
`'radial-gradient'`。不显式设置时 Konva 按已设置的属性自动推断。

这个属性的实际用途是**切换**：预先把纯色和渐变都配好，
改一个 `fillPriority` 就能切换外观，不用来回设置和清空。

### 图案填充为什么不显示？

和 `Konva.Image` 一样，图片必须先加载完成。在 `onload` 之后再设置
`fillPatternImage`，或者设置完再重绘一次。

另一个常见问题是图案的重复方式——默认 `fillPatternRepeat` 是 `'repeat'`，
图片小于图形时会平铺。想要拉伸填满得自己算 `fillPatternScale`。

## 与其他方案的取舍

三种填充的开销差别不小。

**纯色**最快，就是一次 `fillStyle` 赋值。能用纯色就别用别的。

**渐变**每次绘制都要创建渐变对象并采样，比纯色贵一个数量级。
静态图形影响不大，但如果它在动画里每帧重绘，代价就明显了——这种情况下考虑把图形[缓存](/docs/performance/shape-caching)成位图。

**图案**要额外做纹理采样，还依赖图片加载。它的优势是能表达纯色和渐变做不到的纹理，
但如果只是想要一个重复的几何图案，用一个自定义图形手工画往往更快也更可控。
