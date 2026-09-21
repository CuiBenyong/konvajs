---
title: '补间动画完成事件'
description: '用 Konva.Tween 的 onFinish 回调在补间动画结束时执行逻辑，常用于串联多段动画或在动画完成后清理节点。'
sidebar_position: 4
---

`onFinish` 在补间结束时触发。用它串联多段动画时，有几个容易忽略的细节。

## 用法

要使用Konva给tween动画添加回调函数, 我们可以设置动画对象的`onFinish`属性
<iframe src="/downloads/code/tweens/Finish_Event.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Finish Event Demo</title>
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
    function writeMessage(message) {
      text.setText(message);
      layer.draw();
    }

    var width = window.innerWidth;
    var height = window.innerHeight;
    
    var stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height
    });

    var layer = new Konva.Layer();

    var text = new Konva.Text({
        x: 10,
        y: 10,
        fontFamily: 'Calibri',
        fontSize: 24,
        text: '',
        fill: 'black'
    });

    var wheel = new Konva.Star({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        numPoints: 8,
        outerRadius: 70,
        innerRadius: 50,
        fill: 'purple',
        stroke: 'black',
        strokeWidth: 5,
        lineJoin: 'bevel'
    });

    layer.add(wheel);
    layer.add(text);
    stage.add(layer);

    // the tween has to be created after the node has been added to the layer
    var tween = new Konva.Tween({
        node: wheel,
        duration: 4,
        rotation: 360,
        easing: Konva.Easings.BackEaseOut,
        onFinish: function() {
            writeMessage('tween finished!');
        }
    });

    setTimeout(function() {
        tween.play();
    }, 1000);
  </script>

</body>
</html>
```

## 常见问题

### 手动调 finish() 也会触发 onFinish 吗？

会。`finish()` 把动画直接跳到终点，等同于自然播放完毕，回调照常执行。

这有时是想要的（跳过动画但保证后续逻辑执行），有时不是（想中止就别执行后续）。
想中止且不触发回调，用 `destroy()`。

### 串联动画时要注意什么？

每一段结束后销毁自己，否则会不断累积：

```js
const step1 = new Konva.Tween({
  node, duration: 1, x: 100,
  onFinish: () => {
    step1.destroy();
    const step2 = new Konva.Tween({ node, duration: 1, y: 100,
      onFinish: () => step2.destroy() });
    step2.play();
  },
});
```

另外要考虑「动画进行中用户又触发了一次」的情况——不处理的话会有两条链同时在跑。

### 回调里创建新 Tween 会有问题吗？

功能上没问题，这正是串联的实现方式。但要小心**递归**——如果 A 的 `onFinish` 创建 B，B 的 `onFinish` 又创建 A，就是一个无限循环。

做循环动画时这可能正是你要的，但必须有退出条件，
并且在组件销毁时能停下来，否则节点已经不在了动画还在跑。

## 与其他方案的取舍

多段动画的编排有几种做法，复杂度递增。

**`onFinish` 串联**：两三段的简单序列够用，不需要额外依赖。
缺点是嵌套深了很难读，也不好中途插入或调整顺序。

**用 `Konva.Animation` 统一驱动**：自己根据总时间算出当前应该处于哪一段、
各属性是多少。写起来繁琐，但整个序列是一份声明式的数据，容易调整和复用。

**引入时间轴库**（GSAP 的 timeline 之类）：编排能力最强，支持并行、
相对定位、标签跳转。代价是多一个依赖，而且要自己把数值写回 Konva 节点。

三段以内用 `onFinish`；更复杂且序列固定，考虑自己驱动；
如果编排本身就是产品的核心功能（动画编辑器），才值得上时间轴库。
