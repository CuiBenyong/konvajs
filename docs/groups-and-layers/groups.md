---
title: '分组'
description: '用 Konva.Group 把多个图形组合在一起，之后可以对整组统一平移、旋转或缩放。分组还能嵌套，形成更复杂的节点树。'
sidebar_position: 1
---

分组把多个图形组织成一个整体。它的坐标系是理解嵌套变换的关键。

## 用法

用`Konva`要将多个形状一起分组，我们可以实例化
一个`Konva.Group（）`对象，然后使用`add（）`方法向它添加图形。
当我们想要一起转换多个形状时，将形状组合在一起真的很方便。 如果我们想立刻平移，旋转或缩放多个形状。组也可以添加到其他组来创建更复杂
节点树。 有关属性和方法的完整列表，请参阅<a href="https://konvajs.org/api/Konva.Group.html" target="_blank">Konva.Group</a>文档.
<iframe src="/downloads/code/groups_and_layers/Groups.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Groups Demo</title>
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
    var width = window.innerWidth;
    var height = window.innerHeight;
    
    var stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height
    });

    var layer = new Konva.Layer();

    /*
    * create a group which will be used to combine
    * multiple simple shapes.  Transforming the group will
    * transform all of the simple shapes together as
    * one unit
    */
    var group = new Konva.Group({
        x: 120,
        y: 40,
        rotation: 20
    });

    var colors = ['red', 'orange', 'yellow'];

    for(var i = 0; i < 3; i++) {
        var box = new Konva.Rect({
            x: i * 30,
            y: i * 18,
            width: 100,
            height: 50,
            name: colors[i],
            fill: colors[i],
            stroke: 'black',
            strokeWidth: 4
        });

        group.add(box);
    }

    layer.add(group);
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 子节点的坐标是相对什么的？

相对**分组自身的原点**，不是舞台。分组移动时子节点坐标一个都不变，
这正是分组的价值所在。

要拿到子节点在舞台上的实际位置，用 `child.getAbsolutePosition()`；
要做坐标换算，用 `getAbsoluteTransform()`。

混淆这两套坐标是分组相关问题的主要来源——尤其在分组还有缩放或旋转时，
两者可能相差很远。

### 嵌套分组的变换怎么叠加？

逐层相乘。子分组的变换矩阵会与父分组的相乘，一路累积到舞台。

所以父分组 `scaleX: 2`、子分组 `scaleX: 2`，最终子节点被放大 4 倍。
透明度也是同理相乘，见[透明度](/docs/styling/opacity)。

嵌套层级深的时候，调试的办法是用 `getAbsoluteTransform().decompose()`
看最终的累积变换是什么。

### 空分组会有开销吗？

绘制上没有——没有子节点就没有东西可画。但它仍然参与场景树遍历，
`find()`、包围盒计算、变换传播都会经过它。

少量空分组无所谓。但如果你为了「预留结构」创建了成百上千个空分组，
那会让每次遍历都多走很多节点。按需创建更好。

## 性能提示

分组本身很轻，代价主要来自两处。

**层级深度**。每一层都要做一次矩阵乘法，而且 `getClientRect()`、
`getAbsolutePosition()` 这类方法要沿父链一路往上算。层级超过五六层时，
这些调用的成本开始可感知。扁平的结构总是更快。

**包围盒计算**。分组的 `getClientRect()` 要遍历全部子节点并合并它们的包围盒。
子节点很多时这是个不便宜的操作，不要放在每帧执行的回调里——在 `dragstart` 之类的时机算一次缓存起来。

**整组缓存**。如果一个分组的内容是静态的，`group.cache()` 把它渲染成一张位图，
之后移动整组只是贴图。这对「几十个图形组成的复杂图标」收益很大。
