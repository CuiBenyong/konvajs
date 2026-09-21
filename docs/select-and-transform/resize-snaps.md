---
title: '缩放吸附'
description: 'Konva Transformer 的 anchorDragBoundFunc 让缩放锚点吸附到网格或参考线。注意 keepRatio 会在其后执行并覆盖吸附结果。'
sidebar_position: 8
---

`anchorDragBoundFunc` 在锚点被拖动时调用，你可以修正它的位置，从而实现吸附到网格或参考线。

## 用法

回调收到锚点变换前后的**绝对坐标**，返回你希望它落在的位置：

```js
const GRID = 40;

const tr = new Konva.Transformer({
  nodes: [rect],
  keepRatio: false, // 见下方第一个问题
  anchorDragBoundFunc: (oldAbsPos, newAbsPos) => ({
    x: Math.round(newAbsPos.x / GRID) * GRID,
    y: Math.round(newAbsPos.y / GRID) * GRID,
  }),
});
```

坐标已经是绝对的，不需要再做 `getAbsoluteTransform()` 之类的换算。

<iframe src="/downloads/code/select_and_transform/Resize_Snaps.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Resize_Snaps.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Resize Snaps Demo</title>
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
      width: window.innerWidth,
      height: window.innerHeight
    });
    var layer = new Konva.Layer();
    stage.add(layer);

    var GRID = 40;

    // 画出网格，让吸附效果看得见
    for (var x = 0; x < 600; x += GRID) {
      layer.add(new Konva.Line({ points: [x, 0, x, 400], stroke: '#ddd', strokeWidth: 1, listening: false }));
    }
    for (var y = 0; y < 400; y += GRID) {
      layer.add(new Konva.Line({ points: [0, y, 600, y], stroke: '#ddd', strokeWidth: 1, listening: false }));
    }

    var rect = new Konva.Rect({
      x: 80, y: 80, width: 160, height: 120,
      fill: 'rgba(64,120,192,0.6)', stroke: '#4078c0', strokeWidth: 2, draggable: true
    });
    layer.add(rect);

    var tr = new Konva.Transformer({
      nodes: [rect],
      // keepRatio 必须关掉。它在 anchorDragBoundFunc 之后执行，会为了维持宽高比
      // 再次调整锚点位置，把吸附结果覆盖掉——回调返回了 280，最终却落在 284.7。
      keepRatio: false,
      // 回调收到的是锚点的绝对坐标，直接取整到网格即可，无需再做坐标换算
      anchorDragBoundFunc: function (oldAbsPos, newAbsPos) {
        return {
          x: Math.round(newAbsPos.x / GRID) * GRID,
          y: Math.round(newAbsPos.y / GRID) * GRID
        };
      }
    });
    layer.add(tr);

    layer.add(new Konva.Text({
      x: 20, y: 20, fontSize: 14, fill: '#333',
      text: '拖动任一锚点：它只会停在 40 像素网格的交点上。\n（keepRatio 已关闭，否则等比约束会覆盖吸附结果）'
    }));
  </script>

</body>
</html>
```

## 常见问题

### 回调返回了吸附后的坐标，锚点却没落在网格上？

多半是 `keepRatio` 在作怪。它默认为 `true`，而且**在 `anchorDragBoundFunc` 之后执行**——
你的回调把锚点吸附到网格点，随后等比约束为了维持宽高比又把它挪走了。

这个交互实测可见：回调返回 x=280，最终锚点却停在 284.7。把 `keepRatio` 设为 `false`
之后，锚点精确落在 (280, 240)。

如果既要吸附又要锁定比例，得放弃 `keepRatio`，在回调里自己把吸附后的坐标
再按比例修正一次——两个约束只能由一处统一决定。

### 它能顺便限制图形的尺寸吗？

不能。`anchorDragBoundFunc` 只管锚点的落点，不管变换出来的包围盒。

尺寸限制要用 [`boundBoxFunc`](/docs/select-and-transform/resize-limits)。两者可以
同时使用：前者决定锚点吸附到哪儿，后者对结果做最终裁决。
注意执行顺序是先锚点约束、后包围盒约束，所以 `boundBoxFunc` 拒绝时，
吸附的效果也会一并失效。

### 吸附到其他图形的边该怎么写？

思路是把候选的吸附坐标收集成一个数组，在回调里找出距离最近且小于阈值的那个。

关键是**不要在回调里遍历图层**——它每帧都会被调用。正确做法是在
`transformstart` 时把所有候选边的坐标算好存进变量，回调里只做比较。

## 性能提示

`anchorDragBoundFunc` 在拖动过程中每帧触发。取整、比较这类算术没有问题，
但遍历图层、调用 `getClientRect()`、创建数组都会累积成明显的卡顿。

需要参考其他图形位置时，在 `transformstart` 里把候选坐标算好缓存起来。
图形很多时还可以只收集视口内的那些——用户看不见的参考线没有吸附价值。

另外，返回的对象每帧新建一个，这本身开销极小，但不要在里面顺手做深拷贝。
