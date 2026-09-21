---
title: '键盘事件'
description: 'Konva 没有内置 keydown、keyup 键盘事件。本文说明如何借助容器的 tabIndex 与 DOM 事件监听，在 Canvas 上响应键盘输入。'
sidebar_position: 15
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
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
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

## 常见问题

### 为什么给 Konva 节点绑 keydown 没反应？

Konva 节点不是 DOM 元素，收不到键盘事件。键盘事件只会派发给
**当前拥有焦点的 DOM 元素**，而 `<canvas>` 默认不可获得焦点。

所以要给舞台容器加 `tabIndex` 让它可聚焦，再把监听绑在容器或 `window` 上：

```js
const container = stage.container();
container.tabIndex = 1;
container.focus();
container.addEventListener('keydown', handler);
```

### 绑在 container 上和绑在 window 上有什么区别？

绑在容器上只有画布获得焦点时才响应，用户点了页面别处就不再触发。
这是符合直觉的行为——编辑器里按 Delete 应该删画布上选中的图形，
而不是在用户正在填写表单时误删。

绑在 `window` 上则全局生效，适合应用型页面（整页就是一个画布）。
但要自己判断焦点是否在输入框里，否则用户打字会触发快捷键。

### 怎么实现「选中图形后按 Delete 删除」？

Konva 没有内置选中态，需要自己维护。通常是一个变量记住当前选中的节点，
点击时更新它，键盘事件里读它：

```js
let selected = null;
shape.on('click', () => { selected = shape; });
container.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' && selected) {
    selected.destroy();
    selected = null;
  }
});
```

如果用了 [Transformer](/docs/select-and-transform/basic-demo)，
选中态已经在 `tr.nodes()` 里，直接读它即可，不必另建变量。

## 与其他方案的取舍

**绑在容器上**语义最准确：键盘操作作用于「当前正在操作的画布」。
多画布页面、或者画布只是页面的一部分时，这是唯一正确的选择。
代价是要处理焦点——用户必须先点一下画布，快捷键才生效，
这一点最好在界面上有所提示。

**绑在 window 上**省掉了焦点管理，全屏画布应用里更省事。
但必须自己排除输入场景：

```js
const tag = document.activeElement?.tagName;
if (tag === 'INPUT' || tag === 'TEXTAREA') return;
```

漏掉这个判断，用户在输入框里按 Delete 会连画布上的图形一起删掉，
这类 bug 在测试中很容易被漏过，因为开发时很少同时用到两者。
