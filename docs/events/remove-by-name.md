---
title: '通过名称移除事件'
description: '用命名空间事件精准解绑：绑定时写成 click.myNamespace，之后用 off(".myNamespace") 只移除该命名空间下的监听器。'
sidebar_position: 8
---

命名空间让你精确移除某一组监听器，而不影响同一事件上的其他处理器。

## 用法

##使用`Konva`通过名称删除事件监听  


我们可以使用`on（）`方法添加命名空间的事件类型，以便我们以后
使用`off（）`方法通过相同的命名空间删除事件监听器。  



说明：点击圆形可查看两个不同的`onclick`绑定的弹窗。  
 使用按钮删除事件监听器再次单击圆形观察新的oncli

<iframe src="/downloads/code/events/Remove_by_Name.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Remove Event Listener by Name Demo</title>
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
    <button id="remove1">
      Remove First Listener
    </button>
    <button id="remove2">
      Remove Second Listener
    </button>
    <button id="removeAll">
      Remove All Listeners
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

    circle.on('click.event1', function() {
      alert('First Listener');
    });
    circle.on('click.event2', function() {
      alert('Second Listener');
    });

    layer.add(circle);
    stage.add(layer);

    document.getElementById('remove1').addEventListener('click', function() {
      circle.off('click.event1');
      alert('First onclick removed');
    }, false);

    document.getElementById('remove2').addEventListener('click', function() {
      circle.off('click.event2');
      alert('Second onclick removed');
    }, false);

    document.getElementById('removeAll').addEventListener('click', function() {
      circle.off('click');
      alert('All onclicks removed');
    }, false);
  </script>

</body>
</html>
```

## 常见问题

### 命名空间的语法是什么？

在事件名后面加点和名字：`click.myNamespace`。

```js
node.on('click.tooltip', showTooltip);
node.on('click.select', selectNode);

node.off('click.tooltip'); // 只移除 tooltip 那个
```

不带事件名只写命名空间也行：`node.off('.tooltip')` 会移除该命名空间下的所有事件类型。

### 为什么不能直接 off 掉某个函数？

Konva 的 `off()` 按事件类型和命名空间匹配，不支持传入函数引用来精确移除。

这和 DOM 的 `removeEventListener(type, fn)` 不同。所以如果你在同一个事件上绑了
多个匿名函数，`off('click')` 会把它们全部移除，没有办法只去掉其中一个。

需要精确控制就用命名空间，这是 Konva 提供的唯一办法。

### 命名空间能嵌套吗？

不能。`click.a.b` 这样的写法不会建立层级关系，Konva 只认第一个点之后的部分。

需要分组管理时用扁平的命名约定，例如 `click.panel-tooltip`、`click.panel-select`，
靠前缀自己组织，而不是指望框架支持层级。

## 性能提示

忘记解绑的监听器是内存泄漏的常见来源。每个处理器都是一个闭包，
持有对节点、对组件实例、对外部数据的引用——只要监听器还在，这些都回收不掉。

在 React、Vue 这类框架里尤其要注意：组件重新渲染时若重复绑定而不解绑，
监听器会一次次累积，同一个点击执行十几遍。

可靠的做法是给组件内绑定的所有事件加统一命名空间，卸载时一行清理：

```js
// 挂载
node.on('click.myComp dragmove.myComp', handler);
// 卸载
node.off('.myComp');
```

如果节点本身也要销毁，`destroy()` 会自动清理它的全部监听器，就不必单独 `off` 了。
