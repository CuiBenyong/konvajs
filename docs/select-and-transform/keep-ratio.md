---
title: '保持宽高比'
description: 'Konva Transformer 的 keepRatio 默认为 true，拖动角锚点时保持宽高比；按住 SHIFT 可临时反转该行为。'
sidebar_position: 3
---

缩放图片、图标这类内容时通常不希望变形。Transformer 默认就帮你锁住了宽高比。

## 用法

`keepRatio` 的默认值就是 `true`，不需要手动开启。想允许自由变形才需要显式关掉：

```js
const tr = new Konva.Transformer({
  nodes: [rect],
  keepRatio: false,
});
```

无论设成哪个值，按住 SHIFT 拖动都会临时反转当前行为。

<iframe src="/downloads/code/select_and_transform/Keep_Ratio.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Keep_Ratio.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Keep Ratio Demo</title>
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

    var locked = new Konva.Rect({
      x: 60, y: 80, width: 120, height: 90,
      fill: '#4078c0', stroke: 'black', strokeWidth: 2, draggable: true
    });
    layer.add(locked);
    // keepRatio 默认就是 true，这里显式写出来是为了和右边对照
    layer.add(new Konva.Transformer({ nodes: [locked], keepRatio: true }));

    var free = new Konva.Rect({
      x: 280, y: 80, width: 120, height: 90,
      fill: '#c04040', stroke: 'black', strokeWidth: 2, draggable: true
    });
    layer.add(free);
    layer.add(new Konva.Transformer({ nodes: [free], keepRatio: false }));

    layer.add(new Konva.Text({
      x: 20, y: 20, fontSize: 14, fill: '#333',
      text: '左：keepRatio 为 true，拖角保持宽高比（按住 SHIFT 临时解除）\n右：keepRatio 为 false，拖角可自由变形'
    }));
  </script>

</body>
</html>
```

## 常见问题

### 我没设置 keepRatio，为什么拖角不能自由变形？

因为它的默认值就是 `true`。很多人以为这是个需要主动开启的功能，结果反过来——
想要自由变形的场景才需要显式设 `false`。

临时想自由拉一下，按住 SHIFT 即可，不用改代码。

### keepRatio 为什么对边锚点不起作用？

边锚点（`middle-left`、`top-center` 等）本来就是单方向拉伸，「保持比例」在这里
没有意义，所以 `keepRatio` 只作用于四个角锚点。

如果你希望完全禁止非等比缩放，光设 `keepRatio` 不够，还要用 `enabledAnchors`
把边锚点去掉：

```js
enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
```

### 等比缩放时以哪个方向为准？

以拖动距离较大的那个方向为准，另一个方向按原比例跟随。

这意味着斜向拖动时的实际缩放量可能小于鼠标位移——向右下拖动时，
宽度增加的幅度会被高度方向的约束拉回来。这是等比缩放的正常表现，不是掉帧。

## 与其他方案的取舍

也可以关掉 `keepRatio`，改在 `boundBoxFunc` 里自己按比例修正 `newBox`。
看起来只是几行算术，但要额外处理一件事：SHIFT 键临时反转。

用户按住 SHIFT 时期望的是「切换到另一种模式」，自己实现就要监听键盘状态并在
`boundBoxFunc` 里分支。`keepRatio` 已经把这套交互做好了，自己重做纯属重复劳动。

真正需要自定义比例逻辑的场景很少——例如「宽度必须是高度的整数倍」这类约束，
那时才值得走 `boundBoxFunc`。
