---
title: '拖拽/释放'
description: 'Konva 拖放入门：用 draggable 属性让图形可拖动，并用 on() 绑定 dragstart、dragmove、dragend 事件，桌面与移动端通用。'
sidebar_position: 1
---

拖拽只需要一个属性就能开启。真正需要注意的是它与事件冒泡、坐标系的相互影响。

## 用法

使用`Konva`拖放图形，当我们实例化一个图形时可以设置`draggable`属性为`true`，  
或者我们可以使用`draggable（）`方法。`draggable（）`方法自动支持桌面应用和移动应用。  

要使用`Konva`检测拖放事件，可以使用`on（）`方法
将`dragstart`，`dragmove`或`dragend`事件绑定到节点。
`on（）`方法需要事件类型和回调函数。
<iframe src="/downloads/code/drag_and_drop/Drag_and_Drop.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva  Drag and Drop Demo</title>
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

    var layer = new Konva.Layer();
    var rectX = stage.getWidth() / 2 - 50;
    var rectY = stage.getHeight() / 2 - 25;

    var box = new Konva.Rect({
        x: rectX,
        y: rectY,
        width: 100,
        height: 50,
        fill: '#00D2FF',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
    });

    // add cursor styling
    box.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
    });
    box.on('mouseout', function() {
        document.body.style.cursor = 'default';
    });

    layer.add(box);
    stage.add(layer);
</script>

</body>
</html>
```

## 常见问题

### 父容器和子节点都设了 draggable，会怎样？

子节点优先。指针按在子节点上时，拖的是子节点，分组不动。

这通常是想要的，但如果你希望「拖子节点时整个分组一起动」，
就得把子节点的 `draggable` 关掉，只让分组可拖。

反过来，想让某个子节点独立于分组拖动，而分组本身也可拖——那是可以的，
两者不冲突，只是要清楚指针落在哪里决定了拖谁。

### 拖拽改的是什么属性？

只改 `x` 和 `y`，不碰 `offset`、`scale`、`rotation`。

所以给节点设了 `offsetX`/`offsetY` 之后，拖拽依然正常工作——
`x`/`y` 的语义变了（从左上角变成偏移点），但拖拽跟随指针的行为不变。

这也意味着拖拽结果可以直接读 `node.position()` 拿到，不需要额外换算。

### 怎么临时禁止拖拽？

`node.draggable(false)` 即可，可以随时切换。

如果是想在拖拽**开始后**取消，在 `dragstart` 里调 `node.stopDrag()`：

```js
node.on('dragstart', () => {
  if (locked) node.stopDrag();
});
```

注意 `stopDrag()` 不会把节点移回原位，它只是结束拖拽。需要复位得自己记录起始坐标。

## 与其他方案的取舍

节点拖拽与[舞台拖拽](/docs/drag-and-drop/drag-a-stage)解决的是不同问题。

**节点拖拽**是移动内容本身——用户在改变数据。流程图挪节点、画板挪图层，
拖完之后新坐标要存下来。

**舞台拖拽**是移动视角——内容没变，只是看的位置变了。地图平移、大画布漫游属于这类，
拖拽结果通常不需要持久化。

两者可以共存，常见做法是：默认拖节点，按住空格或中键时改为拖舞台。
实现上就是在按键时切换 `stage.draggable()` 与节点的 `draggable()`。
