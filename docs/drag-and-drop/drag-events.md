---
title: '拖拽事件'
description: '用 on() 监听 Konva 的拖拽事件：dragstart 拖拽开始、dragmove 拖拽过程中持续触发、dragend 拖拽结束。'
sidebar_position: 6
---

拖拽有三个事件，和[变换事件](/docs/select-and-transform/transform-events)一样，都绑在被拖的节点上。

## 用法

要使用`Konva`检测拖放事件，可以使用`on（）`方法
将`dragstart`，`dragmove或``dragend`事件绑定到节点。
`on（）`方法需要事件类型和回调函数。
<iframe src="/downloads/code/drag_and_drop/Drag_Events.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Drag Events Demo</title>
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

    var box = new Konva.Rect({
        x: 20,
        y: 100,
        offset: [50, 25],
        width: 100,
        height: 50,
        fill: '#00D2FF',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
    });

    // write out drag and drop events
    box.on('dragstart', function() {
        writeMessage('dragstart');
    });
    box.on('dragend', function() {
        writeMessage('dragend');
    });

    layer.add(text);
    layer.add(box);

    // add the layer to the stage
    stage.add(layer);
</script>

</body>
</html>
```

## 常见问题

### dragmove 触发得多频繁？

跟随指针移动触发，一次完整拖拽通常有几十到上百次。

判断原则和 `transform` 一样：实时视觉反馈放 `dragmove`，
其他一切放 `dragend`。写入撤销历史、发网络请求、更新前端框架状态，
放进 `dragmove` 会让每一帧都走一遍完整流程，必然掉帧。

### 能在 dragstart 里取消这次拖拽吗？

可以，调 `node.stopDrag()`：

```js
node.on('dragstart', (e) => {
  if (!canDrag(node)) node.stopDrag();
});
```

注意它只是结束拖拽，节点停在当前位置不会复位。
要复位得自己在 `dragstart` 里记下原坐标，`stopDrag()` 之后 `node.position(saved)`。

### dragend 里读到的坐标是最终位置吗？

是。`dragend` 在指针释放后触发，此时 `node.x()`、`node.y()` 已经是最终值，
包括 [`dragBoundFunc`](/docs/drag-and-drop/simple-drag-bounds) 的约束结果。

所以持久化坐标应该在 `dragend` 里做，而不是 `dragmove`——后者拿到的是中间态，而且会写很多次。

## 性能提示

`dragmove` 是拖拽体验的关键路径，里面的任何延迟都会直接表现为拖拽发涩。

**框架状态更新是头号陷阱**。在 React、Vue 里于 `dragmove` 调用 setState，
意味着每帧走一遍 diff 与重渲染。正确分工是：拖拽过程中直接改 Konva 节点，
`dragend` 时一次性同步回状态。

**避免在回调里查找节点**。`stage.find()` 会遍历整棵树，
需要的引用在 `dragstart` 里取好存起来。

**考虑把被拖节点临时提到独立图层**。`dragstart` 时 `node.moveTo(dragLayer)`，
`dragend` 时移回。这样拖拽过程中只有那一层重绘，主内容层完全不动，
是收益最稳定的一项拖拽优化。
