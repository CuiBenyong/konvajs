---
title: 'Text 文字'
description: '用 Konva.Text 在 Canvas 上绘制文本：支持 fontSize、fontFamily、fontStyle、align、lineHeight、width 自动换行与 ellipsis 省略号。'
sidebar_position: 11
---
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
  charRenderFunc: (ctx, charInfo) => {
    ctx.fillStyle = charInfo.index % 2 === 0 ? '#4078c0' : '#c04040';
    ctx.fillText(charInfo.char, charInfo.x, charInfo.y);
  },
});
```

## 字素感知排版

Konva 10.4.0 起，文本排版按字素（grapheme）而非 UTF-16 码元处理。这解决了
中文与表情场景下的两类老问题：国旗 emoji 与 ZWJ 组合表情（如 👨‍👩‍👧）不会再被
从中间拆开，`letterSpacing` 也改为每个字素加一次间距，而不是每个码元加一次。

如果你的布局依赖旧的按码元计算的间距值，升级到 10.4.0 后含 emoji 的文本
宽度会变化，需要重新确认排版。

