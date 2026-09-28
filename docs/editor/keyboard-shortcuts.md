---
title: '快捷键'
description: '给 Konva 编辑器加删除、方向键微调、全选、Ctrl/Cmd 组合键：监听位置、焦点管理、跳过输入框与输入法组合输入，以及拦截浏览器默认行为。'
sidebar_position: 1
---

Konva 的事件系统只覆盖鼠标、触摸、指针这类事件，**没有键盘事件**。
快捷键要用 DOM 的 `keydown` 自己实现，难点不在监听本身，而在「什么时候不该响应」：
用户在页面上别的输入框里打字、正在用输入法选词的时候，按键都不属于画布。

## 用法

点选图形后试试 Delete、方向键、Ctrl/⌘ + A、Esc；再点进下方的输入框按 Backspace，
图形不会被删掉：

<iframe src="/downloads/code/editor/Keyboard_Shortcuts.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * editor/Keyboard_Shortcuts.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Keyboard Shortcuts Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #note {
      position: absolute;
      left: 40px;
      top: 220px;
      width: 220px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <input id="note" placeholder="在这里打字，Delete 不会删图形">
  <script>
    var FONT = '"PingFang SC", "Microsoft YaHei", sans-serif';

    var stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight
    });
    var layer = new Konva.Layer();
    stage.add(layer);

    var colors = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24'];
    colors.forEach(function (color, i) {
      layer.add(new Konva.Rect({
        name: 'item',
        x: 40 + i * 110, y: 110, width: 80, height: 80,
        fill: color, cornerRadius: 6, draggable: true
      }));
    });

    var tr = new Konva.Transformer();
    layer.add(tr);

    var hint = new Konva.Text({
      x: 20, y: 16, fontSize: 13, fill: '#333', fontFamily: FONT, lineHeight: 1.5,
      text: '点选图形（Shift 多选）后试试：Delete 删除、方向键微调（Shift ×10）、\nCtrl/⌘ + A 全选、Esc 取消选择'
    });
    var lastKey = new Konva.Text({
      x: 20, y: 64, fontSize: 13, fill: '#2563eb', fontFamily: FONT, text: '最近按键：无'
    });
    layer.add(hint, lastKey);

    // ---- 点选 ----
    stage.on('click tap', function (e) {
      if (e.target === stage) {
        tr.nodes([]);
        return;
      }
      if (!e.target.hasName('item')) return;
      var selected = tr.nodes();
      if (e.evt.shiftKey) {
        var i = selected.indexOf(e.target);
        tr.nodes(i >= 0
          ? selected.filter(function (n) { return n !== e.target; })
          : selected.concat(e.target));
      } else {
        tr.nodes([e.target]);
      }
    });

    // ---- 快捷键 ----
    // 输入法组合输入、以及页面上真正的输入框里的按键，都不属于画布
    function shouldIgnore(e) {
      var el = e.target;
      return e.isComposing || e.keyCode === 229 ||
        el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
    }

    function describe(e) {
      var parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.metaKey) parts.push('⌘');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');
      parts.push(e.key === ' ' ? 'Space' : e.key);
      return parts.join(' + ');
    }

    var ARROWS = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]
    };

    window.addEventListener('keydown', function (e) {
      if (shouldIgnore(e)) return;
      var mod = e.metaKey || e.ctrlKey; // macOS 用 ⌘，其他平台用 Ctrl
      var selected = tr.nodes();
      var handled = true;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selected.length) {
        tr.nodes([]);
        selected.forEach(function (n) { n.destroy(); });
      } else if (ARROWS[e.key] && selected.length) {
        var step = e.shiftKey ? 10 : 1;
        var d = ARROWS[e.key];
        selected.forEach(function (n) {
          n.position({ x: n.x() + d[0] * step, y: n.y() + d[1] * step });
        });
      } else if (mod && e.key.toLowerCase() === 'a') {
        tr.nodes(layer.find('.item'));
      } else if (e.key === 'Escape') {
        tr.nodes([]);
      } else {
        handled = false;
      }

      if (handled) {
        // 拦掉浏览器自己的行为：全选页面文字、方向键滚动页面等
        e.preventDefault();
        lastKey.text('最近按键：' + describe(e));
      }
    });
  </script>

</body>
</html>
```

监听放在哪里有两种选择：

- **监听 `window`**，如演示所示。用户不需要先点画布，快捷键随时可用，
  但必须用 `shouldIgnore` 过滤掉输入框和输入法的按键。适合整页就是一个编辑器的应用。
- **监听舞台容器**。给容器设 `tabIndex`，点击时让它获得焦点，只在它有焦点时响应。
  适合页面上有多个画布、或者画布只是页面一部分的情况：

  ```js
  const container = stage.container();
  container.tabIndex = 1;
  container.style.outline = 'none'; // 去掉获得焦点时的外框
  stage.on('pointerdown', () => container.focus());
  container.addEventListener('keydown', onKeyDown);
  ```

基础的键盘监听写法也可以参考[键盘事件](/docs/events/keyboard-events)。

## 组合键与默认行为

**修饰键**。macOS 上习惯用 ⌘，其他平台用 Ctrl，判断时写成 `e.metaKey || e.ctrlKey`，
不要只判断其中一个。

**按键名**。用 `e.key`（`'Delete'`、`'ArrowLeft'`、`'a'`）判断按了什么，不要用已废弃的 `e.keyCode`。
唯一的例外是输入法判断里的 `keyCode === 229`，原因见[文字编辑与中文输入法](/docs/china/ime-text-editing)。
字母键在按住 Shift 或开着大写锁定时会变成大写，比较前先 `toLowerCase()`。

**默认行为**。处理了的按键要 `e.preventDefault()`：Ctrl/⌘ + A 默认会选中整页文字，
方向键会滚动页面，Ctrl/⌘ + S 会弹出浏览器的保存网页对话框，部分旧浏览器上 Backspace 会返回上一页。
**没有处理的按键不要拦**，否则浏览器自己的快捷键（刷新、开发者工具）也会失效。

## 性能提示

按住方向键不放时，操作系统会按键盘重复速率连续触发 `keydown`，通常每秒二三十次。
每次都执行 `node.x(node.x() + 1)` 本身没有问题：Konva 的自动重绘会把同一帧内的多次修改合并成一次绘制，
不会每次按键都重画整个图层。

真正会卡的是挂在每次移动上的**额外工作**：每按一次就往撤销栈里压一份完整的 `stage.toJSON()` 快照，
或者把位置同步进 React / Vue 的状态触发整棵组件树重新渲染。这类工作应该在 `keyup` 时才做一次——
连续按住十秒方向键，历史记录里也只该多出一条「移动」。

多选时直接逐个修改 `tr.nodes()` 里的节点即可，Transformer 会跟着节点更新自己的位置，
不需要去移动 Transformer 本身。

## 常见问题

### 为什么按键没反应？

先确认监听挂在了哪里。挂在舞台容器上时，容器必须有 `tabIndex` 并且**当前有焦点**，
点一下页面别处焦点就丢了。挂在 `window` 上时，检查是不是被 `shouldIgnore` 过滤掉了——
焦点停在某个输入框里时，所有按键都会被忽略，这正是设计的行为。

### 在输入框里按 Delete，把画布上的图形删了？

`keydown` 处理函数里没有判断事件目标。在最前面加上对 `INPUT`、`TEXTAREA` 和
`isContentEditable` 的判断，目标是这些元素时直接返回。
编辑画布文字用的 textarea 也属于这种情况，不加判断的话，编辑文字时按 Backspace 会把整段文字节点删掉。

### 能不能用 Konva 的事件系统监听键盘？

不能。Konva 的 `node.on()` 只处理指针类事件，因为它需要根据坐标判断事件落在哪个图形上，
而键盘事件没有坐标。快捷键要作用在「当前选中的图形」上，
这个状态由你自己维护（演示里是 `tr.nodes()`），键盘事件用 DOM 的 `addEventListener` 监听。
