---
title: '移除事件'
description: '用 Konva 的 off() 方法移除事件监听，传入事件类型即可解除该节点上对应的绑定。'
sidebar_position: 7
---

`off()` 按事件类型移除监听器。它的粒度比 DOM 的 `removeEventListener` 粗，用法要相应调整。

## 用法

要使用`Konva`删除事件监听，我们可以使用的`off（）`方法
需要事件类型（例如点击或鼠标）和形状对象。   

说明：点击圈子可查看onclick触发的提醒事件绑定。   
通过单击按钮并再次删除事件侦听器  
单击该圆圈以观察事件绑定已被删除。

<iframe src="/downloads/code/events/Remove_Event.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Remove Event Listener Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #buttons {
        position: absolute;
        top: 5px;
        left: 10px;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="buttons">
    <button id="removeClick">
      Remove onclick
    </button>
  </div>
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

    var circle = new Konva.Circle({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2 + 10,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    circle.on('click', function() {
      alert('You clicked on the circle');
    });

    layer.add(circle);
    stage.add(layer);

    document.getElementById('removeClick').addEventListener('click', function() {
      circle.off('click');
      alert('onclick removed');
    }, false);
  </script>

</body>
</html>
```

## 常见问题

### off 能只移除其中一个处理器吗？

不能——除非用命名空间。`off('click')` 会移除该节点上**所有**的 click 处理器，
不管是谁绑的。

在多人协作或组件化的代码里这很危险：你以为只清理了自己的监听，
实际上把别的模块绑的也一并干掉了。养成给自己的监听加
[命名空间](/docs/events/remove-by-name)的习惯，`off('click.myModule')` 才是安全的。

### 不带参数调用 off 会怎样？

`node.off()` 移除该节点上的全部监听器，所有事件类型、所有命名空间。

这个写法在「彻底重置一个节点」时有用，但同样要小心误伤。
如果节点马上就要销毁，直接 `destroy()` 更合适——它会连同子节点的监听一起清理。

### destroy 之后还需要手动 off 吗？

不需要。`destroy()` 会解除该节点及其所有子节点的监听器，
并把节点从场景树中移除。

要注意的是 `remove()` 不会——它只是把节点从父容器里摘出来，监听器都还在，
节点本身也还被你的变量引用着。打算复用就用 `remove()`，
不再需要就用 `destroy()`，两者的区别见[防止内存溢出](/docs/performance/avoid-memory-leaks)。

## 与其他方案的取舍

三种清理监听的手段，适用场景各不相同：

- **`off('事件名')`**：粒度最粗，会误伤他人绑定。只在你确定这个节点上只有自己的监听时用。
- **`off('.命名空间')`**：精确到模块，是组件化代码里的标准做法。代价是绑定时要记得加命名空间。
- **`destroy()`**：节点连同监听一起销毁。节点不再需要时最省心，但之后不能复用该节点。

一个实用原则：只要这段代码可能被复用或被别人的代码包围，就用命名空间。
省下的几个字符远不如后期排查「监听器莫名消失」的成本高。
