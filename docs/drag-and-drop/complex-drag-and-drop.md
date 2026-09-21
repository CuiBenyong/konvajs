---
title: '复杂的拖拽区域'
description: '用 Konva 的 dragBoundFunc 定义复杂拖拽边界：把拖拽限制在直线下方、圆形区域内或任意自定义路径中。'
sidebar_position: 8
---

边界不一定是矩形。`dragBoundFunc` 返回什么坐标由你决定，圆形、路径、任意规则都可以。

## 用法

要使用`Konva`限制节点在区域内的被拖放运动，我们可以使用`dragBoundFunc`属性来定义边界,
节点不能交叉。 

说明：拖放浅蓝色矩形并观察它
在y = 50的虚拟边界下面。拖放黄色
矩形并观察它被绑定在一个假想圆内。
<iframe src="/downloads/code/drag_and_drop/Complex_Drag_and_Drop.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Complex Drag and Drop Bounds Demo</title>
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

    // bound below y=50
    var blueGroup = new Konva.Group({
        x: 30,
        y: 70,
        draggable: true,
        dragBoundFunc: function(pos) {
            var newY = pos.y < 50 ? 50 : pos.y;
            return {
                x: pos.x,
                y: newY
            };
        }
    });

    // bound inside a circle
    var yellowGroup = new Konva.Group({
        x: stage.getWidth() / 2,
        y: 70,
        draggable: true,
        dragBoundFunc: function(pos) {
            var x = stage.getWidth() / 2;
            var y = 70;
            var radius = 50;
            var scale = radius / Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
            if(scale < 1)
                return {
                    y: Math.round((pos.y - y) * scale + y),
                    x: Math.round((pos.x - x) * scale + x)
                };
            else
                return pos;
        }
    });

    var blueText = new Konva.Text({
        fontSize: 26,
        fontFamily: 'Calibri',
        text: 'bound below',
        fill: 'black',
        padding: 10
    });

    var blueRect = new Konva.Rect({
        width: blueText.getWidth(),
        height: blueText.getHeight(),
        fill: '#aaf',
        stroke: 'black',
        strokeWidth: 4
    });

    var yellowText = new Konva.Text({
        fontSize: 26,
        fontFamily: 'Calibri',
        text: 'bound in circle',
        fill: 'black',
        padding: 10
    });

    var yellowRect = new Konva.Rect({
        width: yellowText.getWidth(),
        height: yellowText.getHeight(),
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 4
    });

    blueGroup.add(blueRect).add(blueText);
    yellowGroup.add(yellowRect).add(yellowText);

    layer.add(blueGroup);
    layer.add(yellowGroup);

    // add the layer to the stage
    stage.add(layer);
</script>

</body>
</html>
```

## 常见问题

### 圆形边界怎么算？

把坐标转成相对圆心的向量，超出半径就按方向缩回到圆周上：

```js
node.dragBoundFunc((pos) => {
  const dx = pos.x - cx, dy = pos.y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= r) return pos;
  return { x: cx + (dx / dist) * r, y: cy + (dy / dist) * r };
});
```

关键是**按方向等比缩回**，而不是分别对 x 和 y 做限制——后者会让节点在边界的对角方向上跑出圆外。

### 多个约束叠加时顺序重要吗？

重要。约束是依次施加的，后面的会覆盖前面的结果。

比如先限制在矩形内、再吸附到网格，最终位置可能因为吸附而跑出矩形；
反过来先吸附再限制，就能保证一定在矩形内，但可能不在网格点上。

两个约束无法同时满足时，必须明确哪个优先。把它写进注释——这类逻辑半年后自己也看不懂为什么是这个顺序。

### 怎么约束到其他图形的边缘？

思路是收集候选坐标，找最近且在阈值内的那个。

关键在于**不要在回调里遍历图层**。在 `dragstart` 时把所有候选边的坐标
算好存进数组，回调里只做距离比较：

```js
let guides = [];
node.on('dragstart', () => {
  guides = layer.find('.snappable').map(n => n.getClientRect());
});
```

图形很多时还可以只收集视口内的——用户看不见的参考线没有吸附价值。

## 性能提示

复杂边界的计算量比简单矩形大，而它每帧都要跑一遍，所以缓存策略是关键。

**在 `dragstart` 时预计算**。边界的几何参数、参考对象的坐标、
任何在拖拽期间不变的量，都应该在这里算好。拖拽过程中场景通常是静止的，
这个缓存是安全的。

**避免开方**。比较距离时用平方距离即可，`dx*dx + dy*dy <= r*r` 与
`Math.sqrt(...) <= r` 等价但省一次开方。只有真正需要「缩回到边界上」时
才必须算实际距离。

**候选集合要有上限**。吸附到其他图形时，如果场景里有上千个候选，
每帧比较一千次会很慢。按空间分区或只取视口内的对象来缩小范围。
