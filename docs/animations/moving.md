---
title: '移动'
description: '用 Konva.Animation 让图形沿轨迹移动：在每个动画帧中修改节点的 x、y 坐标，实现平滑的位移动画。'
sidebar_position: 2
---

位移动画的关键不是怎么改坐标，而是怎么让速度与帧率无关。

## 用法

要使用Konva为形状设置移动动画，我们可以使用`Konva.Animation`创建一个新的动画, 并在每个动画帧中修改形状的位置。

有关Konva.Animation的属性和方法的完整列表，请查看<a href="https://konvajs.org/api/Konva.Animation.html" target="_blank" >Konva.Animation文档</a>。
<iframe src="/downloads/code/animations/Moving.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Animate Position Demo</title>
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

    var hexagon = new Konva.RegularPolygon({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        sides: 6,
        radius: 20,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
    });

    layer.add(hexagon);
    stage.add(layer);

    var amplitude = 100;
    var period = 2000;
    // in ms
    var centerX = stage.getWidth() / 2;

    var anim = new Konva.Animation(function(frame) {
        hexagon.setX(amplitude * Math.sin(frame.time * 2 * Math.PI / period) + centerX);
    }, layer);

    anim.start();
</script>

</body>
</html>
```

## 常见问题

### 为什么动画在不同设备上快慢不同？

因为用了固定增量。`node.x(node.x() + 2)` 意味着「每帧移动 2 像素」，
而帧率是设备决定的——高刷屏 120 帧，低端机可能只有 30 帧，速度差四倍。

正确写法是按时间算：

```js
const SPEED = 120; // 每秒 120 像素
new Konva.Animation((frame) => {
  node.x(node.x() + SPEED * frame.timeDiff / 1000);
}, layer);
```

### 长时间运行后位置有偏差？

累加浮点数会积累误差。每帧加一个小数，跑上几分钟之后，
实际位置与理论位置会有可见的偏离。

对周期性运动（来回摆动、绕圈），更好的做法是**从总时间直接算出位置**，
而不是累加：

```js
new Konva.Animation((frame) => {
  node.x(centerX + Math.sin(frame.time / 1000) * 100);
}, layer);
```

这样每一帧的值都是独立算出来的，不会累积误差，
而且动画随时暂停恢复都能对得上。

### 边界反弹怎么判断？

常见的写法是「超出边界就反转速度」，但要注意先把位置**夹回边界内**，
否则物体可能在边界外抖动：

```js
if (x > maxX) { x = maxX; dir = -1; }
```

只反转方向而不修正位置，下一帧算出来可能仍在界外，
于是又反转一次，表现为在边界处高频颤动。

## 与其他方案的取舍

有明确起止点的位移，用 [`Konva.Tween`](/docs/tweens/linear-easing) 更省事——缓动、暂停、完成回调都是现成的，不用自己管时间。

`Animation` 的适用场景是**没有终点**或**终点在运行中变化**的运动：
持续漂浮的粒子、跟随鼠标的物体、受物理规则驱动的位置。

还有一种情况必须用 `Animation`：需要同时驱动大量节点。
一百个节点各建一个 Tween，等于每帧一百次独立的属性写入；
用一个 Animation 在单个回调里算完所有节点，开销小得多。
