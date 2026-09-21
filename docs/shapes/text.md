---
title: 'Text 文字'
description: '用 Konva.Text 在 Canvas 上绘制文本：支持 fontSize、fontFamily、fontStyle、align、lineHeight、width 自动换行与 ellipsis 省略号。'
sidebar_position: 11
---

文本是 Canvas 上最需要小心的元素——字体、换行、度量都不像 DOM 那样由浏览器代劳。

## 用法

要使用`Konva`添加文本, 我们可以实例化一个`Konva.Text()`对象.

有关属性和方法的完整列表,请参阅 <a href="https://konvajs.org/api/Konva.Text.html" target="_blank">Konva.Text文档</a>

<iframe src="/downloads/code/shapes/Text.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Text Demo</title>
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
      width: 340,
      height: 300
    });

    var layer = new Konva.Layer();

    var simpleText = new Konva.Text({
      x: stage.getWidth() / 2,
      y: 15,
      text: 'Simple Text',
      fontSize: 30,
      fontFamily: 'Calibri',
      fill: 'green'
    });

    // to align text in the middle of the screen, we can set the
    // shape offset to the center of the text shape after instantiating it
    simpleText.setOffset({
      x: simpleText.getWidth() / 2
    });

    // since this text is inside of a defined area, we can center it using
    // align: 'center'
    var complexText = new Konva.Text({
      x: 20,
      y: 60,
      text: 'COMPLEX TEXT\n\nAll the world\'s a stage, and all the men and women merely players. They have their exits and their entrances.',
      fontSize: 18,
      fontFamily: 'Calibri',
      fill: '#555',
      width: 300,
      padding: 20,
      align: 'center'
    });

    var rect = new Konva.Rect({
      x: 20,
      y: 60,
      stroke: '#555',
      strokeWidth: 5,
      fill: '#ddd',
      width: 300,
      height: complexText.getHeight(),
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: [10, 10],
      shadowOpacity: 0.2,
      cornerRadius: 10
    });

    // add the shapes to the layer
    layer.add(simpleText);
    layer.add(rect);
    layer.add(complexText);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 逐字渲染

Konva 10 提供 `charRenderFunc`，可以对每个字符单独控制绘制。回调里设置的
`fillStyle` / `strokeStyle` 对该字符生效，优先级高于图形本身的属性：

```js
const text = new Konva.Text({
  x: 20,
  y: 20,
  text: '逐字上色',
  fontSize: 40,
  // 回调只接收一个对象参数，不是 (ctx, charInfo)
  charRenderFunc: ({ char, index, x, y, context }) => {
    context.fillStyle = index % 2 === 0 ? '#4078c0' : '#c04040';
    context.fillText(char, x, y);
  },
});
```

回调参数的完整字段：

| 字段 | 含义 |
|---|---|
| `char` | 当前字素 |
| `index` | 全局字素索引，**跨行累加**，不是行内位置 |
| `x` / `y` | 该字素的绘制坐标 |
| `lineIndex` | 所在行号，从 0 开始 |
| `column` | 行内列号 |
| `isLastInLine` | 是否是该行最后一个字素 |
| `width` | 该字素的测量宽度 |
| `context` | Konva 的 `Context` 包装对象，`fillText`、`fillStyle` 等可直接用 |

要按行内位置做效果，用 `column` 而不是 `index`。

## 字素感知排版

Konva 10.4.0 起，文本排版按字素（grapheme）而非 UTF-16 码元处理。这解决了
中文与表情场景下的两类老问题：国旗 emoji 与 ZWJ 组合表情（如 👨‍👩‍👧）不会再被
从中间拆开，`letterSpacing` 也改为每个字素加一次间距，而不是每个码元加一次。

如果你的布局依赖旧的按码元计算的间距值，升级到 10.4.0 后含 emoji 的文本
宽度会变化，需要重新确认排版。

## 常见问题

### 中文长文本为什么不换行？

`Konva.Text` 只在设置了 `width` 之后才会自动换行。没有 `width` 时，整段文字排成一行，
超出画布的部分直接看不见，也不会有任何提示。

设了 `width` 还想在超长时截断，再加 `ellipsis: true`，配合 `height` 限制行数。

### fontFamily 写「微软雅黑」在同事机器上不生效？

Canvas 的字体解析走的是系统字体，不同操作系统装的中文字体不一样：
`Microsoft YaHei` 在 macOS 上通常没有，`PingFang SC` 在 Windows 上也没有。

正确做法是给一串回退列表，例如
`fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif'`，
让每个平台都能落到一个实际存在的中文字体上。只写一个字体名，
在缺少它的系统上会回退到默认字体，字宽随之改变，布局也跟着乱。

### 能不能在一段文字里混用两种颜色或字号？

`Konva.Text` 不支持富文本，一个节点只有一套样式。

需要混排有两条路：拆成多个 `Konva.Text` 节点自己排版（要处理换行和对齐，
比较麻烦但可控），或者用 `charRenderFunc` 逐字控制样式（见上面的「逐字渲染」，
适合按位置规律变化的效果，不适合任意富文本）。

## 国内环境注意事项

Web Font 在国内加载慢，会带来一个 DOM 上没有的问题：Canvas 没有 CSS 的
`font-display` 机制。浏览器会先用回退字体把文字画到画布上，等自定义字体加载完成后，
**已经画上去的内容不会自动重绘**——画面就一直停留在回退字体的样子，
直到下一次 `layer.draw()`。

可靠的做法是等字体就绪再绘制：

```js
await document.fonts.ready;
// 或者只等某一个字体
await document.fonts.load('16px "Source Han Sans"');
layer.draw();
```

另一个后果是布局。回退字体与目标字体的字宽不同，依赖 `text.width()` 做的定位、
换行、居中计算，在字体切换前后会得到两组不同的结果。如果必须先渲染再替换字体，
记得在字体就绪后重新执行一遍布局计算，而不只是 `draw()`。
