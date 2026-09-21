---
title: '释放事件'
description: 'Konva 不内置 drop 事件，本文演示如何自行实现 drop、dragenter、dragleave、dragover 检测——关键是把被拖对象移到单独图层。'
sidebar_position: 9
---

Konva 没有内置的 drop 事件。要知道「拖到了谁身上」，需要自己做命中判断。

## 用法

`Konva`默认不支持drop(放下)事件。 但是你可以编写自己的`drop`事件检测。要检测拖放目标形状，您必须将拖动对象移动到另一个图层中。  
 
在这个例子中，你可以看到`drop`,`dragenter`，`dragleave`，`dragover`的事件。  
说明：将一个形状拖动到另一个形状上。 或将一个形状拖放到另一个形状下。
<iframe src="/downloads/code/drag_and_drop/Drop_Events.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Drop Events Demo</title>
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

    stage.add(layer);

    var tempLayer = new Konva.Layer();
    stage.add(tempLayer);

    var text = new Konva.Text({
        fill : 'black'
    });
    layer.add(text);

    var star;
    for (var i = 0; i < 10; i++) {
        star = new Konva.Star({
            x : stage.width() * Math.random(),
            y : stage.height() * Math.random(),
            fill : "blue",
            numPoints :10,
            innerRadius : 20,
            outerRadius : 25,
            draggable: true,
            name : 'star ' + i,
            shadowOffsetX : 5,
            shadowOffsetY : 5
        });
        layer.add(star);
    }
    layer.draw();

    stage.on("dragstart", function(e){
        e.target.moveTo(tempLayer);
        text.text('Moving ' + e.target.name());
        layer.draw();
    });


    var previousShape;
    stage.on("dragmove", function(evt){
        var pos = stage.getPointerPosition();
        var shape = layer.getIntersection(pos);
        if (previousShape && shape) {
            if (previousShape !== shape) {
                // leave from old targer
                previousShape.fire('dragleave', {
                    type : 'dragleave',
                    target : previousShape,
                    evt : evt.evt
                }, true);

                // enter new targer
                shape.fire('dragenter', {
                    type : 'dragenter',
                    target : shape,
                    evt : evt.evt
                }, true);
                previousShape = shape;
            } else {
                previousShape.fire('dragover', {
                    type : 'dragover',
                    target : previousShape,
                    evt : evt.evt
                }, true);
            }
        } else if (!previousShape && shape) {
            previousShape = shape;
            shape.fire('dragenter', {
                type : 'dragenter',
                target : shape,
                evt : evt.evt
            }, true);
        } else if (previousShape && !shape) {
            previousShape.fire('dragleave', {
                type : 'dragleave',
                target : previousShape,
                evt : evt.evt
            }, true);
            previousShape = undefined;
        }
    });
    stage.on("dragend", function(e){
        var pos = stage.getPointerPosition();
        var shape = layer.getIntersection(pos);
        if (shape) {
            previousShape.fire('drop', {
                type : 'drop',
                target : previousShape,
                evt : e.evt
            }, true);
        }
        previousShape = undefined;
        e.target.moveTo(layer);
        layer.draw();
        tempLayer.draw();
    });

    stage.on("dragenter", function(e){
        e.target.fill('green');
        text.text('dragenter ' + e.target.name());
        layer.draw();
    });

    stage.on("dragleave", function(e){
        e.target.fill('blue');
        text.text('dragleave ' + e.target.name());
        layer.draw();
    });

    stage.on("dragover", function(e){
        text.text('dragover ' + e.target.name());
        layer.draw();
    });

    stage.on("drop", function(e){
        e.target.fill('red');
        text.text('drop ' + e.target.name());
        layer.draw();
    });
</script>

</body>
</html>
```

## 常见问题

### 为什么必须把被拖对象移到另一个图层？

因为命中检测会先撞上被拖对象自己。指针位置正下方的第一个图形就是它，
`getIntersection()` 永远返回它，看不到下面的放置目标。

把它移到一个独立图层，再对原图层做命中检测，就能拿到真正的目标：

```js
node.on('dragstart', () => node.moveTo(dragLayer));
node.on('dragmove', () => {
  const target = mainLayer.getIntersection(stage.getPointerPosition());
});
```

这个做法顺带还有性能收益——拖拽过程中主图层完全不重绘。

### getIntersection 和包围盒相交该用哪个？

`getIntersection()` 是**像素级**的，基于命中图，形状不规则时结果准确，
但只能判断「指针正下方是谁」，拿不到所有重叠对象。

包围盒相交（`Konva.Util.haveIntersection`）是**矩形级**的，可以一次判断
与多个对象的重叠关系，但对非矩形图形不精确。

「拖到某个容器上」用前者，「框选一批对象」用后者。

### 怎么给放置目标加高亮反馈？

在 `dragmove` 里检测目标并与上一次的比较，变化时才更新样式：

```js
let lastTarget = null;
node.on('dragmove', () => {
  const t = mainLayer.getIntersection(stage.getPointerPosition());
  if (t === lastTarget) return;
  lastTarget && lastTarget.stroke(null);
  t && t.stroke('orange');
  lastTarget = t;
});
```

不做这个比较的话，每帧都会改一次样式并触发重绘，白白浪费。

## 与其他方案的取舍

两种判断方式的选择，本质是**精度**与**能力**的取舍。

`getIntersection()` 走命中图，结果和用户的视觉预期一致——指针压在哪个图形的实际像素上，就是哪个。代价是它只回答「最上面那个是谁」，
而且要求参与判断的图形没有关掉监听。

包围盒相交只是矩形比较，非常快，可以一次算出与所有对象的关系。
但对圆形、不规则路径来说，矩形的四个角是「假的重叠」，
用户会觉得放置区域比看到的大。

实践中常常两者配合：先用包围盒粗筛出少数候选，再对候选逐个做精确判断。
对象很多时这比全量精确判断快得多。
