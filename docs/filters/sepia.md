---
title: 'Sepia 棕褐色'
description: 'Konva.Filters.Sepia 用固定矩阵做旧照片的棕褐色调，没有任何配置项，强度不可调；需要半程效果只能自己写自定义滤镜插值。'
sidebar_position: 21
---

老照片的棕褐色调。这是本章最简单的滤镜——**没有任何参数**。

<iframe src="/downloads/code/filters/Sepia.html" style="width: 50vw;height:280px;"></iframe>

```js
node.cache();
node.filters([Konva.Filters.Sepia]);
// 就这样，没有可设的属性
```

## 固定矩阵，强度不可调

源码里是一组写死的系数：

```js
data[i]     = min(255, r * 0.393 + g * 0.769 + b * 0.189);
data[i + 1] = min(255, r * 0.349 + g * 0.686 + b * 0.168);
data[i + 2] = min(255, r * 0.272 + g * 0.534 + b * 0.131);
```

这是业界通用的 sepia 矩阵（和 CSS `filter: sepia(1)` 用的是同一组）。
没有注册任何配置属性，所以**你要么要全部效果，要么不用它**。

注意系数行和大于 1（第一行 0.393+0.769+0.189 = 1.351），
所以亮部会被推到 255 饱和。这是 sepia 效果的一部分——
旧照片的高光本来就是"糊掉"的。

## 需要半程效果怎么办

写一个带插值的[自定义滤镜](/docs/filters/custom-filter)。
核心就是把结果和原值按比例混合：

```js
function SepiaAmount(imageData) {
  const amount = this.getAttr('sepiaAmount');
  const t = amount === undefined ? 1 : amount;   // 0 ~ 1
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const sr = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    const sg = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    const sb = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    d[i]     = r + (sr - r) * t;
    d[i + 1] = g + (sg - g) * t;
    d[i + 2] = b + (sb - b) * t;
  }
}

node.setAttr('sepiaAmount', 0.5);
node.cache();
node.filters([SepiaAmount]);
```

`t = 0` 完全不变，`t = 1` 与内置的 `Sepia` 结果一致，中间值是线性过渡。
这个写法也适用于任何其他"想要半程效果"的固定滤镜。

## 常见问题

### 和 Grayscale 有什么关系？

Sepia 可以理解为"灰度化之后染上棕色"，
但它不是真的先转灰度——矩阵一步完成，
而且保留了一点点原图的色彩倾向（三行系数不完全相同）。

如果你想要的是"先灰度、再精确控制染色色相"，
用 [`Grayscale`](/docs/filters/grayscale) 加 [`RGB`](/docs/filters/rgb) 更可控：

```js
node.filters([Konva.Filters.Grayscale, Konva.Filters.RGB]);
node.red(200); node.green(160); node.blue(110);
```

### 为什么亮的地方全糊成一片？

矩阵的系数行和大于 1，亮部计算出来超过 255 被裁切。
原图里较亮的区域会一起饱和成同一个米白色，细节丢失。

想保留亮部，先用 [`Brightness`](/docs/filters/brightness) 压暗一点再上 sepia：

```js
node.filters([Konva.Filters.Brightness, Konva.Filters.Sepia]);
node.brightness(0.85);
```

### 能叠加多次让效果更强吗？

可以放两个 `Konva.Filters.Sepia` 进数组，但效果不是"更棕"，
而是更快地全部饱和成米白——因为第二遍是在已经偏棕的结果上再乘一遍矩阵。

想要更浓的怀旧感，正确的组合是 sepia 加低对比度加暗角，
而不是重复 sepia。

## 与其他方案的取舍

**只想要一个棕褐色调、不需要调参** → 内置 `Sepia`，一行搞定。

**需要调强度** → 上面那个插值版自定义滤镜，二十行代码，
可控性完整。

**只是页面上的视觉效果、不需要读像素** →
用 [CSS 滤镜](/docs/filters/css-filters)：

```js
node.filters(['sepia(0.6)']);
```

CSS 滤镜字符串**原生支持强度参数**，而且走浏览器的实现，
性能比 JS 逐像素循环好得多。**如果你只是要 sepia 效果而不需要
后续读取像素数据，这才是首选**——内置的 `Konva.Filters.Sepia`
在可调性和性能上都不如它。

内置滤镜真正不可替代的场景是：你要把处理后的像素
`toDataURL()` 导出，或者要和其他自定义滤镜串在同一条链上。

**要做整套复古风格**（褪色 + 暗角 + 颗粒 + 划痕）→
单个滤镜堆不出来，考虑在离屏 canvas 上分层合成，
或者干脆用预制的纹理贴图叠加，比逐像素计算快得多。
