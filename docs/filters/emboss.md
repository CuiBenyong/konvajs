---
title: 'Emboss 浮雕'
description: 'Konva.Filters.Emboss 模拟浮雕效果，由 embossStrength、embossWhiteLevel、embossDirection 与 embossBlend 控制；方向值传错不会报错，会静默回退到 top-left。'
sidebar_position: 11
---

浮雕滤镜按某个方向对相邻像素做差分，让画面看起来像压在金属板上的凸纹。

<iframe src="/downloads/code/filters/Emboss.html" style="width: 50vw;height:300px;"></iframe>

```js
node.cache();
node.filters([Konva.Filters.Emboss]);
node.embossStrength(0.8);      // 默认 0.5
node.embossWhiteLevel(0.5);    // 默认 0.5
node.embossDirection('top-left');  // 默认 'top-left'
node.embossBlend(false);       // 默认 false
```

## 四个参数各管什么

**`embossStrength`**（默认 `0.5`）——凸起的强度，也就是差分的放大倍数。
值越大，边缘的明暗反差越剧烈。

**`embossWhiteLevel`**（默认 `0.5`）——平坦区域的基准灰度。
浮雕的原理是"只有边缘有明暗变化，平坦处是中性灰"，
这个参数决定那个中性灰有多亮。0 是黑底，1 是白底。

**`embossDirection`**（默认 `'top-left'`）——光照方向，决定凸起还是凹陷。
只接受这 8 个字符串：

| 值 | 内部角度 |
|---|---|
| `'top-left'` | 315° |
| `'top'` | 270° |
| `'top-right'` | 225° |
| `'right'` | 180° |
| `'bottom-right'` | 135° |
| `'bottom'` | 90° |
| `'bottom-left'` | 45° |
| `'left'` | 0° |

**`embossBlend`**（默认 `false`）——是否把浮雕结果与原图混合。
关闭时输出是纯灰度的浮雕；打开时保留原图的颜色，
效果更像"给图片加了一层凹凸质感"而不是"把图片变成浮雕"。

## 方向值传错不会报错

这是一个很容易浪费时间的坑：`embossDirection` **没有做值校验**。

```js
node.embossDirection('topleft');    // 少了连字符
node.embossDirection('upper-left'); // 拼法不对
node.embossDirection('TOP-LEFT');   // 大小写不对
```

上面三种写法都**不会抛错、不会警告**，Konva 在内部的方向表里查不到，
就静默回退到默认的 315°（`top-left`）。

表现是"我明明改了方向，画面却纹丝不动"。
如果你遇到这个现象，先把字符串抄一遍上面的表，
不要怀疑是滤镜本身的问题。

## 常见问题

### 浮雕之后颜色没了？

这是默认行为。`embossBlend` 默认是 `false`，
输出是纯灰度的浮雕图。想保留原图颜色：

```js
node.embossBlend(true);
```

### 为什么效果很弱，几乎看不出来？

两个常见原因：

**原图太平滑。** 浮雕靠相邻像素的差分工作，
大片纯色或平缓渐变的区域本来就没有差分可言，自然没有凸起。
浮雕在纹理丰富、边缘清晰的图上效果最明显。

**`embossStrength` 太小。** 默认 `0.5` 偏保守，
调到 `0.8` 以上差别会明显得多。

### 能做出凹陷而不是凸起吗？

能，把方向转 180°。`'top-left'`（315°）看起来是凸起的话，
`'bottom-right'`（135°）就是凹陷的——因为光照方向反了，
高光和阴影互换。

这也是判断方向参数有没有生效的最快办法：
在这两个值之间切换，如果画面完全不变，说明字符串写错了。

## 性能提示

浮雕是本章里**最贵的滤镜之一**，因为它需要**邻域采样**：
每个像素都要读取它周围的像素来算差分，而不像 `Brightness`
那样只看自己。这意味着内存访问模式不连续，缓存命中率低，
耗时明显高于逐像素滤镜。

几条实践建议：

**不要在动画里逐帧改浮雕参数。** 每次参数变化都会让整张缓存画布重跑一遍
邻域采样。悬停加浮雕这种效果，用两个预先缓存好的节点做切换，
比实时改参数流畅得多。

**控制缓存面积。** 邻域采样的成本对面积特别敏感——
`cache({ pixelRatio: 1 })` 相比默认的 2x 能直接省掉四分之三的工作量。
浮雕本身就是"糊"的效果，降低缓存分辨率造成的画质损失很难察觉，
这是少数几个可以放心降分辨率的滤镜。

**和其他滤镜叠加时把浮雕放最后。** 前面的滤镜如果改变了图像的
明暗分布（比如 `Contrast`），浮雕会基于改变后的结果计算，
通常这才是你想要的；反过来先浮雕再调对比，
调的是已经变成灰度的浮雕图，可控性差很多。
