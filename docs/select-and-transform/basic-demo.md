---
title: '选中、缩放与旋转'
description: '用 Konva.Transformer 给图形加上可拖拽的控制柄，实现选中、缩放与旋转，并支持 Shift 多选与在空白处拖拽框选。'
sidebar_position: 1
---

`Konva.Transformer` 是一个特殊节点，它把控制柄画在被选中的图形周围，
让用户直接拖拽就能缩放和旋转。

## 用法

Transformer 自己也是一个节点，要 `add` 到图层上，再用 `nodes()` 告诉它当前操作哪些图形：

```js
const tr = new Konva.Transformer();
layer.add(tr);
tr.nodes([rect]);
```

`nodes()` 接受数组，传多个图形即可同时变换；传空数组 `tr.nodes([])` 取消选中。

下面的演示在此基础上实现了完整的选择交互：点击选中、Shift 点击多选、在空白处拖拽框选。

<iframe src="/downloads/code/select_and_transform/Basic_Demo.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Basic_Demo.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Transformer Basic Demo</title>
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

    layer.add(new Konva.Rect({
      x: 60, y: 60, width: 100, height: 90,
      fill: 'red', name: 'rect', draggable: true
    }));
    layer.add(new Konva.Rect({
      x: 250, y: 100, width: 150, height: 90,
      fill: 'green', name: 'rect', draggable: true
    }));

    var tr = new Konva.Transformer();
    layer.add(tr);

    // 框选用的半透明矩形。listening: false 让它不拦截指针事件，
    // 否则松手时 e.target 会是它自己而不是舞台。
    var selectionRectangle = new Konva.Rect({
      fill: 'rgba(0,0,255,0.5)',
      visible: false,
      listening: false
    });
    layer.add(selectionRectangle);

    var x1, y1, x2, y2, selecting = false;

    stage.on('mousedown touchstart', function (e) {
      // 点在图形上时不启动框选，交给下面的选中逻辑
      if (e.target !== stage) return;
      e.evt.preventDefault();
      x1 = x2 = stage.getPointerPosition().x;
      y1 = y2 = stage.getPointerPosition().y;
      selecting = true;
      selectionRectangle.width(0);
      selectionRectangle.height(0);
    });

    stage.on('mousemove touchmove', function (e) {
      if (!selecting) return;
      e.evt.preventDefault();
      x2 = stage.getPointerPosition().x;
      y2 = stage.getPointerPosition().y;
      selectionRectangle.setAttrs({
        visible: true,
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1)
      });
    });

    stage.on('mouseup touchend', function (e) {
      selecting = false;
      if (!selectionRectangle.visible()) return;
      e.evt.preventDefault();

      var box = selectionRectangle.getClientRect();
      var selected = stage.find('.rect').filter(function (shape) {
        return Konva.Util.haveIntersection(box, shape.getClientRect());
      });
      tr.nodes(selected);

      // 留到下一轮事件循环再隐藏，好让紧随其后的 click 能判断出
      // 「这次点击是框选的收尾」，从而不把刚选中的图形清空
      setTimeout(function () {
        selectionRectangle.visible(false);
      });
    });

    stage.on('click tap', function (e) {
      // 框选刚结束时不要把这次点击当成选中操作
      if (selectionRectangle.visible()) return;

      if (e.target === stage) {
        tr.nodes([]);
        return;
      }
      if (!e.target.hasName('rect')) return;

      var metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      var isSelected = tr.nodes().indexOf(e.target) >= 0;

      if (!metaPressed && !isSelected) {
        tr.nodes([e.target]);
      } else if (metaPressed && isSelected) {
        var nodes = tr.nodes().slice();
        nodes.splice(nodes.indexOf(e.target), 1);
        tr.nodes(nodes);
      } else if (metaPressed && !isSelected) {
        tr.nodes(tr.nodes().concat([e.target]));
      }
    });

    // 首屏就选中一个图形，让读者立刻看到控制柄
    tr.nodes([stage.findOne('.rect')]);
  </script>

</body>
</html>
```

## 常见问题

### 为什么 Transformer 不显示？

三个最常见的原因：忘了把它 `add` 到图层；`nodes()` 传的是单个节点而不是数组；
或者被操作的图形本身是 `visible(false)`。

还有一个不那么明显的：Transformer 必须和被操作的图形在**同一个图层**上。
跨图层时控制柄会画在另一张画布上，位置和层级都不对，看起来就像没出现。

### 点击空白处为什么取消不了选中？

点到空白处时 `e.target` 是 stage 本身，要判断这个条件来清空：

```js
stage.on('click tap', (e) => {
  if (e.target === stage) {
    tr.nodes([]);
  }
});
```

如果同时实现了框选，还要额外排除一种情况：框选结束时浏览器也会派发一次 `click`，
不处理的话刚框选好的图形会立刻被清空。上面的演示用「延迟一轮事件循环再隐藏框选矩形」
来区分这两种点击。

### 缩放之后 width 没变，变的是 scaleX？

这是 Transformer 的设计：它改的是 `scaleX` / `scaleY`，不是 `width` / `height`。

对大多数图形没有区别，但对文字和带描边的图形会出问题——字形会被拉伸变形，
描边会跟着变粗。这两种情况的处理办法见
[缩放文字](/docs/select-and-transform/resize-text)与
[描边不随缩放变粗](/docs/select-and-transform/ignore-stroke)。

## 性能提示

Transformer 在每次变换中都要重算控制柄位置。Konva 10.4.0 起做了优化——
未变化的图形边界会被复用、选择框未变时不重建锚点——但选中节点的数量仍然是主要成本。

批量操作节点时（例如一次性移动几十个图形），先 `tr.nodes([])` 解除关联、
操作完再重新关联，可以避免中间过程触发大量无意义的重算。

另外，框选逻辑里的 `getClientRect()` 对每个候选图形都要算一次包围盒。
图形数量很多时，先用一次粗筛（例如只比较中心点是否落在框内）缩小范围，
再对候选集做精确相交判断。
