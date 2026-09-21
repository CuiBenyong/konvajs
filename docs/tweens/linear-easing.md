---
title: '线性缓动'
description: '用 Konva.Tween 对节点的数值属性做过渡动画：x、y、rotation、width、height、opacity 等都可以，调用 play() 启动。'
sidebar_position: 1
---

`Konva.Tween` 在两个属性值之间做插值。它只能处理数值，这一条决定了它的适用边界。

## 用法

要使用Konva在不同的属性值之间做动画，我们可以先实例化一个`Konva.Tween`对象. 然后调用`play()`方法启动它。无论是`Shape`,
`Group`, `Layer`, 还是`Stage`, 它们的任何数值型的属性都可以通过这种方式添加过渡动画, 比如`x`, `y`, `rotation`,
`width`, `height`, `radius`, `strokeWidth`, `opacity`, `scaleX`, `offsetX`等

有关Konva.Tween的属性和方法的完整列表，请查看
<a href="https://konvajs.org/api/Konva.Tween.html" target="_blank">Konva.Tween 文档</a>。
<iframe src="/downloads/code/tweens/Linear_Easing.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Linear Easing Demo</title>
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

    var rect = new Konva.Rect({
        x: 50,
        y: 20,
        width: 100,
        height: 50,
        fill: 'green',
        stroke: 'black',
        strokeWidth: 2,
        opacity: 0.2
    });

    layer.add(rect);
    stage.add(layer);

    // the tween has to be created after the node has been added to the layer
    var tween = new Konva.Tween({
        node: rect,
        duration: 1,
        x: 140,
        y: 90,
        fill : 'red',
        rotation: Math.PI * 2,
        opacity: 1,
        strokeWidth: 6,
        scaleX: 1.5
    });

    // start tween after 2 seconds
    setTimeout(function() {
        tween.play();
    }, 2000);
  </script>

</body>
</html>
```

## 常见问题

### 哪些属性可以补间？

**数值型**的都可以：`x`、`y`、`rotation`、`width`、`height`、`opacity`、
`scaleX`、`strokeWidth`、`radius` 等等。

不能补间的是非数值属性——`fill` 的颜色字符串虽然 Konva 做了特殊支持，
但像 `fillLinearGradientColorStops` 这种「数字与颜色交替的数组」就不行，
只能用 [`Konva.Animation`](/docs/animations/create-an-animation) 逐帧自己算，
见[复杂补间动画](/docs/tweens/complex-tweening)。

### 两个 Tween 同时改一个属性会怎样？

会打架。两者各自按自己的进度写同一个属性，结果取决于谁后执行，
视觉上是抖动或者卡在中间。

正确做法是新建之前先销毁旧的：

```js
if (currentTween) currentTween.destroy();
currentTween = new Konva.Tween({...});
currentTween.play();
```

这在「鼠标反复进出触发动画」的场景里几乎必然发生，要提前处理。

### node.to() 和 new Konva.Tween 有什么区别？

`node.to()` 是创建一次性补间的快捷写法，参数直接写成对象：

```js
node.to({ x: 100, duration: 1, onFinish: () => {} });
```

Konva 10.4.0 起它会**返回创建的 tween 对象**，之前是没有返回值的。
这意味着现在可以拿到句柄来暂停或销毁，旧版本则只能用完即弃。

同版本还修了一个问题：`node.to()` 此前会修改传入的参数对象，
复用同一个配置对象会出错。

## 与其他方案的取舍

`Tween` 与 `Animation` 的分工很清楚，选错会让代码绕远路。

**`Tween`** 适合「从 A 到 B，用时 N 秒」这种有明确起止的过渡。
它自带缓动、暂停、反向、完成回调，不用自己管时间。

**`Animation`** 适合持续的、没有终点的运动——粒子、时钟、物理模拟，
或者需要逐帧计算非数值属性的场景。代价是缓动、进度都要自己实现。

判断依据：能用「起点、终点、时长」描述清楚的，用 Tween；
需要每帧根据当前状态计算下一帧的，用 Animation。
