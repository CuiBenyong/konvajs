---
title: 'Threshold 二值化'
description: 'Konva.Filters.Threshold 把每个通道推到 0 或 255；它的循环步长是 1 而不是 4，所以 alpha 通道也被二值化，半透明边缘会变成硬锯齿。'
sidebar_position: 17
---

二值化把每个分量推向两个极端：低于分界线的变成 0，高于的变成 255。
用来做剪影、线稿、高对比的图形化效果。

<iframe src="/downloads/code/filters/Threshold.html" style="width: 50vw;height:300px;"></iframe>

```js
node.cache();
node.filters([Konva.Filters.Threshold]);
node.threshold(0.5);   // 0 ~ 1，默认 0.5
```

`threshold` 是归一化的分界值，内部换算成 `threshold × 255`。
`0.5` 对应 127.5，也就是中灰。

## alpha 通道也会被二值化

这是本页最需要注意的一点，源码里的循环是这样的：

```js
const level = this.threshold() * 255;
for (let i = 0; i < len; i += 1) {      // 注意是 += 1，不是 += 4
  data[i] = data[i] < level ? 0 : 255;
}
```

**步长是 1 而不是 4**，意味着它遍历的是每一个字节，
包括每个像素的第四个字节——**alpha**。

后果是：图片里任何半透明的像素，alpha 要么被推到 255（完全不透明），
要么被推到 0（完全透明），中间态一个都不剩。

实测一个 `rgba(200,50,50,0.5)` 的矩形：

| 设置 | 采样结果 |
|---|---|
| 未加滤镜 | `199,50,50` alpha **128** |
| `threshold(0.3)` | `255,0,0` alpha **255** |
| `threshold(0.5)` | `255,0,0` alpha **255** |
| `threshold(0.9)` | `0,0,0` alpha **0**（整体消失） |

这带来两个实际影响：

**抗锯齿边缘会变成硬锯齿。** PNG 图标、文字、圆形的边缘都靠半透明像素做平滑，
二值化之后这些像素非黑即白，锯齿会非常明显。
这有时正是你想要的（像素风、剪影），但如果不是，就得换别的办法。

**`threshold` 调高时整个图形会突然消失。** 因为 alpha 也被拿去比较——
当 `threshold × 255` 超过了图形本身的 alpha 值，整块区域的 alpha 都变成 0。
上表里 `threshold(0.9)` 就是这个情况。这不是 bug，但很反直觉。

## 常见问题

### 怎么只二值化颜色、不动透明度？

内置滤镜做不到，需要写一个
[自定义滤镜](/docs/filters/custom-filter)，把步长改回 4：

```js
function RGBThreshold(imageData) {
  const level = 128;
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {   // 跳过 alpha
    d[i]     = d[i]     < level ? 0 : 255;
    d[i + 1] = d[i + 1] < level ? 0 : 255;
    d[i + 2] = d[i + 2] < level ? 0 : 255;
  }
}
```

这样边缘的抗锯齿会被保留，图形也不会因为调高阈值而整体消失。

### 为什么结果是彩色的，不是黑白？

因为三个颜色通道是**各自独立**二值化的，不是先转灰度再二值化。
一个 `rgb(200,50,50)` 的像素在 `threshold(0.5)` 下变成
`255,0,0`——红通道过线、绿蓝没过。

八种组合（每个通道 0 或 255）意味着结果最多有 8 种颜色：
黑、红、绿、蓝、黄、青、品红、白。

想要真正的黑白二值图，先加 [`Grayscale`](/docs/filters/grayscale)：

```js
node.filters([Konva.Filters.Grayscale, Konva.Filters.Threshold]);
```

顺序不能反——灰度化必须在二值化之前。

### threshold 和 Mask 的 threshold 是同一个吗？

**是同一个属性。** `Threshold` 和 [`Mask`](/docs/filters/mask)
各自注册了名为 `threshold` 的访问器（默认值都是 `0.5`），
它们指向节点上的同一个值。

但语义完全不同：`Threshold` 用它作为 0–255 的分界线（乘以 255），
`Mask` 用它作为 RGB 距离的容差（典型值 10–80）。

所以**同一个节点上不能同时用这两个滤镜并各自调参**——
调到适合 `Mask` 的 10，对 `Threshold` 来说是 2550，
所有像素都会被推到 255。

## 性能提示

`Threshold` 是本章**最快的滤镜**：每个字节一次比较、一次赋值，
没有乘法、没有邻域采样、没有额外内存分配。
它的循环次数虽然是其他滤镜的四倍（步长 1 而非 4），
但单次操作便宜得多，总体仍然是最省的。

所以这个滤镜本身几乎不需要优化，成本全在 `cache()` 上。

一个值得注意的用法：**二值化的结果非常适合再缓存一次**。
二值图只有有限几种颜色、没有渐变，
如果你要把它作为静态背景反复使用，
`toImage()` 导出成一张图片再当作普通 `Konva.Image` 使用，
比每次都跑滤镜链更划算——尤其是当它前面还串了
[`Grayscale`](/docs/filters/grayscale) 之类的滤镜时。

反过来，**不要在动画里逐帧改 `threshold`**。虽然滤镜本身快，
但每次属性变化都会触发整张缓存画布的重新遍历，
在大图上依然会掉帧。做阈值动画时先把缓存的 `pixelRatio` 降到 1。
