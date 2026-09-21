---
title: '分层'
description: '调整 Konva 节点层级：moveToTop()、moveToBottom()、moveUp()、moveDown() 与 zIndex()，同样适用于图层之间的排序。'
sidebar_position: 2
---

层级调整方法作用于兄弟节点之间。跨容器的前后关系由容器自身的层级决定。

## 用法

要使用`Konva`的层，我们可以使用以下分层方法之一：
`moveToTop（）`，`moveToBottom（）`，`moveUp（）`，`moveDown（）`或`zIndex（）`。  
您还可以区分层组和层。  

说明：拖放移动它们，然后使用 按钮重新排序。
<iframe src="/downloads/code/groups_and_layers/Layering.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Shape Layering Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #buttons {
        position: absolute;
        left: 10px;
        top: 0px;
    }
    button {
        margin-top: 10px;
        display: block;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="buttons">
      <button id="toTop">
          Move yellow box to top
      </button>
      <button id="toBottom">
          Move yellow box to bottom
      </button>
      <button id="up">
          Move yellow box up
      </button>
      <button id="down">
          Move yellow box down
      </button>
      <button id="zIndex">
          Set yellow box zIndex to 3
      </button>
  </div>
  <script>
    var width = window.innerWidth;
    var height = window.innerHeight;
    
    var stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height
    });

    var layer = new Konva.Layer();
    var offsetX = 0;
    var offsetY = 0;
    var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    var yellowBox = null;

    for(var n = 0; n < 6; n++) {
        // anonymous function to induce scope
        (function() {
            var i = n;
            var box = new Konva.Rect({
                x: i * 30 + 210,
                y: i * 18 + 40,
                width: 100,
                height: 50,
                fill: colors[i],
                stroke: 'black',
                strokeWidth: 4,
                draggable: true,
                name: colors[i]
            });

            box.on('mouseover', function() {
                document.body.style.cursor = 'pointer';
            });
            box.on('mouseout', function() {
                document.body.style.cursor = 'default';
            });
            if(colors[i] === 'yellow') {
                yellowBox = box;
            }
            layer.add(box);
        })();
    }

    stage.add(layer);

    // add button event bindings
    document.getElementById('toTop').addEventListener('click', function() {
        yellowBox.moveToTop();
        layer.draw();
    }, false);

    document.getElementById('toBottom').addEventListener('click', function() {
        yellowBox.moveToBottom();
        layer.draw();
    }, false);

    document.getElementById('up').addEventListener('click', function() {
        yellowBox.moveUp();
        layer.draw();
    }, false);

    document.getElementById('down').addEventListener('click', function() {
        yellowBox.moveDown();
        layer.draw();
    }, false);

    document.getElementById('zIndex').addEventListener('click', function() {
        yellowBox.setZIndex(3);
        layer.draw();
    }, false);
  </script>

</body>
</html>
```

## 常见问题

### moveToTop 之后还是被别的图形盖住？

因为 `moveToTop()` 只在**同一个父容器内**生效。它把节点移到兄弟节点的最前，
但如果盖住它的那个图形在另一个分组或图层里，这个方法无能为力。

要解决跨容器的遮挡，得调整容器本身的层级，或者把节点移到目标容器里
（见[更换容器](/docs/groups-and-layers/change-containers)）。

### zIndex 是全局的序号吗？

不是，是在**当前父容器的子节点列表中的索引**。

所以两个不同分组里的节点都可能是 `zIndex: 0`，它们的前后关系由
分组之间的顺序决定，与各自的 zIndex 无关。

这是 Konva 层级模型最容易造成困惑的一点：它是**树形**的，
不是像 CSS `z-index` 那样可以跨层比较的全局值。

### 图层之间怎么排序？

图层也是节点，同样用 `moveToTop()`、`zIndex()` 这些方法，
它们在舞台的子节点列表里排序。

但要注意图层对应真实的 canvas 元素，改变图层顺序意味着调整 DOM 中
canvas 的排列，代价比调整普通节点大。频繁改图层顺序不是好设计，
通常说明分层方式需要重新考虑。

## 与其他方案的取舍

要让某个元素显示在最上层，有两种思路。

**在当前容器内提到最前**（`moveToTop()`）最轻量，不改变场景树结构。
适合同级元素之间的前后调整，比如点击卡片时让它浮到同组的最前面。

**移到专门的顶层图层**适合「必须盖住一切」的内容——拖拽中的元素、
浮层、提示框。它天然不受其他容器层级的影响。

拖拽场景推荐后者，而且有额外收益：被拖元素独占一层，
拖拽过程中主内容层完全不重绘，性能明显更好。
`dragstart` 时 `moveTo(dragLayer)`、`dragend` 时移回，是很常见的模式。
