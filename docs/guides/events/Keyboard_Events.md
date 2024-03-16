---
order: 15
group:
  title: 事件
  order: 3
title: 键盘事件
description: ''
keywords: []
---

## 键盘事件
我们没有内建像 keydown 或者 keyup 这些键盘事件

### 怎么样在 canvas 上监听键盘事件呢？

你可以通过两种很简单的方法监听它们：

1. 全局监听 window 对象的事件
2. 给 stage container 设置 tabIndex 属性使它可以被 focus, 然后监听它上面的事件。
说明：点击 stage 使它被 focus, 使用键盘方向键移动图形



<iframe src="/downloads/code/events/Keyboard_Events.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@4.0.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Canvas Keyboard events Demo</title>
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
      var stage = new Konva.Stage({
        container: 'container',
        width: window.innerWidth,
        height: window.innerHeight
      });

      var layer = new Konva.Layer();
      stage.add(layer);

      var circle = new Konva.Circle({
        x: stage.width() / 2,
        y: stage.height() / 2 + 10,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
      });

      layer.add(circle);
      layer.draw();

      var container = stage.container();

      // make it focusable

      container.tabIndex = 1;
      // focus it
      // also stage will be in focus on its click
      container.focus();

      const DELTA = 4;

      container.addEventListener('keydown', function(e) {
        if (e.keyCode === 37) {
          circle.x(circle.x() - DELTA);
        } else if (e.keyCode === 38) {
          circle.y(circle.y() - DELTA);
        } else if (e.keyCode === 39) {
          circle.x(circle.x() + DELTA);
        } else if (e.keyCode === 40) {
          circle.y(circle.y() + DELTA);
        } else {
          return;
        }
        e.preventDefault();
        layer.batchDraw();
      });
    </script>
  </body>
</html>
```