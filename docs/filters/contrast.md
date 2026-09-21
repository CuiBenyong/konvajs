---
title: 'Contrast 对比度'
description: 'Konva.Filters.Contrast 调整对比度，取值 −100 到 100，内部换算为 ((contrast+100)/100) 的平方；设为 −100 时画面变成纯灰而不是低对比。'
sidebar_position: 10
---

对比度滤镜以中灰（128）为轴，把每个通道向两端推开或向中间压缩。

<iframe src="/downloads/code/filters/Contrast.html" style="width: 50vw;height:300px;"></iframe>

```js
node.cache();
node.filters([Konva.Filters.Contrast]);
node.contrast(50);   // 取值 −100 ~ 100，默认 0
```

## 换算方式与边界值

Konva 内部先把 `contrast` 换算成一个乘数：

```js
const adjust = Math.pow((contrast + 100) / 100, 2);
```

然后对每个通道做「归一化 → 减 0.5 → 乘 adjust → 加 0.5 → 还原」。

这个公式有两个值得注意的端点：

**`contrast(0)`** → `adjust = 1`，画面不变。这是默认值。

**`contrast(-100)`** → `adjust = 0`。每个通道都被压成 0.5，
也就是 **`rgb(128,128,128)` 纯灰**——整张图变成一块均匀的灰色，
而不是很多人预期的"对比度很低但还能看出内容"。

这是一个容易写出 bug 的地方：如果你把滑块范围直接设成 −100 到 100，
用户拖到最左边会得到一片灰，看起来像程序崩了。
实践中把下限设在 −90 左右更合理。

**`contrast(100)`** → `adjust = 4`，对比度大幅提高，
多数像素被推到 0 或 255，图像严重过曝/死黑。

## 常见问题

### 为什么是平方而不是线性？

因为人对对比度变化的感知不是线性的。平方让滑块在中间区段的变化更细腻，
两端更激进，手感上比线性映射自然。

副作用是**负值区间的变化远比正值区间剧烈**：
从 0 到 −50 时 `adjust` 从 1 降到 0.25，画面迅速发灰；
从 0 到 +50 时 `adjust` 只从 1 升到 2.25。
如果你要做一个对称的滑块，视觉上会觉得往左拖"更有效"。

### 对比度和亮度该用哪个？

看你要解决什么问题：

- 整体偏暗或偏亮 → [`Brightness`](/docs/filters/brightness)，它是整体缩放。
- 灰蒙蒙、层次不分明 → `Contrast`，它拉开明暗差距。
- 褪色、颜色不鲜艳 → [`HSV`](/docs/filters/hsv) 的 `saturation`。
- 想把褪色的图恢复到满量程 → [`Enhance`](/docs/filters/enhance)，
  它按实际的通道范围自动拉伸，不需要手调。

### 能同时用对比度和亮度吗？

可以，把两个滤镜都放进 `filters()` 数组：

```js
node.cache();
node.filters([Konva.Filters.Brightness, Konva.Filters.Contrast]);
node.brightness(1.2);
node.contrast(30);
```

**顺序有影响**——数组里靠前的先执行，后一个作用在前一个的结果上。
先提亮再加对比，和先加对比再提亮，出来的画面不一样。
详见[滤镜叠加](/docs/filters/multiple-filters)。

## 性能提示

`Contrast` 每像素要做三次除法、三次乘法、三次加法和六次比较，
比 `Brightness` 贵一些，但仍属于逐像素、无邻域采样的廉价滤镜，
成本随缓存面积线性增长。

真正的开销在 `cache()`。几条实践：

**别为了调对比度而缓存整个图层。** `layer.cache()` 会建一张与舞台等大的
离屏画布，在 4K 屏上这是几千万像素。只缓存真正需要滤镜的那个节点。

**缓存的 `pixelRatio` 直接决定滤镜成本。** 默认值是设备像素比，
在 2x 屏上缓存面积是节点面积的四倍。如果这个节点不会被放大显示，
`cache({ pixelRatio: 1 })` 能省下四分之三的滤镜耗时，
视觉上在 2x 屏看不出差别的场景比想象中多。

**拖滑块调参时不要重复 `cache()`。** 缓存一次，之后只改 `contrast()`
再 `layer.draw()`。Konva 会在现有缓存上重跑滤镜链，不会重建缓存画布。
反过来，如果每次 `input` 事件都调一遍 `cache()`，
你会在拖动过程中反复分配和销毁大块内存，卡顿非常明显。
