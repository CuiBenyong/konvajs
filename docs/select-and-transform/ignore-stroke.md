---
title: '描边不随缩放变粗'
description: '缩放时描边会跟着变粗。两种解法：在 transformend 里把 scale 折算进 width/height 后复位，或直接设 strokeScaleEnabled 为 false。'
sidebar_position: 13
---

`strokeWidth: 5` 的图形放大两倍后，描边看起来就是 10。多数时候这不是你想要的。

## 用法

有两种做法，语义不同。

**做法一：变换结束后把 scale 折算进尺寸再复位**

```js
rect.on('transformend', () => {
  const scaleX = rect.scaleX();
  const scaleY = rect.scaleY();
  rect.scaleX(1);
  rect.scaleY(1);
  // Math.max 不是装饰：快速拖过头时宽高会变成极小值甚至负数
  rect.width(Math.max(5, rect.width() * scaleX));
  rect.height(Math.max(5, rect.height() * scaleY));
});
```

**做法二：直接关掉描边缩放**

```js
const rect = new Konva.Rect({
  // ...
  strokeScaleEnabled: false,
});
```

<iframe src="/downloads/code/select_and_transform/Ignore_Stroke.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Ignore_Stroke.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Ignore Stroke Demo</title>
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

    // 做法一：变换结束后把 scale 折算进 width/height 再复位
    var rect1 = new Konva.Rect({
      x: 60, y: 100, width: 100, height: 100,
      fill: '#5aa469', stroke: 'black', strokeWidth: 5, draggable: true
    });
    layer.add(rect1);
    layer.add(new Konva.Transformer({ nodes: [rect1] }));

    rect1.on('transformend', function () {
      var scaleX = rect1.scaleX();
      var scaleY = rect1.scaleY();
      rect1.scaleX(1);
      rect1.scaleY(1);
      // Math.max 不是装饰：快速拖过头时宽高会变成极小值甚至负数
      rect1.width(Math.max(5, rect1.width() * scaleX));
      rect1.height(Math.max(5, rect1.height() * scaleY));
    });

    // 做法二：直接关掉描边缩放
    var rect2 = new Konva.Rect({
      x: 280, y: 100, width: 100, height: 100,
      fill: '#c04040', stroke: 'black', strokeWidth: 5,
      strokeScaleEnabled: false, draggable: true
    });
    layer.add(rect2);
    layer.add(new Konva.Transformer({ nodes: [rect2] }));

    layer.add(new Konva.Text({
      x: 20, y: 20, fontSize: 14, fill: '#333',
      text: '左：transformend 折算复位（scale 始终为 1）\n右：strokeScaleEnabled 为 false（scale 不复位）\n两者缩放后描边粗细都不变。'
    }));
  </script>

</body>
</html>
```

## 常见问题

### 两种做法该选哪个？

看你需不需要节点的属性反映真实尺寸。

做法一让节点始终保持 `scale: 1`，`width()` 读出来就是真实宽度。
要把尺寸存回服务端、或者后续有依赖宽高的计算时，选它。

做法二只是显示上不缩放描边，`scaleX` 仍然不是 1，`width()` 返回的是缩放前的值。
纯展示、不关心属性值时选它，代码最短。

### Transformer 上的 ignoreStroke 是同一个东西吗？

不是，名字相近但管的事完全不同，这一点很容易混。

图形自身的 `strokeScaleEnabled` 控制**描边是否跟随缩放变粗**。

Transformer 的 `ignoreStroke` 控制**控制柄的包围盒是否把描边计算在内**。
设为 `true` 时控制柄贴着图形的几何边界，而不是描边外沿。
这也是[缩放尺寸限制](/docs/select-and-transform/resize-limits)里
包围盒 200 而几何宽 196 的成因。

### 两种做法能一起用吗？

技术上可以，但通常不该这么做。

两个都开时，描边既不随缩放变粗，尺寸又被折算成真实值——结果是图形越放越大，
而描边始终是原始粗细，相对比例越来越细，视觉上会显得图形「边框消失了」。

除非你明确想要「无论图形多大，描边永远 1 像素」的效果（例如技术图纸里的辅助线），
否则选一种就够。

## 与其他方案的取舍

还有第三条路：不碰描边，在 `transform` 里反向调整 `strokeWidth`，
让它始终等于 `原始值 / 当前 scale`。

这看起来更灵活，实际上是在重复 `strokeScaleEnabled` 已经做好的事，
而且要自己处理 `scaleX` 与 `scaleY` 不相等的情况——那时根本不存在一个
「正确的」描边宽度。不建议。

真正需要自定义的场景是：描边宽度要随缩放变化，但不是线性的（例如取平方根，
让大图形的边框相对细一些）。那时才值得自己算。
