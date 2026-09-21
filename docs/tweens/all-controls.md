---
title: '控制器'
description: 'Konva.Tween 的播放控制：play() 播放、pause() 暂停、reverse() 反向、reset() 重置、finish() 直接结束、seek() 跳到指定时间点。'
sidebar_position: 5
---

Tween 提供完整的播放控制。几个方法的语义有细微差别，用错会得到意外的结果。

## 用法

要使用Konva播放，暂停，反转，重置，完成和查找tween动画，我们可以使用`play()`, `pause()`, `reverse()`, `reset()`, `finish()` 和 `seek()`方法。

下面的教程演示了每一个操作。
<iframe src="/downloads/code/tweens/All_Controls.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva All Controls Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #buttons {
        position: absolute;
        top: 5px;
        left: 10px;
    }
    #buttons > input {
        padding: 10px;
        display: inline-block;
        margin-right: 5px;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="buttons">
      <input type="button" id="play" value="Play">
      <input type="button" id="pause" value="Pause">
      <input type="button" id="reverse" value="Reverse">
      <input type="button" id="reset" value="Reset">
      <input type="button" id="seek" value="Seek 3">
      <input type="button" id="finish" value="Finish">

  </div>
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
        y: 130,
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
        duration: 6,
        x: 220,
        y: 75,
        rotation: Math.PI * 10,
        opacity: 1,
        strokeWidth: 6,
        scaleX: 1.3,
        scaleY: 1.3,
        easing: Konva.Easings.Linear,
        fillR: 0,
        fillG: 0,
        fillB: 255
    });

    // pause tween
    document.getElementById('pause').addEventListener('click', function() {
        tween.pause();
    }, false);

    // reverse tween
    document.getElementById('reverse').addEventListener('click', function() {
        tween.reverse();
    }, false);

    // play tween forward
    document.getElementById('play').addEventListener('click', function() {
        tween.play();
    }, false);

    // reset tween
    document.getElementById('reset').addEventListener('click', function() {
        tween.reset();
    }, false);

    // force tween to finish
    document.getElementById('finish').addEventListener('click', function() {
        tween.finish();
    }, false);

    // seek to 3 seconds
    document.getElementById('seek').addEventListener('click', function() {
        tween.seek(3);
    }, false);
  </script>

</body>
</html>
```

## 常见问题

### pause 之后 play，是从头还是从暂停处继续？

从暂停处继续。`pause()` 只是停住计时，内部进度保留。

想从头开始要先 `reset()`——它把节点属性复位到起始值并把进度归零。
`finish()` 则相反，直接跳到终点状态并触发 `onFinish`。

### reverse 和新建一个反向 Tween 有区别吗？

有。`reverse()` 是沿着**同一条缓动曲线倒着走**，所以 `EaseIn` 反向播放时
呈现的是「先快后慢」，与 `EaseOut` 的曲线并不相同。

新建一个从当前值到起始值的 Tween，则是重新应用一遍缓动，
`EaseIn` 仍然是先慢后快。

想要「原路返回」的物理感用 `reverse()`；想要每段都有一致的缓动手感，
新建更合适。

### 在 onUpdate 里调 pause 或 destroy 安全吗？

现在安全了。Konva 10.4.0 之前，在 `onUpdate` 回调里调用 `pause()` 或 `destroy()`
会让动画重新启动，`destroy()` 之后再调 `finish()` / `reset()` 还会抛错。

该版本修复了这些问题。如果项目还在旧版本上，需要把这类操作延迟到
回调之外执行，例如用 `setTimeout(..., 0)`。

## 性能提示

每个运行中的 Tween 都会被加入全局的动画循环，每帧计算一次进度并写属性。

**用完即销毁**。`onFinish` 里调 `destroy()`，否则已完成的 Tween 仍然挂在
内部列表里。少量无所谓，但「每次悬停创建一个」这类模式下会快速累积。

**避免同时运行大量 Tween**。一百个节点各有一个 Tween，等于每帧一百次
属性写入加一次图层重绘。这种场景更适合用一个 `Konva.Animation` 统一驱动，
在一个回调里算完所有节点。

**Tween 会触发图层重绘**。多个 Tween 作用在不同图层上时，每层都要重绘；
尽量让同时运行的动画集中在同一图层。
