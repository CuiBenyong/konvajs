---
title: '取消事件冒泡'
description: '用 Konva 的 cancelBubble 阻止事件冒泡：在子节点事件中设为 true，事件对象就不会继续向父级图层与舞台传递。'
sidebar_position: 11
---

Konva 的事件会从图形向上冒泡到分组、图层、舞台。需要时可以中断这个过程。

## 用法

要使用`Konva`阻止冒泡，我们可以设置`cancelBubble`对象的属性设置为`true`。 




说明：点击圆形可以观察到只有圆形事件绑定被触发,
因为事件传播在触发循环事件时被取消，防止事件对象向上冒泡。

<iframe src="/downloads/code/events/Cancel_Propagation.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Cancel Event Bubble Propagation Demo</title>
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
      width: 300,
      height: 300
    });

    var layer = new Konva.Layer();

    var group = new Konva.Group();

    var circle = new Konva.Circle({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    circle.on('click', function(evt) {
      alert('You clicked the circle!');
      evt.cancelBubble = true;
    });

    group.on('click', function() {
      alert('You clicked on the group!');
    });

    layer.on('click', function() {
      alert('You clicked on the layer!');
    });

    group.add(circle);
    layer.add(group);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### cancelBubble 是属性还是方法？

是**属性赋值**，不是方法调用：

```js
shape.on('click', (e) => {
  e.cancelBubble = true;
});
```

写成 `e.cancelBubble()` 会抛错。这个命名沿袭自早期 IE 的事件模型，
和 DOM 标准的 `stopPropagation()` 不是一回事。

### 阻止了冒泡，为什么外层的 DOM 事件还是触发了？

`cancelBubble` 只管 Konva 内部的节点冒泡链——图形到分组到图层到舞台。
它不影响原生 DOM 事件继续往 `<canvas>` 外面传。

要拦住原生事件，操作真实事件对象：

```js
e.evt.stopPropagation();
```

两者经常需要一起用：前者防止舞台的点击处理器把选中态清空，
后者防止页面上的其他监听器响应。

### 舞台的 content 事件能被 cancelBubble 阻止吗？

不能。`contentClick`、`contentMousemove` 这类事件由舞台自己派发，
不在图形的冒泡链上，图形里设 `cancelBubble` 对它们没有任何影响。

如果你同时用了这两套机制，要意识到它们是并行的——点一个图形，
图形的 `click` 和舞台的 `contentClick` 都会触发。详见 [Stage 事件](/docs/events/stage-events)。

## 与其他方案的取舍

除了阻止冒泡，还有一种常见做法是在外层处理器里判断 `e.target`：

```js
layer.on('click', (e) => {
  if (e.target !== background) return;
  // 只处理点在背景上的情况
});
```

两者的区别在于**控制权在哪一侧**。`cancelBubble` 是内层决定「这个事件到我为止」，
外层无从知晓；判断 `e.target` 是外层自己筛选，内层什么都不用做。

组件化的场景更适合前者——子组件封装自己的行为，不需要外层配合。
而外层逻辑集中的场景用后者更清楚，因为所有分支都写在一处，不必到处找谁阻止了冒泡。
