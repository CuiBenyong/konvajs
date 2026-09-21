---
title: '旋转吸附'
description: '用 Konva Transformer 的 rotationSnaps 让旋转吸附到 0、90、180、270 等特定角度，吸附范围由 rotationSnapTolerance 控制。'
sidebar_position: 9
---

徒手拖旋转把手很难停在正好 90 度。`rotationSnaps` 让角度在接近预设值时自动吸上去。

## 用法

给出一组希望吸附到的角度即可：

```js
const tr = new Konva.Transformer({
  nodes: [rect],
  rotationSnaps: [0, 90, 180, 270],
  rotationSnapTolerance: 12, // 默认 5
});
```

`rotationSnapTolerance` 是进入吸附的角度容差：当前角度与某个吸附点的差在这个范围内时，
就会被吸过去。

<iframe src="/downloads/code/select_and_transform/Rotation_Snaps.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Rotation_Snaps.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Rotation Snaps Demo</title>
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

    var rect = new Konva.Rect({
      x: 160, y: 110, width: 140, height: 80, offsetX: 70, offsetY: 40,
      fill: '#5aa469', stroke: 'black', strokeWidth: 2, draggable: true
    });
    layer.add(rect);

    var tr = new Konva.Transformer({
      nodes: [rect],
      // 绝对角度，不是相对增量
      rotationSnaps: [0, 90, 180, 270],
      // 进入吸附的容差，默认 5 度；感觉「不吸」时先调这个
      rotationSnapTolerance: 12
    });
    layer.add(tr);

    var label = new Konva.Text({ x: 20, y: 20, fontSize: 14, fill: '#333', text: '' });
    layer.add(label);

    function showAngle() {
      label.text('当前角度：' + Math.round(rect.rotation()) +
        '°\n拖动顶部的旋转把手，靠近 0/90/180/270 时会吸附。');
    }
    showAngle();
    rect.on('transform', showAngle);
  </script>

</body>
</html>
```

## 常见问题

### 设置了 rotationSnaps 但感觉不到吸附？

先调大 `rotationSnapTolerance`。它的默认值只有 5 度，意味着必须转到相当接近
目标角度才会触发，手感上很容易察觉不到。

实际项目里 10 到 15 度是比较舒服的范围。太大则会出现「想停在 45 度却总被吸到 90」
的困扰，需要按吸附点的密度来权衡——吸附点越密，容差就要越小。

### 数组里的角度是相对当前角度的吗？

不是，是**绝对角度**。`[0, 90, 180, 270]` 指的就是这四个方向，
与图形当前转到了哪里无关。

想每 15 度吸附一次，需要把 0 到 345 之间所有 15 的倍数都列出来。
用 `Array.from({ length: 24 }, (_, i) => i * 15)` 生成即可。

### 用代码设置的角度也会被吸附吗？

不会。吸附只作用于拖拽旋转把手这个交互过程，`node.rotation(37)` 这样直接赋值
不受影响，角度就是 37。

这是合理的设计：吸附是为了辅助手工操作，程序设定的值应当被精确执行。
如果你希望程序设值也走吸附，需要自己做一次取整。

## 与其他方案的取舍

另一种常见做法是在 `transform` 事件里把角度四舍五入到最近的倍数。这个做法有个
明显缺陷：它**每一帧都在强行改写角度**，用户会感到旋转是一格一格跳的，
中间状态完全无法停留。

`rotationSnaps` 只在接近吸附点时才介入，其余区间可以自由旋转到任意角度。
这两种手感差别很大，做设计工具时尤其明显——用户既需要精确的 90 度，
也需要能停在 37 度。

如果你确实想要「只能是 15 度的倍数」的强约束，那么每帧取整才是对的，
但那属于另一种产品语义，不要和吸附混为一谈。
