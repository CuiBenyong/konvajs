---
title: '简单的拖拽区域'
description: '用 Konva 的 dragBoundFunc 约束拖拽方向：限制图形只能水平、垂直或沿对角线移动，也可限制在盒子或圆形范围内。'
sidebar_position: 7
---

`dragBoundFunc` 在每次拖拽移动时被调用，你返回什么坐标，节点就落在哪里。

## 用法

使用`Konva`为了限制拖放的形状的移动，
我们可以使用`dragBoundsFunc`属性，这是一个用户定义的函数。  
 这个函数可以用来约束
在各种方向的拖放运动，如约束运动
水平地，垂直地，对角地或径向地，或甚至约束节点
保持在盒子，圆圈或任何其他路径的内部。 


说明：拖放水平文本，并观察它只能
水平移动。 拖放垂直文本，并观察它只能垂直移动。
<iframe src="/downloads/code/drag_and_drop/Simple_Drag_Bounds.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Simple Drag Bounds Demo</title>
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

    var rectHeight = 50;
    var rectWidth = 100;
    var rectY = (stage.getHeight() - rectHeight) / 2;

    var hbox = new Konva.Text({
        x: 20,
        y: 70,
        fontSize: 24,
        fontFamily: 'Calibri',
        text: 'horizontal',
        fill: 'black',
        padding: 15,
        draggable: true,
        dragBoundFunc: function(pos) {
            return {
                x: pos.x,
                y: this.getAbsolutePosition().y
            }
        }
    });

    var vbox = new Konva.Text({
        x: 150,
        y: 70,
        draggable: true,
        fontSize: 24,
        fontFamily: 'Calibri',
        text: 'vertical',
        fill: 'black',
        padding: 15,
        draggable: true,
        dragBoundFunc: function(pos) {
            return {
                x: this.getAbsolutePosition().x,
                y: pos.y
            }
        }
    });

    layer.add(hbox);
    layer.add(vbox);
    // add the layer to the stage
    stage.add(layer);
</script>

</body>
</html>
```

## 常见问题

### 回调里的坐标是相对什么的？

是**绝对坐标**，相对舞台左上角，不是相对父容器。

这一点在节点位于有变换的分组内时尤其重要——分组做了平移或缩放之后，
节点的 `x`/`y` 与它的绝对位置完全不同。回调里拿到的和返回的都必须是绝对坐标，
不要混入节点自身的坐标值。

需要在两套坐标之间换算时用 `node.getAbsoluteTransform()`。

### 能在回调里阻止拖拽发生吗？

不能。`dragBoundFunc` 只决定节点落在哪里，它无法取消这次拖拽——返回原位置只是让节点看起来不动，拖拽状态仍在进行。

要真正中止，在 `dragstart` 或 `dragmove` 里调 `node.stopDrag()`。
两者的差别与 [Transformer 的 stopTransform](/docs/select-and-transform/stop-transform)
完全类似：约束是「不让它动」，中止是「结束这次交互」。

### 只想限制一个方向怎么写？

返回时把另一个方向固定成起始值：

```js
node.dragBoundFunc(function (pos) {
  return { x: pos.x, y: this.absolutePosition().y };
});
```

注意这里用了 `function` 而不是箭头函数——回调里的 `this` 指向被拖节点，
用箭头函数会拿不到。这是个很容易踩的坑。

## 性能提示

`dragBoundFunc` 每帧都会被调用。取整、比较、简单算术没有问题，
但以下几件事会让拖拽明显发涩：

**在回调里调 `getClientRect()`**。它会遍历子节点重新计算包围盒，
分组节点上尤其贵。需要包围盒就在 `dragstart` 时算一次存起来。

**在回调里遍历图层找参考对象**。做吸附时很容易这么写。正确做法是
`dragstart` 时收集候选坐标存成数组，回调里只做比较。

**在回调里读取 DOM**。任何 `getBoundingClientRect`、`offsetWidth` 都会强制
浏览器重排，在每帧回调里是灾难性的。
