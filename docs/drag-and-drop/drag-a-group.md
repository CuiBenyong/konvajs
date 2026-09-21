---
title: '拖拽组'
description: '拖拽 Konva 分组：实例化 Konva.Group 时设置 draggable 为 true，或调用 draggable() 方法，组内所有图形会一起移动。'
sidebar_position: 3
---

拖动分组时，子节点跟着一起走——它们的相对位置由分组的坐标系维持。

## 用法

要使用`Konva`拖放组，我们在实例化组时可以设置`draggable`属性
，设置对象的值为`true`，或者我们可以使用`draggable（）`方法。
<iframe src="/downloads/code/drag_and_drop/Drag_a_Group.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Drag and Drop a Group Demo</title>
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
        height: height
    });

    var shapesLayer = new Konva.Layer();
    var group = new Konva.Group({
        draggable: true
    });
    var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

    for(var i = 0; i < 6; i++) {
        var box = new Konva.Rect({
            x: i * 30 + 10,
            y: i * 18 + 40,
            width: 100,
            height: 50,
            name: colors[i],
            fill: colors[i],
            stroke: 'black',
            strokeWidth: 4
        });
        group.add(box);
    }

    group.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
    });
    group.on('mouseout', function() {
        document.body.style.cursor = 'default';
    });

    shapesLayer.add(group);
    stage.add(shapesLayer);
</script>

</body>
</html>
```

## 常见问题

### 拖分组时子节点的坐标会变吗？

不会。子节点的 `x`/`y` 是相对分组的，分组移动只改分组自己的坐标。

这是分组最有价值的特性：一次移动，内部结构原封不动。
想知道子节点在舞台上的实际位置，用 `child.getAbsolutePosition()`。

### 分组的拖拽边界怎么算？

比单个图形麻烦，因为分组的包围盒随子节点增删而变化。

`dragBoundFunc` 里可以用 `group.getClientRect()` 拿到当前包围盒，
但要注意它每次都会遍历全部子节点重新计算——在每帧触发的回调里做这件事很贵。

实用做法是在 `dragstart` 时算一次存起来，拖拽过程中复用。
子节点在拖拽期间不会变，这个缓存是安全的。

### 空分组能拖吗？

可以设 `draggable`，但点不中——空分组没有任何可命中的内容。

需要「有一块可拖区域但内容是空的」时，往分组里放一个透明矩形：
`fill: 'rgba(0,0,0,0)'`。注意不能不设 `fill`，未填充的图形不参与命中检测。

## 与其他方案的取舍

移动多个图形有两条路。

**放进分组一起拖**：结构清晰，相对位置天然维持，一次拖拽只产生一组坐标变化。
适合那些逻辑上本来就是一个整体的内容——一张卡片、一个图例、一组标注。

**用 [Transformer](/docs/select-and-transform/basic-demo) 多选后拖**：
不改变场景树结构，选中集合是临时的，用户随时可以重新选。
适合图形编辑器里「框选一批然后一起挪」的操作。

判断依据是这组图形的关系是**固定的**还是**临时的**。固定关系用分组，
临时选择用多选。把临时选择做成分组，之后拆分会很麻烦。
