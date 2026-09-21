---
title: '事件绑定'
description: '用 Konva 的 on() 方法绑定事件：支持 click、dblclick、mouseover、mouseout、mousedown、mouseup、mousemove、wheel 等桌面事件。'
sidebar_position: 1
---

事件是 Konva 交互的起点。它的事件系统模仿 DOM，但有几处关键差别值得先弄清。

## 用法

使用`Konva`检测形状事件，我们可以使用`on（）`方法将事件处理程序绑定到节点.  
`on（）`方法需要事件类型和回调函数。
`Konva`支持`mouseover`，`mouseout`，`mouseenter`，`mouseleave`，`mousemove`，`mousedown`，`mouseup`，`wheel`，`click`，`dblclick`，`dragstart`，`dragmove`和`dragend`桌面事件。
 
说明：鼠标悬停和鼠标移出三角形，鼠标悬停，鼠标悬停，鼠标悬停和鼠标悬停在圆圈上

<iframe src="/downloads/code/events/Binding_Events.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Shape Events Demo</title>
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

    var triangle = new Konva.RegularPolygon({
      x: 80,
      y: 120,
      sides: 3,
      radius: 80,
      fill: '#00D2FF',
      stroke: 'black',
      strokeWidth: 4
    });

    var text = new Konva.Text({
      x: 10,
      y: 10,
      fontFamily: 'Calibri',
      fontSize: 24,
      text: '',
      fill: 'black'
    });

    triangle.on('mouseout', function() {
      writeMessage('Mouseout triangle');
    });

    triangle.on('mousemove', function() {
      var mousePos = stage.getPointerPosition();
      var x = mousePos.x - 190;
      var y = mousePos.y - 40;
      writeMessage('x: ' + x + ', y: ' + y);
    });

    var circle = new Konva.Circle({
      x: 230,
      y: 100,
      radius: 60,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    circle.on('mouseover', function() {
      writeMessage('Mouseover circle');
    });
    circle.on('mouseout', function() {
      writeMessage('Mouseout circle');
    });
    circle.on('mousedown', function() {
      writeMessage('Mousedown circle');
    });
    circle.on('mouseup', function() {
      writeMessage('Mouseup circle');
    });

    layer.add(triangle);
    layer.add(circle);
    layer.add(text);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### e.target 和 e.currentTarget 有什么区别？

`e.target` 是**实际被点中的图形**，`e.currentTarget` 是**绑定处理器的那个节点**。

直接绑在图形上时两者相同，所以容易忽略这个区别。一旦把处理器绑到图层或分组上做
[事件委托](/docs/events/event-delegation)，`e.currentTarget` 就是那个容器，
而 `e.target` 才是用户真正点的东西。写委托逻辑时用错会导致所有点击都被当成同一个目标。

### mouseenter 和 mouseover 该用哪个？

区别在于冒泡：`mouseover` / `mouseout` 会冒泡，`mouseenter` / `mouseleave` 不会。

这个差别在分组上最明显。给一个分组绑 `mouseover`，鼠标在它的子图形之间移动时会
反复触发进出；绑 `mouseenter` 则只在真正进入和离开整个分组时各触发一次。

做悬停高亮通常想要后者，否则高亮会在子图形边界处闪烁。

### 可以一次绑定多个事件吗？

可以，事件名之间用空格分隔：

```js
shape.on('click tap', handler);
```

这在同时支持桌面与触屏时很常用。详见[多重事件](/docs/events/multi-event)与
[桌面/移动端事件支持](/docs/events/desktop-and-mobile)。

## 与其他方案的取舍

把处理器直接绑在每个图形上，写法最直观，适合图形数量有限、行为各不相同的场景。

图形很多且行为一致时（例如一百个可点选的节点），改用事件委托——把一个处理器绑在
图层上，通过 `e.target` 区分。监听器数量从一百降到一，节点销毁时也不必逐个解绑。

判断依据不是「哪种更好」，而是图形数量与行为是否同质。十个按钮各有各的逻辑，
直接绑更清楚；一百个同类节点，委托更省。
