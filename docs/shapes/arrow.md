---
title: 'Arrow 箭头'
description: '用 Konva.Arrow 绘制箭头：points 定义路径，pointerLength 与 pointerWidth 控制箭头大小，支持双向箭头。'
sidebar_position: 19
---

箭头是带箭头尖的线条，`Konva.Arrow` 继承自 `Konva.Line`，`points` 的用法完全一致。

## 用法

要使用`Konva`创建箭头, 我们可以实例化一个`Konva.Arrow()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Arrow.html" target="_blank">Konva.Arrow</a>文档

<iframe src="/downloads/code/shapes/Arrow.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Arrow Demo</title>
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

    var arrow = new Konva.Arrow({
      x: stage.getWidth() / 4,
      y: stage.getHeight() / 4,
      points: [0,0, width / 2, height / 2],
      pointerLength: 20,
      pointerWidth : 20,
      fill: 'black',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(arrow);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 箭头画在哪一端？

默认画在 `points` 最后一段的末端，方向由最后两个点决定。

需要双向箭头时设置 `pointerAtBeginning: true`，起点也会长出箭头。
只要起点箭头、不要终点的，再把 `pointerAtEnding` 设为 `false`。

### 把线加粗之后箭头显得很小？

`pointerLength` 与 `pointerWidth` 是独立的固定值，**不会**随 `strokeWidth` 自动缩放。

所以改粗线条后必须同步调大这两个值，否则箭头相对线身会越来越不成比例。
如果线宽是动态的，按 `strokeWidth` 的倍数计算箭头尺寸是个实用做法。

### 折线首尾重合时箭头方向乱跳？

最后两个点重合时，方向向量为零，无法确定箭头朝向。这在「双击结束绘制」的
交互里很常见——双击会产生两个坐标相同的点。

Konva 10.6.0 把这种情况的行为固定为水平指向，不再随机。
更彻底的解决办法是在提交折线前去掉重复的尾点。

## 与其他方案的取舍

`Arrow` 的核心便利是箭头自动跟随线段方向——折线怎么转，箭头就怎么转，
不需要自己算角度。做流程图连线、标注指引时用它。

自己用 [`Line`](/docs/shapes/line-simple-line) 加一个三角形 `Line` 也能拼出箭头，
好处是箭头形状完全自由（可以做成空心的、燕尾的、圆头的），
代价是线段方向一变就要重算三角形的三个顶点和旋转角。

需要曲线箭头时两者都不够用——`Arrow` 只支持直线段。这种情况下用
[`Path`](/docs/shapes/path) 画曲线，再在末端单独放一个旋转好的三角形。
