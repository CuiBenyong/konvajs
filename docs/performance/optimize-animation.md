---
title: '动画优化'
description: '优化 Konva 动画：当某一帧没有任何节点状态变化时在动画函数里 return false，Konva 会跳过该帧的图层更新。'
sidebar_position: 4
---

动画函数每帧都会执行。让它在无事可做时早早返回，可以省掉整层的重绘。

## 用法

如果你动画中的某些帧没有发生更新（没有节点的状态发生更改），则可以在动画函数直接`return false`。

这样的话，Konva将不会更新图层。
<iframe src="/downloads/code/performance/Optimize_Animation.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Optimize Animation Demo</title>
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

    // we have animation that do nothing in some cases
    var anim = new Konva.Animation(function(frame) {
        if ((frame.time % (period * 2)) < period) {
            // regular update
            hexagon.x(amplitude * Math.cos(frame.time * 2 * Math.PI / period) + centerX);
        } else {
            // this is "pause" phase
            // we don't need update layer in this case
            // so return false and Konva will skip layer draw
            return false;
        }
    }, layer);

    anim.start();
</script>

</body>
</html>
```

## 常见问题

### return false 到底省了什么？

省的是**图层重绘**，不是回调本身。

动画函数无论如何每帧都会被调用，`return false` 告诉 Konva「这一帧我什么都没改，
不用重画」。对一个复杂图层来说，省下的这次重绘可能是整帧开销的大头。

所以回调本身的逻辑也要轻——它是每帧必跑的，在里面做重活，`return false` 救不了。

### 怎么判断这一帧没有变化？

需要你自己维护状态。常见做法是把上一帧的关键值记下来，本帧算完之后比较：

```js
let lastX = null;
const anim = new Konva.Animation((frame) => {
  const x = compute(frame.time);
  if (x === lastX) return false;
  lastX = x;
  node.x(x);
}, layer);
```

如果动画本来就是持续变化的（匀速旋转、粒子运动），这个优化没有意义——
每帧都在变，本来就该每帧重绘。

### 动画不传图层参数会怎样？

Konva 不知道该重绘哪一层，于是**什么都不重绘**。你改了节点属性，画面却不动。

```js
new Konva.Animation(fn, layer);  // 传入要重绘的图层
```

可以传图层数组，动画涉及多层时都列上。但反过来，**不要把不变的图层也传进去**——
那等于每帧强制重绘它们，分层的意义就没了。

## 性能提示

动画回调是全应用里执行频率最高的代码，任何浪费都会被乘以 60。

**把常量提到外面**。三角函数表、渐变对象、配置数组，都不该在回调里创建。

**不要在回调里创建对象**。每帧新建的对象会给垃圾回收器持续施压，
表现为周期性的卡顿。复用同一个对象，改它的字段。

**用 `frame.timeDiff` 而非固定增量**。固定增量意味着动画速度随帧率变化，
在低端设备上会变慢。用时间差算位移，各种帧率下速度一致。

**页面不可见时停掉**。监听 `visibilitychange`，切到后台时 `anim.stop()`。
浏览器通常会降低后台标签页的帧率，但不会完全停止，主动停掉更省电。
