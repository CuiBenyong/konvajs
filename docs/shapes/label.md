---
title: 'Label 标签'
description: '用 Konva.Label 创建带背景的文本标签，可组合 Konva.Tag 做出气泡提示（tooltip），支持指针方向与圆角。'
sidebar_position: 16
---

标签是「气泡框 + 文字」的组合节点，Konva 会让框自动跟随文字尺寸。

## 用法

要使用`Konva`创建标签,可用于创建带有背景,简单工具提示或带指针提示的文本. 我们可以实例化一个`Konva.Lable()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Label.html" target="_blank">Konva.Lable</a>文档

<iframe src="/downloads/code/shapes/Label.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Label Demo</title>
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

    // tooltip
    var tooltip = new Konva.Label({
        x: 170,
        y: 75,
        opacity: 0.75
    });

    tooltip.add(new Konva.Tag({
        fill: 'black',
        pointerDirection: 'down',
        pointerWidth: 10,
        pointerHeight: 10,
        lineJoin: 'round',
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffset: 10,
        shadowOpacity: 0.5
    }));

    tooltip.add(new Konva.Text({
        text: 'Tooltip pointing down',
        fontFamily: 'Calibri',
        fontSize: 18,
        padding: 5,
        fill: 'white'
    }));

    // label with left pointer
    var labelLeft = new Konva.Label({
        x: 20,
        y: 130,
        opacity: 0.75
    });

    labelLeft.add(new Konva.Tag({
        fill: 'green',
        pointerDirection: 'left',
        pointerWidth: 20,
        pointerHeight: 28,
        lineJoin: 'round'
    }));

    labelLeft.add(new Konva.Text({
        text: 'Label pointing left',
        fontFamily: 'Calibri',
        fontSize: 18,
        padding: 5,
        fill: 'white'
    }));

    // simple label
    var simpleLabel = new Konva.Label({
        x: 180,
        y: 150,
        opacity: 0.75
    });

    simpleLabel.add(new Konva.Tag({
        fill: 'yellow'
    }));

    simpleLabel.add(new Konva.Text({
        text: 'Simple label',
        fontFamily: 'Calibri',
        fontSize: 18,
        padding: 5,
        fill: 'black'
    }));

    // add the labels to layer
    layer.add(tooltip).add(labelLeft).add(simpleLabel);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 创建了 Label 却什么都不显示？

`Konva.Label` 本身只是容器，必须往里面同时 `add` 一个 `Konva.Tag`（背景框）
和一个 `Konva.Text`（文字）。少任何一个都不会显示，也没有报错。

顺序也有讲究：先 `add` Tag 再 `add` Text，否则背景会盖住文字。

### 给 Tag 设了 width 为什么没效果？

`Tag` 的尺寸是由同一个 `Label` 里的 `Text` 自动撑开的，不接受手动设置。

想让气泡更宽，改 `Text` 的 `width` 或 `padding`。`padding` 设在 `Text` 上，
它会同时撑大背景框——这正是 `Label` 相对手工组合的便利之处。

### 指针（小三角）不显示或位置不对？

`pointerDirection` 决定朝向（`up`/`down`/`left`/`right`），
但还需要配套设置 `pointerWidth` 与 `pointerHeight`，缺省时尺寸为 0，看不见。

另外 `Label` 的 `x`、`y` 指的是指针尖端的位置（有指针时），
不是气泡框的左上角——做 tooltip 跟随鼠标时这一点很有用，直接把鼠标坐标给它即可。

## 与其他方案的取舍

`Label` 的价值在于自动尺寸：文字变了，背景框跟着变，指针位置也跟着算。
做 tooltip、数据标注这类内容不固定的场景，用它省去大量手工计算。

自己用 `Konva.Group` 组合 `Rect` + `Text` 也能实现，而且样式自由度更高——
比如想要双层边框、渐变背景、或者图标加文字的复合内容，`Tag` 就不够用了。
代价是文字变化时要自己监听并重算 `Rect` 的尺寸。

判断标准很简单：内容会变就用 `Label`，样式复杂且内容固定就手工组合。
