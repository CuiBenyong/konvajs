---
title: '从中心缩放'
description: 'Konva Transformer 的 centeredScaling 让图形以自身中心为基准缩放，拖动任一角时向两侧同时伸缩；按住 ALT 可临时切换。'
sidebar_position: 2
---

默认缩放时对角是固定的：拖右下角，左上角不动。`centeredScaling` 把基准点换成图形中心。

## 用法

给 Transformer 设置 `centeredScaling: true` 即可：

```js
const tr = new Konva.Transformer({
  nodes: [rect],
  centeredScaling: true,
});
```

不设置这个属性时，按住 ALT 键拖动也能临时获得同样的效果。

<iframe src="/downloads/code/select_and_transform/Centered_Scaling.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Centered_Scaling.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Centered Scaling Demo</title>
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

    var rect = new Konva.Rect({
      x: 120, y: 80, width: 140, height: 100,
      fill: 'orange', stroke: 'black', strokeWidth: 2, draggable: true
    });
    layer.add(rect);

    // centeredScaling 让缩放以图形中心为基准：拖任一角，
    // 对角不再固定，图形向两侧同时伸缩
    var tr = new Konva.Transformer({
      nodes: [rect],
      centeredScaling: true
    });
    layer.add(tr);

    layer.add(new Konva.Text({
      x: 20, y: 20, fontSize: 14, fill: '#333',
      text: '拖动任一角：图形以中心为基准缩放。按住 ALT 可临时切换回默认行为。'
    }));
  </script>

</body>
</html>
```

## 常见问题

### 设了之后拖角，图形怎么往两边同时长？

这正是「以中心为基准」的含义。默认行为下对角是锚定不动的，所以图形只朝一个方向长；
以中心为基准时中心不动，四周同时伸缩，视觉上就是向两侧同时长。

如果你想要的是「中心不动」但只朝一侧长，那不是缩放能表达的，
需要在变换事件里自己调整位置。

### 不设置属性、只靠 ALT 键行不行？

桌面端可以，而且更灵活——用户自己决定什么时候要居中缩放。

但触屏上没有 ALT 键的等价操作。如果你的应用需要在移动端使用居中缩放，
必须显式设置 `centeredScaling: true`，或者提供一个界面开关让用户切换。

### 和 keepRatio 一起用会冲突吗？

不会，两者作用在不同维度：`centeredScaling` 决定缩放的基准点，
[`keepRatio`](/docs/select-and-transform/keep-ratio) 决定宽高是否联动。

两个都开时，拖角会以中心为基准等比缩放，这也是图形编辑器里最常见的组合。

## 与其他方案的取舍

也可以不用这个属性，自己在 `transform` 事件里根据缩放量反向调整 `x`、`y` 来维持中心。
但一旦图形带了 `rotation`，位置补偿就要做坐标系换算，很容易算错。

`centeredScaling` 是在变换矩阵层面处理的，旋转、多选、嵌套分组都已经考虑在内。
没有理由自己实现。

真正需要自己动手的是另一类需求：基准点既不在角上也不在中心，而在某个特定位置——
例如让图形始终以底边中点为基准向上生长，像柱状图那样。这时可以给节点设置
`offsetX` / `offsetY` 把原点挪到那个位置，缩放自然就以它为基准了，
同样不需要在事件回调里做位置补偿。
