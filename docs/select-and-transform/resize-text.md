---
title: '缩放文字'
description: 'Konva Transformer 改的是 scale，直接缩放文字会把字形拉变形。正确做法是在 transform 事件里把缩放量折算成 width 并复位 scaleX。'
sidebar_position: 12
---

Transformer 改的是 `scaleX` / `scaleY`。对文字来说这意味着字形被拉伸，而不是重新排版。

## 用法

把缩放量折算成宽度，然后把 `scaleX` 复位：

```js
const tr = new Konva.Transformer({
  nodes: [text],
  // 只留左右锚点：这里改的是宽度，不是字号
  enabledAnchors: ['middle-left', 'middle-right'],
});
layer.add(tr);

text.on('transform', () => {
  text.setAttrs({
    width: text.width() * text.scaleX(),
    scaleX: 1,
  });
});
```

这样拖动时文字会按新宽度重新换行，笔画粗细保持不变。

<iframe src="/downloads/code/select_and_transform/Resize_Text.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Resize_Text.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Resize Text Demo</title>
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
      width: window.innerWidth,
      height: window.innerHeight
    });
    var layer = new Konva.Layer();
    stage.add(layer);

    var text = new Konva.Text({
      x: 60, y: 90,
      text: '拖动左右两侧的锚点，文字会重新换行而不是被拉扁。Konva 中文文档。',
      fontSize: 20,
      width: 260,
      draggable: true
    });
    layer.add(text);

    var tr = new Konva.Transformer({
      nodes: [text],
      // 只留左右锚点：这里改的是宽度，不是字号
      enabledAnchors: ['middle-left', 'middle-right']
    });
    layer.add(tr);

    // 必须在 transform 而不是 transformend 里复位，
    // 否则拖动过程中看到的是被拉伸变形的中间态
    text.on('transform', function () {
      text.setAttrs({
        width: text.width() * text.scaleX(),
        scaleX: 1
      });
    });

    layer.add(new Konva.Text({
      x: 20, y: 20, fontSize: 14, fill: '#333',
      text: '拖动左右锚点改变宽度，文字重新排版。'
    }));
  </script>

</body>
</html>
```

## 常见问题

### 为什么不能让文字跟着 scale？

因为那是把字形整个拉伸，不是改字号。横向拉长时，竖笔画会跟着变粗、字变扁，
中文尤其明显——汉字的横竖笔画比例被破坏后很容易看出失真。

而且 `scaleX` 不为 1 时，`text.width()` 返回的是缩放前的值，
后续任何依赖宽度的计算都会算错。

### 复位放在 transformend 行不行？

不行。放在 `transformend` 意味着整个拖动过程中用户看到的都是被拉伸变形的中间态，
松手瞬间才「啪」地恢复正常，观感很差。

必须放在 `transform` 里，每一帧都折算复位，用户看到的才是连续的重新排版。
这依赖 Konva 10.4.0 起的行为修正——此前在 `transform` 回调里改节点属性
会被下一帧覆盖。

### 我想改字号而不是宽度，怎么办？

同样的思路，换个属性：

```js
text.on('transform', () => {
  text.setAttrs({
    fontSize: text.fontSize() * text.scaleY(),
    scaleX: 1,
    scaleY: 1,
  });
});
```

注意两个 scale 都要复位，并且这时应当保留四角锚点、开启 `keepRatio`——
改字号是等比操作，只留左右锚点就没有意义了。

## 与其他方案的取舍

改宽度和改字号是两种不同的产品语义，先想清楚用户期望哪一种：

- **改宽度**：文字重新换行，字号不变。像在文档编辑器里拖动文本框边界。
  适合段落文字。只留左右锚点，视觉上就在提示「这里只改宽度」。
- **改字号**：整体变大变小，行数可能不变。像在设计工具里缩放一个标题。
  适合单行标题。保留四角锚点并开启等比。

两种都做也可以——角锚点改字号、边锚点改宽度，在 `transform` 里根据
`tr.getActiveAnchor()` 分支处理。但这会让交互变复杂，除非产品确实需要，
否则选定一种更好。
