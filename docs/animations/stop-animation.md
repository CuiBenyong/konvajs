---
title: '停止动画'
description: '用 Konva.Animation 的 stop() 停止动画、start() 重新启动，适合按钮控制或页面不可见时暂停以节省性能。'
sidebar_position: 6
---

`stop()` 暂停动画循环。它不复位状态，也不会自动在节点销毁时调用。

## 用法

要使用Konva停止动画，我们可以使用`stop()`方法。要重新启动动画，我们可以再次调用`start()`。

说明：单击“开始”开始动画，单击“停止”停止动画。

有关Konva.Animation的属性和方法的完整列表，请查看<a href="https://konvajs.org/api/Konva.Animation.html" target="_blank">Konva.Animation文档</a>。
<iframe src="/downloads/code/animations/Stop_Animation.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Stop Animation Demo</title>
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
            display: block;
            margin-top: 5px;
        }
    </style>
</head>
<body>
<div id="container"></div>
<div id="buttons">
    <input type="button" id="start" value="Start">
    <input type="button" id="stop" value="Stop">
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
    var hexagon = new Konva.RegularPolygon({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        sides: 6,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
    });

    layer.add(hexagon);
    stage.add(layer);

    var amplitude = 150;
    // in ms
    var period = 2000;
    var centerX = stage.getWidth() / 2;

    var anim = new Konva.Animation(function(frame) {
        hexagon.setX(amplitude * Math.sin(frame.time * 2 * Math.PI / period) + centerX);
    }, layer);

    document.getElementById('start').addEventListener('click', function() {
        anim.start();
    }, false);

    document.getElementById('stop').addEventListener('click', function() {
        anim.stop();
    }, false);
</script>

</body>
</html>
```

## 常见问题

### stop 之后 start，会从头开始吗？

不会。节点保持在停止时的状态，`start()` 从那里继续。

但要注意 `frame.time` 会**继续累积**——它记的是动画对象创建以来的总时间，
停止期间也在走。如果你的动画逻辑依赖 `frame.time` 算位置，
停一段时间再启动会出现跳跃。

需要「从暂停处无缝继续」时，自己记录累计时间，用 `timeDiff` 累加，
而不是直接用 `frame.time`。

### 节点销毁了，动画还在跑吗？

还在跑。`Konva.Animation` 与节点没有绑定关系，节点 `destroy()` 之后
动画回调照常每帧执行，里面引用的已销毁节点会导致报错或静默失效。

而且回调的闭包持有那个节点，节点因此无法被回收——这是
[内存泄漏](/docs/performance/avoid-memory-leaks)的常见来源。

销毁节点前务必 `anim.stop()`。

### 页面切到后台要手动停吗？

建议停。浏览器通常会把后台标签页的帧率降到每秒一次左右，
但不会完全停止，动画仍在消耗 CPU 和电量。

```js
document.addEventListener('visibilitychange', () => {
  document.hidden ? anim.stop() : anim.start();
});
```

移动端上这个优化尤其值得做——用户切到别的 App 时，你的动画不该还在跑。

## 性能提示

未停止的动画是「看不见的持续开销」，排查性能问题时容易被忽略。

**统一管理动画生命周期**。把动画对象存起来，在组件卸载、页面切换、
节点销毁这些时机统一 `stop()`。分散在各处创建、忘记停止，
是长时间运行的应用逐渐变卡的典型原因。

**用一个动画驱动多个节点**。与其给每个节点建一个 `Animation`，
不如在一个回调里遍历处理。前者每帧有 N 次回调调用和 N 次重绘请求，
后者只有一次。

**空闲时主动停止**。等待用户操作的间隙、动画对象已经达到稳定状态时，
停掉比让它空转更好。需要恢复时 `start()` 的代价很低。
