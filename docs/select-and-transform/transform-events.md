---
title: '变换事件'
description: 'Konva 的 transformstart、transform、transformend 事件绑在被变换的图形上而非 Transformer 上；transform 高频触发，重活应放到 transformend。'
sidebar_position: 6
---

变换过程中有三个事件可用：开始、进行中、结束。它们绑在**被变换的图形**上，不是绑在 Transformer 上。

## 用法

```js
rect.on('transformstart', () => {
  // 记录初始状态，便于撤销
});

rect.on('transform', () => {
  // 拖动过程中高频触发，这里只做轻量的实时反馈
});

rect.on('transformend', () => {
  // 交互结束，适合在这里同步状态、写入历史记录
});
```

多选时每个被选中的图形都会各自触发这套事件。

<iframe src="/downloads/code/select_and_transform/Transform_Events.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Transform_Events.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Transform Events Demo</title>
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
      x: 80, y: 90, width: 140, height: 100,
      fill: '#7a5fa3', stroke: 'black', strokeWidth: 2, draggable: true
    });
    layer.add(rect);
    layer.add(new Konva.Transformer({ nodes: [rect] }));

    var log = new Konva.Text({ x: 280, y: 20, fontSize: 13, fill: '#333', lineHeight: 1.5, text: '' });
    layer.add(log);

    var lines = [], transformCount = 0;
    function push(msg) {
      lines.push(msg);
      if (lines.length > 8) lines.shift();
      log.text(lines.join('\n'));
    }

    // 注意：事件绑在被变换的图形上，不是绑在 Transformer 上
    rect.on('transformstart', function () {
      transformCount = 0;
      push('transformstart');
    });
    rect.on('transform', function () {
      transformCount++;
      // transform 高频触发，这里只累计次数，不做重活
      log.text(lines.concat(['transform ×' + transformCount]).join('\n'));
    });
    rect.on('transformend', function () {
      push('transform ×' + transformCount);
      push('transformend  最终 ' +
        Math.round(rect.width() * rect.scaleX()) + ' × ' +
        Math.round(rect.height() * rect.scaleY()));
    });

    push('拖动锚点，观察事件顺序');
  </script>

</body>
</html>
```

## 常见问题

### 事件绑在 Transformer 上为什么收不到？

因为事件是从被变换的图形派发的，Transformer 只是操作它的工具。

要统一处理多个图形，可以把监听绑到图层上利用事件冒泡，
再通过 `e.target` 区分是哪一个。

### transform 事件触发得太频繁怎么办？

它跟随鼠标移动触发，一次拖拽产生几十次是常态——上面的演示里拖动一次就有十余次。

判断标准很简单：实时视觉反馈（例如显示当前尺寸）放 `transform`，
其他一切放 `transformend`。尤其是写入 undo 历史、发请求、更新前端框架状态，
放在 `transform` 里会让每一帧都走一遍完整流程。

### 在 transform 回调里修改节点属性会被覆盖吗？

在 Konva 10.4.0 之前会。此前 Transformer 在两次指针移动之间不感知外部对节点的修改，
你在回调里改的值会被下一帧的变换结果盖掉。

10.4.0 修复了这个问题，现在回调里的修改会被正确纳入。
[缩放文字](/docs/select-and-transform/resize-text)正是依赖这个行为——
它在 `transform` 里把 `scaleX` 复位。

## 性能提示

在 React、Vue 里最常见的性能陷阱是在 `transform` 里调用状态更新函数。
那意味着每帧都要走一遍框架的 diff 与重渲染，几十帧下来必然掉帧。

正确的分工是：拖动过程中**直接操作 Konva 节点**，不经过框架状态；
`transformend` 时再把最终结果一次性同步回状态。

如果确实需要在过程中更新界面（例如实时显示尺寸），把那部分做成不经过框架状态的
直接 DOM 写入，或者用 `requestAnimationFrame` 节流到每帧一次。
