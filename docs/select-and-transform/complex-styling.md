---
title: '逐锚点定制样式'
description: '用 Konva Transformer 的 anchorStyleFunc 对每个锚点单独设置外观，可按名称区分旋转把手、四角与四边中点。'
sidebar_position: 5
---

`anchorStyleFunc` 让你对每个锚点单独处理，而不是一刀切。

## 用法

回调收到锚点节点本身，直接改它的属性即可，**不需要返回值**：

```js
const tr = new Konva.Transformer({
  nodes: [rect],
  anchorStyleFunc: (anchor) => {
    if (anchor.hasName('rotater')) {
      anchor.cornerRadius(10);
      anchor.fill('#d08a3e');
      return;
    }
    anchor.fill('#333');
    anchor.stroke('#fff');
  },
});
```

锚点的名字就是它的位置：`top-left`、`top-center`、`middle-right`……
旋转把手叫 `rotater`。

<iframe src="/downloads/code/select_and_transform/Complex_Styling.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Complex_Styling.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Transformer Complex Styling Demo</title>
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

    var rect = new Konva.Rect({
      x: 120, y: 100, width: 160, height: 110,
      fill: '#5aa469', draggable: true
    });
    layer.add(rect);

    var tr = new Konva.Transformer({
      nodes: [rect],
      // 逐锚点定制：回调收到锚点节点本身，直接改属性即可，不需要返回值
      anchorStyleFunc: function (anchor) {
        if (anchor.hasName('rotater')) {
          anchor.cornerRadius(10);
          anchor.fill('#d08a3e');
          anchor.width(20);
          anchor.height(20);
          anchor.offsetX(10);
          anchor.offsetY(10);
          return;
        }
        // 四个角用方形深色锚点，四条边的中点隐藏
        if (anchor.hasName('top-center') || anchor.hasName('bottom-center') ||
            anchor.hasName('middle-left') || anchor.hasName('middle-right')) {
          anchor.visible(false);
          return;
        }
        anchor.fill('#333');
        anchor.stroke('#fff');
        anchor.strokeWidth(2);
      }
    });
    layer.add(tr);

    layer.add(new Konva.Text({
      x: 20, y: 20, fontSize: 14, fill: '#333',
      text: '旋转把手为橙色圆形，四角为深色方块，四边中点已隐藏。'
    }));
  </script>

</body>
</html>
```

## 常见问题

### 怎么知道当前是哪个锚点？

用 `anchor.hasName('top-left')` 判断，或者 `anchor.name()` 取出名字。

完整的名字有九个：四角 `top-left`、`top-right`、`bottom-left`、`bottom-right`，
四边中点 `top-center`、`bottom-center`、`middle-left`、`middle-right`，
以及旋转把手 `rotater`。

### 改了锚点尺寸后位置偏了？

锚点是以自身左上角定位的，改 `width`/`height` 时要同步改 `offsetX`/`offsetY`
为尺寸的一半，才能保持中心对齐。

演示里把旋转把手改成 20×20 的圆时就同时设了 `offsetX(10)`、`offsetY(10)`。
漏掉这一步，把手会向右下偏移半个身位。

### 隐藏单个锚点用它还是用 enabledAnchors？

两者都行，区别在于时机与灵活度。

`enabledAnchors` 是静态配置，一次定好；`anchorStyleFunc` 里 `anchor.visible(false)`
可以按运行时条件决定——例如图形很小时隐藏边中点只留四角，避免锚点挤成一团。

需要动态判断就用回调，固定不变就用 `enabledAnchors`，后者语义更清楚。

## 与其他方案的取舍

`anchorFill`、`anchorSize` 这类[全局属性](/docs/select-and-transform/transformer-styling)
写起来最短，适合「所有锚点长一个样」的常规需求。

`anchorStyleFunc` 的价值在于按锚点区分，以及按运行时状态区分。代价是它在每次
控制柄更新时都会对每个锚点调用一遍——拖动过程中这意味着每帧九次。

所以回调里只做属性赋值，不要做计算、不要访问 DOM、不要读其他节点的包围盒。
需要根据图形尺寸决定样式时，把尺寸在外面算好存进变量，回调里只读。
