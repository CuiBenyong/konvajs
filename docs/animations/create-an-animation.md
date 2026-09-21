---
title: '创建自定义动画'
description: '用 Konva.Animation 创建自定义逐帧动画：动画函数可拿到 frame 的 time、timeDiff 与 frameRate，据此计算每一帧的状态。'
sidebar_position: 1
---

`Konva.Animation` 每帧调用你的回调。它不管动什么，只负责按帧率驱动并重绘指定图层。

## 用法

要使用Konva创建自定义动画，我们可以使用`Konva.Animation`构造函数, 这个函数接受两个参数，包括一个必需的动画函数和
一个可选的图层或图层数组，通过参数指定的图层将随每个动画帧更新。 动画函数中传递了一个`frame`对象，它拥有一个`time`属性，表示
动画已经运行的毫秒数， 一个`timeDiff`属性, 表示自最后一帧以来经过的毫秒数，以及一个`frameRate`属性，表示每秒显示的帧数。

动画函数中不需要重绘舞台或图层，因为Konva的动画引擎将智能地为我们处理。
动画函数中只需要包含在动画中要更新的节点属性，例如`position`, `rotation`, `scale`, `width`, `height`, `radius`, `colors`等。
一旦动画被创建，我们可以随时使用`start()`方法启动它。

有关Konva.Animation的属性和方法的完整列表，请查看<a href="https://konvajs.org/api/Konva.Animation.html" target="_blank">Konva.Animation文档。</a>


##HTML5 Canvas Konva Animation 模板

```js
<script>
  var anim = new Konva.Animation(function(frame) {
    var time = frame.time,
        timeDiff = frame.timeDiff,
        frameRate = frame.frameRate;

    // update stuff
  }, layer);

  anim.start();
</script>
```


## 常见问题

### 不传图层参数会怎样？

Konva 不知道该重绘哪一层，于是**什么都不重绘**。你在回调里改了属性，
画面却一动不动。

```js
new Konva.Animation(fn, layer);  // 第二个参数不能省
```

可以传数组，动画涉及多层时都列上。但反过来也要注意：
**不要把不变的图层传进去**，那等于每帧强制重绘它们，
[分层](/docs/performance/layer-management)的意义就没了。

### frame 对象里有什么？

三个字段：`time` 是动画启动以来的毫秒数，`timeDiff` 是距上一帧的毫秒数，
`frameRate` 是当前帧率。

**做位移一定要用 `timeDiff`**，不要用固定增量。固定增量意味着
「每帧移动 2 像素」，在 60 帧的设备上是每秒 120 像素，
在 30 帧的设备上只有 60——同一个动画在不同机器上快慢不同。

用 `timeDiff` 换算成「每秒移动多少」，各种帧率下速度一致。

### 怎么让动画只在需要时重绘？

回调里 `return false`，Konva 会跳过这一帧的图层重绘。

适合「大部分时间没有变化」的动画——比如等待某个条件满足才开始动。
注意回调本身仍然每帧都会执行，所以里面的逻辑也要轻。

详见[动画优化](/docs/performance/optimize-animation)。

## 性能提示

动画回调是全应用执行最频繁的代码，任何浪费都会乘以 60。

**不要在回调里创建对象**。每帧 `new` 一个对象或数组，会给垃圾回收持续施压，
表现为周期性的微卡顿。复用同一个对象，改它的字段。

**把常量提到外面**。配置、查找表、三角函数的预计算结果，都不该每帧重算。

**避免在回调里查找节点**。`stage.find()` 遍历整棵树，需要的引用在创建动画时取好。

**页面不可见时停掉**。监听 `visibilitychange`，切到后台时 `anim.stop()`。
浏览器会降低后台标签页的帧率但不会完全停止，主动停掉更省电，
移动端尤其明显。
