---
title: '缩放尺寸限制'
description: '用 Konva Transformer 的 boundBoxFunc 限制图形的最大最小尺寸。返回钳制后的包围盒而非直接返回旧框，避免快速拖动时手感发黏。'
sidebar_position: 7
---

`boundBoxFunc` 在每次变换时被调用，你可以检查新的包围盒并返回一个修正过的版本。

## 用法

回调收到两个参数：变换前的包围盒 `oldBox` 与本次变换想要达到的 `newBox`。
返回哪个，图形就变成哪个。

限制最大宽度为 200 的写法：

```js
const tr = new Konva.Transformer({
  nodes: [rect],
  boundBoxFunc: (oldBox, newBox) => {
    if (newBox.width > 200) {
      // 在新旧框之间按比例插值，让结果正好落在 200 上
      const t = (200 - oldBox.width) / (newBox.width - oldBox.width);
      return {
        x: oldBox.x + t * (newBox.x - oldBox.x),
        y: oldBox.y + t * (newBox.y - oldBox.y),
        width: 200,
        height: oldBox.height + t * (newBox.height - oldBox.height),
        rotation: newBox.rotation,
      };
    }
    return newBox;
  },
});
```

注意这里**没有**直接 `return oldBox`。原因见下面的第一个问题。

<iframe src="/downloads/code/select_and_transform/Resize_Limits.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Resize_Limits.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Resize Limits Demo</title>
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
      x: 80, y: 90, width: 100, height: 100,
      fill: 'yellow', stroke: 'black', strokeWidth: 2, draggable: true
    });
    layer.add(rect);

    var MAX_WIDTH = 200;

    var tr = new Konva.Transformer({
      nodes: [rect],
      boundBoxFunc: function (oldBox, newBox) {
        if (newBox.width > MAX_WIDTH) {
          // 在新旧框之间按比例插值，让结果正好落在 MAX_WIDTH 上。
          // 直接 return oldBox 也能拦住，但快速拖动时图形会停在
          // 离限制值还有一段的位置，手感发黏。
          var t = (MAX_WIDTH - oldBox.width) / (newBox.width - oldBox.width);
          return {
            x: oldBox.x + t * (newBox.x - oldBox.x),
            y: oldBox.y + t * (newBox.y - oldBox.y),
            width: MAX_WIDTH,
            height: oldBox.height + t * (newBox.height - oldBox.height),
            rotation: newBox.rotation
          };
        }
        return newBox;
      }
    });
    layer.add(tr);

    layer.add(new Konva.Text({
      x: 20, y: 20, fontSize: 14, fill: '#333',
      text: '向右拖动：宽度到 200 就停住，且停得干脆，不会拖到一半卡住。'
    }));
  </script>

</body>
</html>
```

## 常见问题

### 为什么不能直接 return oldBox？

直接返回旧框确实能拦住超限，但手感很差。

鼠标移动是离散采样的，快速拖动时相邻两帧的位移可能有几十像素。假设当前宽度 180、
限制 200，下一帧鼠标算出来的宽度是 260——直接返回 `oldBox` 意味着这一帧维持 180，
图形停在离限制值还差 20 的位置，而且只要你继续快速拖动，它就一直卡在那儿。

按比例插值则把结果钳制到正好 200，图形贴着限制值停住，干脆利落。

### boundBoxFunc 里的 width 和图形的 width 是一回事吗？

不是。回调里的 box 是**变换后的包围盒**，它包含旋转，也**包含描边**。

上面的演示可以实测出这个差异：把宽度拖到上限后，包围盒宽度正好是 200，
而 `rect.width() * rect.scaleX()` 只有约 196。矩形的 `strokeWidth` 是 2，
描边向两侧各画一半，包围盒因此比几何宽度大 2；余下的差值来自 Transformer
自身的内部处理。

所以不能拿 `newBox.width` 直接和 `rect.width()` 比较，也不能把它当成未旋转的
尺寸写回节点。要按几何尺寸来限制时，先用 `node.strokeWidth()` 把描边扣掉；
或者给 Transformer 设 `ignoreStroke: true` 让包围盒不计描边。

需要精确的真实尺寸时，最稳妥的做法是在 `transformend` 里读节点自身的属性，
那时已经没有中间态了。

### 限制最小尺寸时要注意什么？

要考虑负值。快速向内拖过头时，`newBox.width` 会变成负数——此时图形已经翻转，
如果你的判断写成 `if (newBox.width < 20) return oldBox`，负数同样满足条件，
行为是对的；但如果写成 `Math.abs(newBox.width) < 20` 就会漏掉翻转的情况。

明确不想让图形翻转时，直接拒绝宽或高为负的 `newBox`。

## 性能提示

`boundBoxFunc` 在拖动过程中**每一帧都会被调用**，而且多选时每个节点都要过一遍。

回调里不要做 DOM 查询、不要遍历整个图层、不要创建对象数组。需要参考其他图形的
位置（例如限制在某个容器内）时，在 `transformstart` 时把那些坐标算好存起来，
回调里只做算术。

另外，回调的返回值每帧都会生成一个新对象。这在现代引擎里开销很小，
但如果你在里面还做了深拷贝或者 `JSON.parse(JSON.stringify(...))`，就会明显掉帧。
