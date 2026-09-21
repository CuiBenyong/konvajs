---
title: 'Line 线条总览'
description: 'Konva.Line 的四种形态由 closed 与 tension 两个属性组合决定：直线、多边形、样条曲线与 Blob；points 是扁平数组而非坐标对数组。'
sidebar_position: 22
---

`Konva.Line` 一个类承担了四种看起来很不一样的图形。
区别只来自两个属性：`closed`（首尾是否连起来）和 `tension`（曲线张力）。

<iframe src="/downloads/code/shapes/Line.html" style="width: 50vw;height:330px;"></iframe>

## 两个属性，四种形态

| `closed` | `tension` | 形态 | 详见 |
|---|---|---|---|
| `false` | `0` | 直线 / 折线 | [简单直线](/docs/shapes/line-simple-line) |
| `true` | `0` | 多边形 | [多边形](/docs/shapes/line-polygon) |
| `false` | `> 0` | 样条曲线 | [样条曲线](/docs/shapes/line-spline) |
| `true` | `> 0` | 平滑闭合的团块 | [Blob](/docs/shapes/line-blob) |

同一组 `points`，四种组合画出来的结果完全不同——
上面的演示把它们并排放在一起。

```js
new Konva.Line({
  points: [0, 40, 40, 0, 80, 50, 120, 10],
  stroke: '#4078c0',
  strokeWidth: 3,
  closed: false,
  tension: 0,
});
```

## points 是扁平数组

坐标写成一个一维数组，`x` 和 `y` 交替排列：

```js
points: [0, 40, 40, 0, 80, 50]     // ✅ 三个点
points: [[0, 40], [40, 0], [80, 50]]  // ❌ 不支持
```

这是最常见的写错方式之一。传嵌套数组不会抛出清晰的错误，
画面只是不显示或形状诡异。

数组长度应当是偶数。长度为奇数时最后一个孤立的值没有配对的坐标，
会被忽略——同样不报错。

从对象数组转换的话：

```js
const pts = [{ x: 0, y: 40 }, { x: 40, y: 0 }];
const flat = pts.flatMap((p) => [p.x, p.y]);
```

## 常见问题

### tension 到底是什么？

它控制样条曲线的"松紧"。Konva 用它把折线的顶点转换成一组贝塞尔控制点，
**顶点本身仍然会被曲线穿过**——这一点和贝塞尔曲线不同，
贝塞尔的控制点是不在曲线上的。

- `0`（默认）——直连，就是折线
- `0.5` 左右——自然的平滑曲线，最常用
- `1` 以上——曲线开始在顶点外"甩出去"，出现明显的过冲

所以 `tension` 不是"曲率"也不是"控制点位置"，
它更像是"让线在顶点处拐弯有多圆滑"。

需要精确控制曲线形状（指定控制点）时，用
[`Konva.Path`](/docs/shapes/path) 写 SVG 路径数据，`tension` 做不到。

### 为什么线条点不中？

两个原因叠加：

**没有 `fill` 的线只有描边可命中。** 设了 `closed: true` 并给 `fill`
之后内部才可点。

**命中宽度默认等于 `strokeWidth`。** 一条 1px 的线，
命中区域也只有 1px 宽，鼠标几乎不可能对准。给它加宽命中区：

```js
new Konva.Line({
  points: [...],
  strokeWidth: 1,        // 视觉上还是 1px
  hitStrokeWidth: 12,    // 命中区 12px
});
```

Konva 10.4.0 改进过细线的命中检测，细线现在能在自身像素上被命中，
但要让用户"好点中"，`hitStrokeWidth` 仍然是必需的。
更多见[自定义命中区域](/docs/events/custom-hit-region)。

### 能画箭头吗？

用 [`Konva.Arrow`](/docs/shapes/arrow)，它继承自 `Line`，
`points`、`tension`、`closed` 全都能用，额外多了箭头端的配置。

注意 Konva 10.6.0 修了一个相关问题：当线的首尾点重合时
（比如双击结束绘制导致最后两点相同），箭头会朝向水平方向而不是正确的角度。

### 怎么做可拖拽的顶点编辑？

标准做法是给每个顶点放一个小圆作为锚点，
在锚点的 `dragmove` 里改写 `points` 数组：

```js
anchor.on('dragmove', () => {
  const pts = line.points().slice();   // 注意要复制
  pts[index * 2] = anchor.x();
  pts[index * 2 + 1] = anchor.y();
  line.points(pts);
});
```

**`.slice()` 不能省。** Konva 10.6.0 起，未设置过的数组属性
每次读取返回的是新数组，但已设置过的返回的是内部引用——
直接原地修改它，Konva 检测不到变化，画面不会更新。

## 性能提示

`Line` 的绘制成本随 `points` 的长度线性增长，
但真正的性能问题出在**自由绘制**这类场景：
用户按住鼠标画一笔，每次 `mousemove` 往 `points` 里推两个数，
然后整条线重绘。

一笔画上几千个点之后，每帧都在重建一条几千段的路径，
帧率会明显下降。三个办法：

**采样抽稀。** 不是每个 `mousemove` 都记点——
和上一个点距离小于某个阈值（比如 2px）就跳过。
肉眼看不出区别，点数能少一半以上。

**分段固化。** 每画满若干个点就把当前这一笔封存成一个独立的
`Konva.Line` 并 `cache()`，新的笔画从头开始。
已完成的部分变成位图，不再参与路径重建，
这是白板类应用的标准做法，见[图形缓存](/docs/performance/shape-caching)。

**把正在画的那一笔单独放一层。** 已完成的笔画留在静态图层，
只有当前活动的这一笔在上层。这样每帧只重绘一层，
而且那一层上只有一条线，见[图层管理](/docs/performance/layer-management)。

另外，闭合路径在 Konva 10.6.0 有一处行为变更：
`getLength()` 现在包含闭合边（与 SVG 一致）。
如果你用 `getLength()` 做沿线动画或均匀取点，
升级后闭合图形的计算结果会变。
