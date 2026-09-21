---
title: '拖拽线'
description: '拖拽 Konva 线条：实例化 Konva.Line 时设置 draggable 为 true，或调用 draggable() 方法，同时支持桌面与移动端。'
sidebar_position: 4
---

拖动线条和拖动别的图形没有区别，难点在于线条很难被点中，以及「拖整条」与「拖顶点」是两回事。

## 用法

要使用`Konva`拖放线，我们在实例化线时可以设置`draggable`属性
，设置对象的值为`true`，或者我们可以使用`draggable（）`方法。
<iframe src="/downloads/code/drag_and_drop/Drag_a_Line.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Drag and Drop a Line Demo</title>
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

    // complex dashed and dotted line
    var blueLine = new Konva.Line({
        y: 50,
        points: [10, 70, 40, 23, 150, 60, 250, 20],
        stroke: 'blue',
        strokeWidth: 10,
        lineCap: 'round',
        lineJoin: 'round',
        /*
        * line segments with a length of 29px with a gap
        * of 20px followed by a line segment of 0.001px (a dot)
        * followed by a gap of 20px
        */
        dash: [29, 20, 0.001, 20],
        draggable: true
    });

    layer.add(blueLine);
    stage.add(layer);
</script>

</body>
</html>
```

## 常见问题

### 细线条为什么拖不动？

命中区域只有描边所占的那几个像素。`strokeWidth: 1` 的线，用户要精确点在
这一个像素上才能拖，实际上几乎做不到。

解决办法是放大命中范围而不改变外观：

```js
line.hitStrokeWidth(20);
```

这在流程图连线、图表辅助线这类场景里基本是必备设置。
更精细的控制见[自定义事件监听范围](/docs/events/custom-hit-region)。

### 拖动线条时 points 会变吗？

不会。拖拽改的是节点的 `x`/`y`，`points` 数组原封不动。

这意味着整条线平移，形状不变。如果你想根据拖拽结果更新数据，
要把 `x`/`y` 的偏移量加到每个点上，而不是直接读 `points`。

### 怎么实现拖动单个顶点？

`Konva.Line` 本身做不到——它是一个整体。标准做法是给每个顶点放一个小圆作为锚点，
拖动锚点时更新线的 `points`：

```js
anchor.on('dragmove', () => {
  const pts = line.points().slice();
  pts[i * 2] = anchor.x();
  pts[i * 2 + 1] = anchor.y();
  line.points(pts);
});
```

注意必须**整个数组重新赋值**。对 `line.points()` 返回的数组原地修改不会触发重绘，
Konva 10.4.0 起未设置过的数组属性每次读取还会返回新数组，原地改的根本不是同一份。

## 与其他方案的取舍

**整体拖拽**适合线条位置可调但形状固定的场景，例如可移动的参考线、分隔线。
实现只要一个 `draggable`。

**顶点编辑**适合形状本身就是用户要编辑的内容——折线标注、多边形绘制、路径调整。
代价是要自己维护锚点：创建、跟随、增删、在不编辑时隐藏。锚点数量多时还要考虑
把它们放进独立图层，避免每次拖动都重绘主内容。

两者可以叠加：平时整条可拖，双击进入编辑态显示顶点锚点。这是矢量编辑器的常见模式，
但要处理好两种模式的切换与视觉提示，否则用户会困惑。
