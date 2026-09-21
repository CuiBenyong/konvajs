---
title: 'Star 星形'
description: '用 Konva.Star 绘制星形：numPoints 指定角数，innerRadius 与 outerRadius 分别定义内外顶点到中心的距离。'
sidebar_position: 13
---

星形由角数和内外半径定义，是少数几个 Konva 内置的复合多边形之一。

## 用法

要使用`Konva`添加星形, 我们可以实例化一个`Konva.Star()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Star.html" target="_blank">Konva.Star</a>文档

<iframe src="/downloads/code/shapes/Star.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Star Demo</title>
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

    var star = new Konva.Star({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      numPoints: 6,
      innerRadius: 40,
      outerRadius: 70,
      fill: 'yellow',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(star);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### numPoints 是顶点数还是角数？

是**角数**。实际顶点数是它的两倍——每个角由一个外顶点和一个内顶点组成，交替排列。

`numPoints: 5` 得到常见的五角星，共 10 个顶点。想数清楚绘制成本时按两倍算，
不过星形的顶点数通常很少，这方面不构成负担。

### 星形看起来不够尖，怎么调？

尖锐程度由 `innerRadius` 与 `outerRadius` 的比值决定，比值越小越尖。
常见的五角星比值约为 0.38，比值接近 1 时星形会退化成一个近似正多边形的轮廓。

注意 `outerRadius` 是外接圆半径，不是星形的「宽度」——角数变化时，
相同 `outerRadius` 下星形的视觉大小也会变。

### 星形默认朝向是哪边？

第一个外顶点朝上（12 点方向），与 [`RegularPolygon`](/docs/shapes/regular-polygon)
一致。需要其他朝向用 `rotation` 调整。

`x`、`y` 是星形中心，旋转默认绕中心进行，不需要额外设置 `offset`。

## 与其他方案的取舍

规则星形用 `Star`，它只要三个参数，绘制路径也由 Konva 算好。

需要不规则星形——比如每个角长短不一、或者角的位置不均匀分布——`Star` 就做不到了，
这时用 [`Konva.Line`](/docs/shapes/line-polygon) 配合 `closed: true`，
自己算出所有顶点坐标传给 `points`。代价是顶点计算要自己维护，
改角数时得重算整个数组。

如果星形形状固定不变，还有第三条路：用矢量工具画好导出 SVG，
把 `d` 属性贴进 [`Konva.Path`](/docs/shapes/path)。这适合美术提供的异形星标。
