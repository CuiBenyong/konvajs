---
title: 'Solarize 曝光反转'
description: 'Konva.Filters.Solarize 把亮度高于阈值的像素反相；阈值硬编码为 128，没有配置项，需要可调阈值只能自己写自定义滤镜。'
sidebar_position: 22
---

曝光反转（日晒效果）来自暗房里的一个意外：冲洗过程中曝光过度的部分会反相。
数字实现就是"亮度超过某个值的像素取反"。

<iframe src="/downloads/code/filters/Solarize.html" style="width: 50vw;height:280px;"></iframe>

```js
node.cache();
node.filters([Konva.Filters.Solarize]);
// 没有可设的属性
```

## 阈值硬编码为 128

源码：

```js
const threshold = 128;          // 写死的局部常量
const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;   // sRGB 亮度
if (L >= threshold) {
  d[i]     = 255 - r;
  d[i + 1] = 255 - g;
  d[i + 2] = 255 - b;
}
```

两点值得注意：

**`threshold` 是函数内部的局部常量，不是节点属性。**
`Solarize` 没有注册任何访问器。如果你看到有代码写
`node.threshold(0.3)` 配合 `Solarize`，那个 `threshold`
其实是 [`Threshold`](/docs/filters/threshold) 和
[`Mask`](/docs/filters/mask) 共用的属性，
对 `Solarize` **完全没有影响**。

**亮度用的是标准 sRGB 系数**（`0.2126 / 0.7152 / 0.0722`），
和 [`RGB`](/docs/filters/rgb) 滤镜里那组非标准权重不同。

判定是按**整个像素的亮度**做的，不是逐通道——
一旦超过阈值，三个通道一起反相。所以结果里不会出现
"红通道反了但绿通道没反"这种情况。

## 可调阈值的版本

阈值写死意味着深色图片几乎不变（没有像素超过 128），
亮色图片则大面积反相。要控制这一点，抄一份源码改成可调的
[自定义滤镜](/docs/filters/custom-filter)：

```js
function SolarizeAt(imageData) {
  const threshold = this.getAttr('solarizeThreshold') ?? 128;
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    if (L >= threshold) {
      d[i]     = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
  }
}

node.setAttr('solarizeThreshold', 180);   // 只反转很亮的部分
node.cache();
node.filters([SolarizeAt]);
```

阈值调高（180 以上）只反转高光，效果克制、更像真实的暗房日晒；
调低（80 以下）会让大部分画面反相，接近
[`Invert`](/docs/filters/invert) 的效果。

## 常见问题

### 为什么我的图片加了 Solarize 几乎没变化？

图片整体偏暗，没有多少像素的亮度超过 128。

验证一下平均亮度：如果一张图的平均亮度只有 60~70，
那么按 128 这个固定阈值，只有少数高光会被反转，
肉眼很难注意到。

两个办法：先用 [`Brightness`](/docs/filters/brightness) 提亮再 solarize，
或者用上面那个可调版本把阈值降到图片实际的亮度区间里。

### Solarize 和 Invert 有什么区别？

[`Invert`](/docs/filters/invert) 反转**所有**像素，
`Solarize` 只反转亮度超过阈值的部分。

所以 `Solarize` 的结果里暗部保持原样、亮部变成它的补色，
在明暗交界处形成强烈的分界线——这正是日晒效果的视觉特征。
`Invert` 则是整体的负片。

### 能反转暗部而不是亮部吗？

把判断条件反过来即可，用上面的自定义滤镜模板，
把 `L >= threshold` 改成 `L < threshold`。

这不是标准的日晒效果，但用来做某些图形化的视觉处理挺有意思——
暗部变亮、亮部保持，画面会呈现出一种"内发光"的感觉。

## 与其他方案的取舍

`Solarize` 是一个**效果固定、用途狭窄**的滤镜。
它的全部价值在于"一行代码得到一个特定的艺术效果"。

需要任何程度的控制，就得换方案：

**要调阈值** → 上面的自定义滤镜版本，二十行，完全可控。

**要更丰富的艺术效果** → 单个滤镜做不到。
日晒通常要配合对比度、色调偏移一起用：

```js
node.filters([
  Konva.Filters.Solarize,
  Konva.Filters.Contrast,
  Konva.Filters.HSL,
]);
node.contrast(20);
node.hue(15);
```

注意顺序——靠前的先执行，先反相再调对比，
和先调对比再反相是两种完全不同的画面。

**只是要个视觉效果、不读像素** → CSS 滤镜里**没有** solarize，
这是少数几个必须用 Konva 内置滤镜（或自定义滤镜）的效果之一。
[`Invert`](/docs/filters/invert) 在 CSS 里有 `invert()`，
但那是全反相，不是日晒。

**要精确复刻某个摄影软件的日晒曲线** → Konva 的实现是最简单的硬判定，
真实的日晒是一条平滑的 S 形曲线（超过阈值后逐渐反转而不是突变）。
需要那种效果得自己实现查找表（LUT），
在自定义滤镜里按曲线映射每个亮度值。
