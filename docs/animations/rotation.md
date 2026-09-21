---
title: '旋转'
description: '用 Konva.Animation 实现旋转动画：分别演示绕左上角、绕自身中心点与绕外部点旋转，关键在 offset 与 rotation 的配合。'
sidebar_position: 3
---

旋转动画本身很简单，难点在旋转中心的位置和角度的累积。

## 用法

要使用Konva为形状创建旋转动画，我们可以使用`Konva.Animation`创建一个新的动画, 并在每个动画帧中修改形状的旋转角度.

在本教程中，我们将围绕左上角旋转一个蓝色矩形，围绕其自身中心点旋转一个黄色矩形，以及围绕一个外部点旋转一个红色矩形。

有关Konva.Animation的属性和方法的完整列表，请查看<a href="https://konvajs.org/api/Konva.Animation.html" target="_blank">Konva.Animation文档</a>。
<iframe src="/downloads/code/animations/Rotation.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Rotation Animation Demo</title>
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

    /*
    * leave center point positioned
    * at the default which is the top left
    * corner of the rectangle
    */

    var blueRect = new Konva.Rect({
        x: 50,
        y: 75,
        width: 100,
        height: 50,
        fill: '#00D2FF',
        stroke: 'black',
        strokeWidth: 4
    });

    /*
    * move center point to the center
    * of the rectangle with offset
    */
    var yellowRect = new Konva.Rect({
        x: 220,
        y: 75,
        width: 100,
        height: 50,
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: 50,
            y: 25
        }
    });

    /*
    * move center point outside of the rectangle
    * with offset
    */

    var redRect = new Konva.Rect({
        x: 400,
        y: 75,
        width: 100,
        height: 50,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
        offset: {
            x: -100,
            y: 0
        }
    });

    layer.add(blueRect);
    layer.add(yellowRect);
    layer.add(redRect);
    stage.add(layer);

    // one revolution per 4 seconds
    var angularSpeed = 90;
    var anim = new Konva.Animation(function(frame) {
        var angleDiff = frame.timeDiff * angularSpeed / 1000;
        blueRect.rotate(angleDiff);
        yellowRect.rotate(angleDiff);
        redRect.rotate(angleDiff);
    }, layer);

    anim.start();
</script>

</body>
</html>
```

## 常见问题

### 怎么让图形绕自己的中心转？

取决于图形类型。`Konva.Circle`、`Konva.Star` 这类以中心定位的图形，
默认就绕中心转。

`Konva.Rect`、`Konva.Image`、`Konva.Text` 以左上角定位，默认绕左上角转。
要绕中心，设 `offsetX` 为宽的一半、`offsetY` 为高的一半——注意设了 `offset` 之后 `x`/`y` 的含义也变成中心点了，原有定位要相应调整。

### 角度一直累加会有问题吗？

会。跑上几小时之后角度值可能达到几百万度，浮点精度下降，
旋转会开始出现微小的不均匀。

简单的解决办法是取模：

```js
node.rotation((node.rotation() + delta) % 360);
```

视觉上完全等价，但数值始终在 0 到 360 之间。长期运行的动画值得加上这一行。

### 怎么绕一个外部的点旋转？

两种做法。一是把图形放进一个分组，分组的原点设在旋转中心，
然后旋转分组——这是最清楚的方式，图形自身的属性完全不用改。

二是自己用三角函数算出每一帧的位置：

```js
const angle = frame.time / 1000;
node.x(cx + Math.cos(angle) * r);
node.y(cy + Math.sin(angle) * r);
```

后者更灵活（半径可以同时变化），但公转与自转要分开处理。

## 与其他方案的取舍

**改 `rotation`** 是自转——图形绕自己的原点转，朝向跟着变。

**放进分组转分组** 是公转——图形沿圆周移动，同时朝向也跟着转。
想要「沿圆周移动但始终保持正立」（比如摩天轮的座舱），
要给子节点设一个反向的 `rotation` 抵消掉。

**自己算坐标** 给出最大自由度，公转和自转完全解耦，
半径、角速度都能独立变化。代价是要自己写三角函数，
而且节点的 `rotation` 属性不再反映视觉朝向，调试时容易困惑。

简单的绕点旋转用分组；轨道半径会变或需要精确控制朝向时，自己算。
