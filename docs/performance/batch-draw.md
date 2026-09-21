---
title: '批量绘制'
description: '用 Konva 的 batchDraw() 合并高频重绘：mousemove 每秒可触发数百次，直接调 draw() 会超出浏览器重绘能力导致动画跳帧。'
sidebar_position: 3
---

`batchDraw()` 把多次重绘请求合并到下一帧。在 Konva 10 里，多数场景已经不需要手动调用它。

## 用法

在某些情况下，我们可能希望既不造成过多的重绘, 并且尽可能快地更新Konva形状.例如，如果我们要在mousemove事件中更新舞台上某个元素的状态, 我们并不愿意使用`draw()`方法来重绘图层, 因为mousemove事件可以在一秒内被触发成百上千次, 从而导致动画的帧率达到每秒一百多帧, 这样常常会使动画出现'跳跃', 毕竟浏览器处理重绘的能力是有限的.

对于这种情况，最好使用`batchDraw()`方法, 它会自动将重绘操作交给Konva动画引擎来处理。无论你调用`batchDraw()`多少次，Konva引擎都会根据浏览器每个时间点每秒所能处理的最大帧数自动限制图层每秒重绘的次数.

说明：将鼠标移到舞台上来快速旋转矩形
<iframe src="/downloads/code/performance/BatchDraw.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Batch Draw Demo</title>
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
    var stage = new Konva.Stage({
      container: 'container',
      width: 300,
      height: 250
    });
    
    var layer = new Konva.Layer();
    
    var rect = new Konva.Rect({
      x: 110,
      y: 100,
      width: 200,
      height: 20,
      offset: {
        x : 100,
        y : 10
      },
      fill: 'green',
      stroke: 'black',
      strokeWidth: 4
    });
    
    // add the shape to the layer
    layer.add(rect);
    
    // add the layer to the stage
    stage.add(layer);
    
    stage.on('contentMousemove', function() {
      rect.rotate(5);
      layer.batchDraw();
    });
  </script>

</body>
</html>

```

## 常见问题

### Konva 10 还需要手动调 batchDraw 吗？

通常不需要。`Konva.autoDrawEnabled` 默认为 `true`，改动节点属性后 Konva 会
自动安排下一帧重绘，并且本身就做了合并。

手动调用仍然有效，只是多数情况下是冗余的。真正需要它的场景是：
你关掉了自动重绘（为了完全掌控绘制时机），或者在一个循环里改了大量节点后
想显式触发一次。

### batchDraw 和 draw 有什么区别？

`draw()` 是**立即同步**重绘，调用时就画。在一个循环里调一百次，就真的画一百次。

`batchDraw()` 是**请求在下一帧重绘**，无论调多少次，下一帧只画一次。

所以高频事件里（`mousemove`、`dragmove`、动画回调）永远不要用 `draw()`。
鼠标移动一秒能触发上百次，那意味着一秒画上百帧，远超浏览器的刷新能力，
表现出来就是掉帧和卡顿。

### 关掉 autoDrawEnabled 有什么好处？

拿回绘制时机的控制权。在需要精确协调多个图层绘制顺序、
或者要把绘制与外部的动画循环对齐时有用。

代价是所有重绘都要自己负责，漏掉一处就是「改了属性但画面没变」，
而且这类 bug 很难定位——代码逻辑完全正确，只是少了一次 `draw()`。

除非确有需要，保持默认的自动重绘。

## 与其他方案的取舍

`draw()` 与 `batchDraw()` 的选择，本质是「现在就要结果」还是「下一帧再说」。

需要立刻拿到绘制结果的场景确实存在——最典型的是 `toDataURL()` 之前，
要确保画面是最新的。那种情况下用 `draw()`。

其余所有场景，尤其是任何由用户输入驱动的更新，都应该用 `batchDraw()`，
或者干脆依赖自动重绘。

还有一种做法是自己用 `requestAnimationFrame` 做节流，把一帧内的多次更新
收敛成一次。这与 `batchDraw` 做的是同一件事，除非你还要在同一帧里协调
其他非 Konva 的更新，否则没有必要重复实现。
