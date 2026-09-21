---
title: 'Brightness 亮度'
description: 'Konva.Filters.Brightness 按乘数调整亮度，中性值为 1，与已弃用的 Brighten 共用 brightness 属性但语义相反——一个是乘法一个是加法。'
sidebar_position: 9
---

`Brightness` 是 CSS 兼容的亮度滤镜：把每个通道**乘以** `brightness`。
中性值是 **1**，大于 1 变亮，小于 1 变暗。

<iframe src="/downloads/code/filters/Brightness.html" style="width: 50vw;height:300px;"></iframe>

```js
node.cache();
node.filters([Konva.Filters.Brightness]);
node.brightness(1.5);   // 亮 50%
```

## 和 Brighten 的关系：同一个属性，相反的语义

这是本页最需要记住的一件事。

Konva 10 起 [`Konva.Filters.Brighten`](/docs/filters/brighten) 被标记为**弃用**，
官方建议改用 `Brightness`。但两者**共用同一个 `brightness()` 属性**，
计算方式却完全不同：

| | 公式 | 中性值 | `brightness(0)` 的结果 |
|---|---|---|---|
| `Brighten`（已弃用） | `通道 += brightness × 255` | **0** | 不变 |
| `Brightness`（推荐） | `通道 ×= brightness` | **1** | **全黑** |

所以**只把滤镜名换掉、不改数值，画面会静默出错**。
下面是在真实浏览器里对 `rgb(100,100,100)` 的纯色块逐像素采样的结果：

| 写法 | 采样到的颜色 |
|---|---|
| `Brighten` + `brightness(0)` | `100,100,100`（不变） |
| `Brightness` + `brightness(0)` | **`0,0,0`（全黑）** |
| `Brighten` + `brightness(0.5)` | `228,228,228`（加了 127.5） |
| `Brightness` + `brightness(0.5)` | `50,50,50`（乘了 0.5） |
| `Brighten` + `brightness(1)` | `255,255,255`（加满溢出） |
| `Brightness` + `brightness(1)` | `100,100,100`（不变） |

迁移时的换算不是简单的加一：`Brighten` 是绝对增量，`Brightness` 是相对比例，
**两者数学上不等价**，对暗部和亮部的影响方式根本不同。
只能按视觉效果重新调，不能靠公式换算。

## 未设置时的默认值有个陷阱

`brightness` 这个属性的访问器**由 `Brighten` 注册，默认值是 `0`**。
但 `Brightness` 滤镜在读取时做了特殊处理：
如果这个属性**从未被设置过**，它按 `1` 计算。

实测可以看到这个不一致：

```js
new Konva.Rect({}).brightness();   // 读到 0
```

```js
// 但是：
node.filters([Konva.Filters.Brightness]);
// 不设 brightness → 画面不变（按 1 处理）
node.brightness(0);
// 显式设成 0 → 全黑
```

也就是说 `node.brightness()` 读到的 `0` 和"当前实际生效的亮度"不是一回事。
**不要依赖读取这个属性来判断当前状态**，自己维护一份值。

## 常见问题

### 我该用 Brightness 还是 Brighten？

新代码一律用 `Brightness`。`Brighten` 已弃用，
而且乘法的行为和 CSS 的 `filter: brightness()` 一致，
在和 CSS 滤镜混用时不会打架。

存量代码不急着改——`Brighten` 目前仍然可用。
要改的话必须同时调整数值并目视确认，
批量替换滤镜名是最危险的做法。

### 为什么加了滤镜没反应？

九成是**忘了 `cache()`**。Konva 的滤镜作用在缓存画布上，
没有缓存就没有可供滤镜处理的像素数据，`filters()` 设了也没用。

```js
node.cache();                                  // 必须
node.filters([Konva.Filters.Brightness]);
node.brightness(1.5);
```

另外，改了节点的尺寸、内容之后需要重新 `cache()`，
否则滤镜还作用在旧的缓存上。

### 亮度调到很大为什么图片变成白块？

乘法会让通道值超过 255，超出部分被裁切到 255。
原图里稍亮的区域会先饱和成纯白，细节就丢了——这是不可逆的。

想保留亮部细节，用 [`Contrast`](/docs/filters/contrast) 或
[`HSL`](/docs/filters/hsl) 的 `luminance` 更合适，
它们对已经很亮的像素更温和。

## 性能提示

`Brightness` 是最便宜的滤镜之一：每个像素三次乘法和三次比较，
没有邻域采样、没有额外内存。成本几乎全在 `cache()` 本身——
建一张与节点等大的离屏画布，并在其上重绘一遍。

所以真正要控制的是**缓存的面积和频率**，不是滤镜本身：

- 只给需要滤镜的节点加缓存，不要图省事缓存整个图层。
- 节点被放大显示时，`cache({ pixelRatio: 2 })` 会让缓存画布面积变成四倍，
  滤镜耗时也随之四倍。不需要高清就别提高它。
- 做亮度动画（比如悬停渐亮）时，**不要每帧 `cache()`**。
  缓存一次，之后只改 `brightness()` 并 `layer.draw()`——
  Konva 会在已有缓存上重跑滤镜，不会重建缓存。
- 如果只是要一个整体变亮的视觉效果而不需要像素级控制，
  用 [CSS 滤镜字符串](/docs/filters/css-filters)通常更快，
  它走的是浏览器的原生实现而不是 JS 循环。
