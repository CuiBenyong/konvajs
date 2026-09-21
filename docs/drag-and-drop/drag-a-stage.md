---
title: '拖拽舞台'
description: '拖拽整个 Konva 舞台：给 Stage 设置 draggable 后，拖动画布任意位置都能平移整个舞台，常用于实现画布漫游。'
sidebar_position: 5
---

拖动舞台等于平移整个视图。它和拖动节点是两种不同的意图，需要区分开。

## 用法

要使用`Konva`拖放舞台，我们在实例化舞台时可以设置`draggable`属性
，设置对象的值为`true`，或者我们可以使用`draggable（）`方法。 

与其他节点（例如形状，组和图层）的拖放不同，
我们可以通过拖动舞台的任何部分来拖动整个舞台。
<iframe src="/downloads/code/drag_and_drop/Drag_a_Stage.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Drag and Drop the Stage Demo</title>
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
        height: height,
        draggable: true
    });

    var layer = new Konva.Layer();

    var circle = new Konva.Circle({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(circle);

    // add the layer to the stage
    stage.add(layer);
</script>

</body>
</html>
```

## 常见问题

### 舞台可拖时，节点还能单独拖吗？

能。指针按在可拖节点上时拖节点，按在空白处时拖舞台。两者互不干扰。

但这个默认行为往往不是用户想要的——在画布上随便一拖就平移视图，
容易误操作。更常见的做法是加一个触发条件。

### 怎么做成「按住空格才能拖画布」？

监听键盘状态，动态切换 `stage.draggable()`：

```js
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { stage.draggable(true); container.style.cursor = 'grab'; }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') { stage.draggable(false); container.style.cursor = 'default'; }
});
```

记得处理窗口失焦——用户按着空格切走再回来，`keyup` 收不到，
状态会卡住。监听 `blur` 时强制复位。

中键拖拽是另一种常见方案，判断 `e.evt.button === 1` 即可，不受焦点影响。

### 拖舞台之后节点的坐标变了吗？

没变。舞台平移改的是舞台自己的 `x`/`y`，所有节点的坐标都是相对舞台的，
一个都没动。

所以拖完之后不需要更新任何业务数据。要把指针位置换算成内容坐标，
用 `stage.getPointerPosition()`——它已经把舞台的位移和缩放算进去了。

## 性能提示

拖动舞台会让**所有图层**都重绘，因为整个视图都在动。这是它比拖动单个节点贵得多的原因。

内容复杂时会明显掉帧。几个缓解办法：

**把静态内容缓存**。背景网格、底图这类不变的内容，整层 `cache()` 之后
平移就只是贴一张图，比重新绘制所有图形快得多。

**减少图层数量**。每个图层都要单独重绘一遍，平移场景下分层不但没有收益，
还增加了合成成本。如果应用以平移为主，图层应该尽量合并。

**考虑用 CSS transform 代替**。把整个 `<canvas>` 容器用 CSS 平移，
浏览器走合成器，不触发任何重绘。代价是平移期间不能有新内容进入视口，
松手后要校正一次真实坐标。适合内容极其复杂、平移必须丝滑的场景。
