---
title: '触发事件'
description: '用 Konva 的 fire() 方法以编程方式触发事件：既可触发 click、mouseover 等内置事件，也可触发自定义事件。'
sidebar_position: 13
---

`fire()` 让你以编程方式触发事件，既可以是内置事件，也可以是自定义的。

## 用法

使用`Konva`触发事件,我们可以用`fire()`方法.   

这使我们能够以编程方式触发事件，如点击，鼠标经过，
鼠标移动等，也可以是自定义事件。

<iframe src="/downloads/code/events/Fire_Events.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Fire Event Demo</title>
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

    var circle = new Konva.Circle({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2 + 10,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    var text = new Konva.Text({
      text: '',
      fontFamily: 'Calibri',
      fontSize: 24,
      fill: 'black',
      x: 10,
      y: 10
    });

    circle.on('click', function(evt) {
      text.setText('you clicked on the circle!');
      layer.draw();
    });

    layer.add(circle).add(text);
    stage.add(layer);

    // simulate click on circle
    circle.fire('click');
  </script>

</body>
</html>
```

## 常见问题

### fire 触发的事件会冒泡吗？

默认不会。需要冒泡要传第三个参数：

```js
shape.fire('click', null, true);
```

这个默认值经常让人困惑——用 `fire('click')` 模拟点击，绑在图层上的
[委托处理器](/docs/events/event-delegation)收不到，看起来就像 `fire` 没生效。

### 处理器里读 e.evt 拿到的是什么？

是 `fire()` 第二个参数传进去的东西，默认为 `null`。

这意味着依赖原生事件对象的处理器会出问题——读 `e.evt.clientX`、`e.evt.shiftKey`
都会抛错。写处理器时如果预期它可能被 `fire()` 调用，要对 `e.evt` 做判空。

反过来，测试时可以自己构造：`shape.fire('click', { evt: { shiftKey: true } })`。

### 自定义事件名有什么限制？

基本没有，任意字符串都行：

```js
node.on('selected', () => { /* ... */ });
node.fire('selected');
```

这是做组件间解耦通信的轻量办法——发出方不需要知道谁在监听。
建议给自定义事件名加个前缀（如 `app:selected`），避免与 Konva 未来新增的内置事件撞名。

## 与其他方案的取舍

`fire()` 与直接调用函数的区别，在于**谁知道谁**。

直接调用要求发出方持有接收方的引用，两者耦合。`fire()` 只是发出一个信号，
有没有人听、有几个人听，发出方都不关心。

代价是调试变难——看到一个事件被触发，要找出所有监听它的地方并不容易，
尤其在事件名是动态拼接的时候。

经验做法是：同一个模块内部直接调函数；跨模块、或者「可能有多个响应方」时用事件。
不要为了解耦而把所有调用都改成事件，那会让代码流向变得无法追踪。
