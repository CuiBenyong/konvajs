---
title: '文字编辑与中文输入法'
description: 'Konva 文字就地编辑要叠一个 textarea。中文输入法下，确认候选词的回车会被误当成提交；Safari 还需额外判断 keyCode 229。'
sidebar_position: 2
---

Canvas 里没有光标、选区，也没有输入法候选窗。要让用户直接编辑画布上的文字，
通行的做法是：编辑时在文字正上方叠一个 `textarea`，编辑完再把内容写回 `Konva.Text`。

这套做法用英文测试总是没问题，一到中文输入法就出错：**打拼音时按回车选候选词，
编辑框直接关了**，上屏的是一串字母。

## 用法

双击文字进入编辑。演示左上角显示输入法当前是不是在组合输入，
可以对照着看回车什么时候被忽略、什么时候被当成提交：

<iframe src="/downloads/code/china/Ime_Text_Editing.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * china/Ime_Text_Editing.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva IME Text Editing Demo</title>
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
    var FONT = '"PingFang SC", "Microsoft YaHei", sans-serif';

    var stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight
    });
    var layer = new Konva.Layer();
    stage.add(layer);

    var text = new Konva.Text({
      x: 60, y: 90,
      text: '双击编辑这段文字，试试用中文输入法打字，候选词上屏时按回车。',
      fontSize: 20,
      fontFamily: FONT,
      lineHeight: 1.4,
      padding: 4,
      width: 280,
      rotation: 4,
      draggable: true
    });
    layer.add(text);

    var tr = new Konva.Transformer({
      nodes: [text],
      enabledAnchors: ['middle-left', 'middle-right']
    });
    layer.add(tr);

    // 改宽度而不是拉伸字形，见「缩放文字」一页
    text.on('transform', function () {
      text.setAttrs({ width: text.width() * text.scaleX(), scaleX: 1 });
    });

    var imeStatus = new Konva.Text({
      x: 20, y: 20, fontSize: 14, fill: '#333', fontFamily: FONT,
      text: '输入法：空闲'
    });
    layer.add(imeStatus);

    function setStatus(ime, enter) {
      imeStatus.text('输入法：' + ime + (enter ? '    最近一次回车：' + enter : ''));
    }

    var editing = null;

    text.on('dblclick dbltap', function () {
      if (editing) return;
      startEditing();
    });

    function startEditing() {
      text.hide();
      tr.hide();

      var box = stage.container().getBoundingClientRect();
      var pos = text.absolutePosition();
      var scale = text.getAbsoluteScale();

      var area = document.createElement('textarea');
      document.body.appendChild(area);
      area.value = text.text();

      // 位置：舞台容器在页面中的位置 + 节点在舞台中的绝对位置 + 页面滚动
      area.style.position = 'absolute';
      area.style.left = (box.left + pos.x + window.scrollX) + 'px';
      area.style.top = (box.top + pos.y + window.scrollY) + 'px';
      // 尺寸与排版：宽度、字号、行高、内边距、字体都要和 Konva.Text 一致，
      // 否则编辑态与显示态的换行不同，退出编辑时文字会「跳」一下
      area.style.width = (text.width() * scale.x) + 'px';
      area.style.height = (text.height() * scale.y + 8) + 'px';
      area.style.fontSize = (text.fontSize() * scale.y) + 'px';
      area.style.lineHeight = String(text.lineHeight());
      area.style.fontFamily = text.fontFamily();
      area.style.padding = (text.padding() * scale.x) + 'px';
      area.style.margin = '0';
      area.style.border = '1px dashed #3b82f6';
      area.style.outline = 'none';
      area.style.background = 'rgba(255,255,255,0.9)';
      area.style.color = text.fill();
      area.style.resize = 'none';
      area.style.overflow = 'hidden';
      area.style.boxSizing = 'border-box';
      area.style.transformOrigin = 'left top';
      area.style.transform = 'rotate(' + text.getAbsoluteRotation() + 'deg)';

      // 必须在双击事件的同步调用栈里 focus，iOS 才会弹出软键盘
      area.focus();
      area.select();

      area.addEventListener('compositionstart', function () {
        setStatus('组合中');
      });
      area.addEventListener('compositionend', function () {
        setStatus('空闲');
      });

      area.addEventListener('keydown', function (e) {
        // 输入法组合输入期间的按键一律交给输入法。
        // Safari 在确认候选词的那次回车上 isComposing 可能已是 false，
        // 但 keyCode 仍为 229，两个条件缺一不可。
        if (e.isComposing || e.keyCode === 229) {
          if (e.key === 'Enter') setStatus('组合中', '已忽略（在选候选词）');
          return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          setStatus('空闲', '已提交');
          finish(true);
        } else if (e.key === 'Escape') {
          finish(false);
        }
      });

      area.addEventListener('input', function () {
        area.style.height = 'auto';
        area.style.height = area.scrollHeight + 'px';
      });

      area.addEventListener('blur', function () {
        finish(true);
      });

      editing = area;
    }

    function finish(commit) {
      var area = editing;
      if (!area) return;
      editing = null;
      if (commit) text.text(area.value);
      area.remove();
      text.show();
      tr.show();
      tr.forceUpdate();
    }
  </script>

</body>
</html>
```

三处要点：

1. **定位**。舞台容器在页面里的位置（`getBoundingClientRect()`），加上节点在舞台里的绝对位置
   （`absolutePosition()`），再加页面滚动量。旋转用 `getAbsoluteRotation()` 配合
   `transform-origin: left top`，缩放用 `getAbsoluteScale()`。
2. **排版对齐**。宽度、字号、行高、内边距、字体五项都要和 `Konva.Text` 一致，
   否则编辑态和显示态的换行不同，退出编辑的那一刻文字会跳一下。Konva 10 起
   文本定位与 DOM/CSS 对齐，两者叠在一起时比旧版本更容易对准。
3. **同步 focus**。`area.focus()` 直接写在双击回调里，不能放进 `setTimeout` 或 `Promise` 之后。

## 输入法下的回车

中文、日文、韩文输入法都是**组合输入**：打出的拼音先停在候选状态，
选中候选词才真正上屏。组合期间的按键同样会触发 `keydown`，
只是事件的 `isComposing` 为 `true`。

只判断 `isComposing` 还不够。Safari 在**确认候选词的那一次回车**上，
`keydown` 触发时组合已经结束，`isComposing` 为 `false`，但 `keyCode` 仍是 `229`
（「这次按键由输入法处理」的约定值）。所以两个条件缺一不可：

```js
// ❌ 选候选词的回车会被当成提交
area.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') finish();
});

// ✅
area.addEventListener('keydown', (e) => {
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    finish();
  }
});
```

`keyCode` 已被标为废弃，其他按键判断都应该用 `e.key`。这里是唯一还需要它的地方。

`compositionstart` / `compositionend` 两个事件可以用来做界面提示（比如组合期间暂停自动保存），
但不要靠它们判断回车：在不同浏览器里，`compositionend` 与那次回车的 `keydown`
谁先谁后并不一致。

## 国内环境注意事项

搜狗、百度、微信键盘、系统自带拼音这些国内常用输入法，**默认全部走组合输入**，
连输入英文单词时也可能先进入候选状态。只要读者用中文输入法，上面的回车问题就一定会遇到，
而开发时用英文键盘测试是发现不了的。

手机上还有两件事要注意。第一，iOS 只允许在用户手势的**同步调用栈**里用 `focus()` 弹出软键盘，
异步调用会让输入框获得焦点却不弹键盘，用户看到的是「点了没反应」。
第二，软键盘弹出会挤压可视区域，页面可能被整体上推，textarea 的定位随之失准。
应当监听 `window.visualViewport` 的 `resize`，在回调里按上面的公式重算位置。

另外，textarea 与 `Konva.Text` 的字体必须是同一个。Web 字体还没加载完时，两者可能分别落在不同的回退字体上，
编辑态和显示态的换行就对不上，见[中文字体加载](/docs/china/chinese-fonts)。

## 常见问题

### 为什么打拼音时按回车，编辑框直接关了？

你的 `keydown` 处理把输入法用来确认候选词的回车当成了「提交」。
在处理函数最前面加上 `if (e.isComposing || e.keyCode === 229) return;`，
组合输入期间的按键一律交给输入法。

### 编辑时文字和输入框对不齐怎么办？

逐项核对五个量：绝对位置、绝对缩放、绝对旋转、`padding`、`lineHeight`。
最常漏的是缩放——舞台或父级 Group 被缩放后，`text.fontSize()` 还是原值，
textarea 的字号要乘上 `getAbsoluteScale().y`。宽度拖动后的重排写法见
[缩放文字](/docs/select-and-transform/resize-text)。

### 能不能不用 textarea，直接在画布里处理键盘输入？

技术上可以监听键盘自己拼字，但会失去输入法候选窗、光标与选区、系统的复制粘贴和撤销、
屏幕阅读器支持。中文用户离不开输入法候选窗，自己实现代价极高。
键盘事件本身的监听方式见[键盘事件](/docs/events/keyboard-events)。
