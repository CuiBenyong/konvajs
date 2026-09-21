---
title: '全部补间动画'
description: 'Konva 全部缓动函数一览：Linear、Ease、Back、Elastic、Bounce 与 Strong 各系列的实际运动曲线对比演示。'
sidebar_position: 3
---

Konva 提供六个系列的缓动函数。其中弹性与回弹类会超出目标值，用之前要确认属性能否接受。

## 用法

本教程演示了Konva提供的所有缓动函数集，包括`Linear`, `Ease`, `Back`, `Elastic`, `Bounce`, and `Strong`。

有关所有可用的缓动函数，请访问<a href="https://konvajs.org/api/Konva.Easing.html" target="_blank">Easings文档</a>。

说明：请按“播放”按钮, 启动每个文本节点上设置的过渡动画。
<iframe src="/downloads/code/tweens/All_Easings.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva All Easings Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #buttons {
        position: absolute;
        top: 10px;
        left: 10px;
    }
    #buttons > input {
        padding: 10px;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="buttons">
      <input type="button" id="play" value="Play">
      <input type="button" id="pause" value="Pause">
      <input type="button" id="reverse" value="Reverse">
  </div>
  <script>
    var width = window.innerWidth;
    var height = 707;
    
    var stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height
    });

    var layer = new Konva.Layer();

    var easings = [
        {name: 'Linear', color:'blue'},
        {name: 'EaseIn', color:'green'},
        {name: 'EaseOut', color:'green'},
        {name: 'EaseInOut', color:'green'},
        {name: 'BackEaseIn', color:'blue'},
        {name: 'BackEaseOut', color:'blue'},
        {name: 'BackEaseInOut', color:'blue'},
        {name: 'ElasticEaseIn', color:'green'},
        {name: 'ElasticEaseOut', color:'green'},
        {name: 'ElasticEaseInOut', color:'green'},
        {name: 'BounceEaseIn', color:'blue'},
        {name: 'BounceEaseOut', color:'blue'},
        {name: 'BounceEaseInOut', color:'blue'},
        {name: 'StrongEaseIn', color:'green'},
        {name: 'StrongEaseOut', color:'green'},
        {name: 'StrongEaseInOut', color:'green'}
    ];

    var tweens = [];

    for(var n = 0; n < easings.length; n++) {
        var num = n + 1;
        var ease = easings[n];
        var text = new Konva.Text({
            x: 10,
            y: 60 + (n * 400 / easings.length),
            padding: 4,
            text: num + ') ' + ease.name,
            fontSize: 18,
            fontFamily: 'Calibri',
            fill: ease.color
        });

        layer.add(text);

        // the tween has to be created after the node has been added to the layer
        var tween = new Konva.Tween({
            node: text,
            x: 280,
            easing: Konva.Easings[ease.name],
            duration: 2
        });

        // add tween to tweens array
        tweens.push(tween);
    }

    stage.add(layer);

    // play
    document.getElementById('play').addEventListener('click', function() {
        for (var n=0; n<tweens.length; n++) {
            tweens[n].play();
        }
    }, false);

    // pause
    document.getElementById('pause').addEventListener('click', function() {
        for (var n=0; n<tweens.length; n++) {
            tweens[n].pause();
        }
    }, false);

    // reverse
    document.getElementById('reverse').addEventListener('click', function() {
        for (var n=0; n<tweens.length; n++) {
            tweens[n].reverse();
        }
    }, false);
  </script>

</body>
</html>
```

## 常见问题

### 为什么有些缓动会超出目标值？

`Back`、`Elastic`、`Bounce` 三个系列刻意设计成会「过冲」——先冲过目标再弹回来，模拟弹性和惯性。

这意味着动画中间某些帧的属性值会**大于终点值，或者小于起点值**。
`Back` 系列在起始处还会先往反方向退一点。

### 过冲会带来什么问题？

取决于被补间的属性。位置和旋转没关系，超出一点只是视觉效果。

但有取值范围的属性会出问题：`opacity` 补到 1 时过冲会超过 1，
`radius`、`width` 从小值开始可能变成负数——负半径在 Konva 10.4.0 之前
会在绘制时抛错并让整个图层后续内容消失。

给这类属性用弹性缓动前，先想清楚过冲的后果。

### 怎么在过冲时保护属性值？

用 `onUpdate` 钳制：

```js
new Konva.Tween({
  node, duration: 1, opacity: 1,
  easing: Konva.Easings.ElasticEaseOut,
  onUpdate: () => node.opacity(Math.min(1, Math.max(0, node.opacity()))),
});
```

不过更简单的办法通常是：对有范围限制的属性别用弹性缓动，
把弹性效果放在位置或缩放上。

## 与其他方案的取舍

六个系列各有适用场景：

**Linear** 匀速，用于进度条、无限循环的机械运动。

**Ease / Strong** 平滑加减速，是界面过渡的安全默认值。`Strong` 的曲线更陡，
开始和结束的速度对比更强烈。

**Back** 起步先退一点再冲出去，有「蓄力」的感觉，适合强调性的出现动画。

**Elastic** 到达后反复振荡衰减，弹性最强，用多了会显得轻浮。
适合俏皮的产品调性，不适合工具类界面。

**Bounce** 模拟落地弹跳，适合从上方掉落的元素。

选择标准不是「哪个好看」，而是它传达的物理隐喻是否与交互语义相符。
一个删除确认框用 Elastic 弹出来，观感是矛盾的。
