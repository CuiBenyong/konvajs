---
title: '多重事件'
description: '用 Konva 的 on() 一次绑定多个事件：把多个事件类型用空格分隔写在同一个字符串里，共用同一个回调函数。'
sidebar_position: 5
---

一个处理器同时响应多种事件，只要把事件名写在同一个字符串里。

## 用法

要使用`Konva`将多个事件绑定到单个处理程序，我们可以使用`on（）`方法，并传递一个包含多个事件类型用空格开的字符串。 

说明：鼠标经过，鼠标按下和鼠标弹起在圆上，观察 每个事件都执行绑定到圆上的函数。

<iframe src="/downloads/code/events/Multi_Event.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Multi-Event Binding Demo</title>
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
    function writeMessage(message) {
      text.setText(message);
      layer.draw();
    }

    var stage = new Konva.Stage({
      container: 'container',
      width: 300,
      height: 300
    });

    var layer = new Konva.Layer();

    var text = new Konva.Text({
      x: 10,
      y: 10,
      fontFamily: 'Calibri',
      fontSize: 20,
      text: '',
      fill: 'black'
    });

    var numEvents = 0;

    var circle = new Konva.Circle({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2 + 10,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    circle.on('mouseover mousedown mouseup', function() {
      writeMessage('Multi-event binding!  Events: ' + (++numEvents));
    });
    circle.on('mouseout', function() {
      writeMessage('');
    });

    layer.add(circle);
    layer.add(text);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 多个事件共用处理器，怎么知道是哪个触发的？

读 `e.type`：

```js
shape.on('mouseover mouseout', (e) => {
  const entering = e.type === 'mouseover';
});
```

如果每种事件的逻辑差别很大，与其在一个处理器里分支，不如分开绑定——
合并的意义在于逻辑相同，不在于少写几行。

### 能和命名空间一起用吗？

可以，每个事件名各带各的命名空间：

```js
node.on('click.menu dblclick.menu', handler);
node.off('.menu');
```

一次 `off('.menu')` 就能把这一组全部移除，不用逐个列举事件名。
组件卸载时这个写法很省事，详见[通过名称移除事件](/docs/events/remove-by-name)。

### 绑定多个事件会影响性能吗？

基本不会。监听器本身极轻，真正的开销在命中检测——而那取决于有多少图形在监听，
与每个图形监听了几种事件无关。

换句话说，一个图形绑十种事件，和绑一种，命中检测的成本是一样的。
想省这部分开销要用 [`listening(false)`](/docs/events/listen-for-events)。

## 与其他方案的取舍

合并绑定适合**逻辑完全相同**的场景，最典型的是桌面与触屏的事件对：
`click tap`、`mousedown touchstart`。这类情况下合并不只是省事，
Konva 还会做去重，避免触屏上同一次操作执行两遍。

如果只是「恰好都要改同一个状态」，分开绑定往往更清楚——
后续某一种事件的逻辑要单独调整时，不必先把合并的处理器拆开。

判断标准：这些事件在语义上是不是同一件事的不同表达形式。是，就合并；
只是碰巧做了类似的事，就分开。
