---
title: 'HSL 色相饱和亮度'
description: 'Konva.Filters.HSL 通过 hue、saturation、luminance 调色；hue 与 saturation 两个属性与 HSV 滤镜共用，同时启用会让色相旋转应用两次。'
sidebar_position: 13
---

HSL 滤镜在色相（Hue）、饱和度（Saturation）、亮度（Luminance）三个维度上调色。
比起直接改 RGB，它更符合"我想让这张图偏蓝一点"这种描述方式。

<iframe src="/downloads/code/filters/HSL.html" style="width: 50vw;height:300px;"></iframe>

```js
node.cache();
node.filters([Konva.Filters.HSL]);
node.hue(140);         // 色相旋转角度，默认 0
node.saturation(0.5);  // 饱和度增量，默认 0
node.luminance(0.2);   // 亮度增量，默认 0
```

三个参数的默认值都是 `0`，也就是不做任何改变。

- **`hue`**——色相旋转的角度。常用范围 0–360，
  Konva 10.4.0 修正了超出 −360..360 时的镜像问题。
- **`saturation`**——饱和度的增量（不是倍数）。正值更鲜艳，负值趋向灰度。
- **`luminance`**——亮度的增量。取值通常在 −1 到 1 之间。

## hue 和 saturation 与 HSV 共用同一个属性

`Konva.Filters.HSL` 和 [`Konva.Filters.HSV`](/docs/filters/hsv)
**各自注册了 `hue` 和 `saturation` 两个属性，它们是同一个属性**，
不是两套独立的配置。区别只在第三个参数：HSL 用 `luminance`，HSV 用 `value`。

这带来一个具体后果：**同时启用这两个滤镜，色相旋转会被执行两次。**

对 `rgb(200,80,40)` 的实测：

| 写法 | 采样到的颜色 |
|---|---|
| 原色 | `200,80,40` |
| `HSL` + `hue(120)` | `102,83,255` |
| `HSV` + `hue(120)` | `102,83,255`（与上面**完全相同**） |
| `HSL` + `HSV` 同时，`hue(120)` | `40,159,25` |
| `HSL` 单独 + `hue(240)` | `32,171,10` |

最后两行说明了问题：同时挂两个滤镜、只设一次 `hue(120)`，
得到的结果接近单独旋转 **240°**——两个滤镜各自读了同一个 `hue` 值，
各转了一次。（两者不完全相等是因为 HSL 和 HSV 用的色彩模型不同，
但旋转量是双倍无疑。）

所以**不要同时启用 HSL 和 HSV**。需要同时调整 luminance 和 value 的话，
先想清楚你真正要的是哪一个——多数场景只需要其中之一。

## 常见问题

### luminance 和 value 有什么区别？

两者都让画面变亮，但模型不同，结果也不同。同样是 `0.3`，
对 `rgb(200,80,40)` 的实测结果是：

- `HSL` 的 `luminance(0.3)` → `238,118,78`
- `HSV` 的 `value(0.3)` → `246,98,49`

HSL 的 luminance 是"向白色混合"，所有通道一起往上走，
高饱和的颜色会明显变淡（`80 → 118`）。
HSV 的 value 是"提高明度上限"，更多地保留原有的色彩关系
（`80 → 98`，饱和度掉得少）。

要**提亮但保持颜色鲜艳**用 HSV 的 `value`；
要**做出褪色、朦胧的效果**用 HSL 的 `luminance`。

### saturation 的取值范围是多少？

源码里用的是通用的数值校验，没有硬性上下限。
实用范围大致是 −2 到 10：

- `-2` 左右基本变成灰度
- `0` 不变
- `2` 已经相当鲜艳，实测 `rgb(200,80,40)` 在 `saturation(2)` 下变成纯红 `255,0,0`
- 再往上只是让更多像素饱和到极值，收益递减

注意它是**增量**不是倍数，`saturation(1)` 不是"饱和度乘以 1"。

### 想做彩虹渐变动画怎么写？

持续旋转 `hue` 即可，这是 HSL 最自然的用法：

```js
node.cache();
node.filters([Konva.Filters.HSL]);

const anim = new Konva.Animation((frame) => {
  node.hue((frame.time / 20) % 360);
}, node.getLayer());
anim.start();
```

**关键是 `cache()` 只调用一次**，动画里只改 `hue`。
每帧重新 `cache()` 会导致严重卡顿，见下面的性能提示。

## 性能提示

HSL 是逐像素滤镜，没有邻域采样，单次成本不高。
但它是**最容易被写进动画循环**的滤镜（色相旋转做彩虹效果太诱人了），
而动画场景下的写法差异会带来数量级的性能差距。

**正确写法**：`cache()` 一次，之后每帧只改 `hue()`。
Konva 会在已有的缓存画布上重跑滤镜链，不重建缓存。

**错误写法**：在动画回调里调 `cache()`。每帧都要分配一张新的离屏画布、
把节点重绘一遍、再跑滤镜，帧率会掉到个位数。

即便是正确写法，每帧仍然要对整张缓存跑一遍逐像素循环。
如果节点很大，考虑这两个办法：

- **降低缓存分辨率**：`cache({ pixelRatio: 1 })`。色相动画中画面一直在变，
  用户注意不到分辨率损失，但滤镜工作量直接降到四分之一。
- **改用 CSS 滤镜**：`node.filters(['hue-rotate(90deg)'])`
  走浏览器原生实现，性能远好于 JS 循环，
  代价是可调性不如 HSL 精细，见 [CSS 滤镜](/docs/filters/css-filters)。
