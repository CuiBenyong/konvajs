---
title: '鼠标指针样式'
description: '改变 Konva 舞台上的鼠标指针样式：监听 mouseenter 与 mouseleave，在回调中设置 stage.container() 的 CSS cursor。'
sidebar_position: 7
---

光标样式不是 Konva 属性，而是舞台容器的 CSS。改它要通过 DOM。

## 用法

我们可以通过监听事件然后给 `Stage container` 设置样式来改变鼠标指针的样式。

说明：试试鼠标滑过每个五角星，看看指针的变化。
<iframe src="/downloads/code/styling/Mouse_Cursor.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Mouse Cursor Styles Demo</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #f0f0f0;
      }
    </style>
  </head>

  <body>
    <div id="container"></div>
    <script>
      var width = window.innerWidth;
      var height = window.innerHeight;

      var stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height
      });
      var layer = new Konva.Layer();

      var shape1 = new Konva.RegularPolygon({
        x: 80,
        y: stage.height() / 2,
        sides: 5,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
      });

      var shape2 = new Konva.RegularPolygon({
        x: 220,
        y: stage.height() / 2,
        sides: 5,
        radius: 70,
        fill: 'green',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
      });

      var shape3 = new Konva.RegularPolygon({
        x: 360,
        y: stage.height() / 2,
        sides: 5,
        radius: 70,
        fillLinearGradientStartPoint: { x: -50, y: -50 },
        fillLinearGradientEndPoint: { x: 50, y: 50 },
        fillLinearGradientColorStops: [0, 'red', 1, 'yellow'],
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
      });

      shape1.on('mouseenter', function() {
        stage.container().style.cursor = 'pointer';
      });

      shape1.on('mouseleave', function() {
        stage.container().style.cursor = 'default';
      });

      shape2.on('mouseenter', function() {
        stage.container().style.cursor = 'move';
      });

      shape2.on('mouseleave', function() {
        stage.container().style.cursor = 'default';
      });

      shape3.on('mouseenter', function() {
        stage.container().style.cursor = 'crosshair';
      });

      shape3.on('mouseleave', function() {
        stage.container().style.cursor = 'default';
      });

      layer.add(shape1);
      layer.add(shape2);
      layer.add(shape3);
      stage.add(layer);
    </script>
  </body>
</html>
```

## 常见问题

### 为什么不能直接给图形设 cursor？

因为图形不是 DOM 元素，浏览器无从得知指针悬停在画布内部的哪个「元素」上——在浏览器眼里整个画布就是一个 `<canvas>`。

所以做法是：监听 Konva 的悬停事件，然后改容器的 CSS：

```js
shape.on('mouseenter', () => {
  stage.container().style.cursor = 'pointer';
});
shape.on('mouseleave', () => {
  stage.container().style.cursor = 'default';
});
```

### 光标卡在某个样式上不恢复了？

最常见的原因是 `mouseleave` 没触发。几种情况会导致这个：

图形在鼠标悬停时被 `destroy()` 或 `visible(false)` 了——节点没了，离开事件自然不会派发。

用了 `mouseout` 而不是 `mouseleave`，在分组内子图形之间移动时会反复进出，
状态容易错乱（两者的区别见[事件绑定](/docs/events/binding-events)）。

稳妥的做法是在销毁或隐藏节点前主动复位一次光标。

### 拖拽过程中光标为什么不听话？

拖拽时浏览器会接管光标显示，通常强制为默认或「不可放置」样式。

想在拖拽中显示 `grabbing`，在 `dragstart` 时设置、`dragend` 时复位，
并且要设在 `document.body` 上而不只是容器上——指针可能已经移出容器范围。

## 国内环境注意事项

光标是纯桌面端的概念，触屏设备上完全不存在。这意味着**任何只靠悬停传达的信息，
在手机上都会丢失**。

国内移动端流量占比通常高于桌面，这个问题比想象中严重。常见的失效模式：
用光标变成 `pointer` 暗示「这里可以点」，手机用户完全看不到这个提示，
于是不知道哪些元素可交互。

替代方案有几种：给可交互元素加持续可见的视觉标识（描边、图标、微妙的阴影）；
首次进入时做一次引导动画；或者用 `window.matchMedia('(pointer: coarse)')`
判断指针精度，为触屏单独提供一套提示。

按指针精度判断比按屏幕宽度可靠——平板接鼠标时屏幕宽但指针是精确的，
而大屏触控一体机则相反。
