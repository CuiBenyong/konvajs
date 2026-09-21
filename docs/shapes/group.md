---
title: 'Group 分组'
description: 'Konva.Group 把多个图形当作整体移动、缩放、旋转与裁剪；它是容器不是图形，没有填充与描边，width() 恒为 0，包围盒要用 getClientRect()。'
sidebar_position: 21
---

`Konva.Group` 把若干节点装进一个容器，之后对容器做的变换会作用到全部子节点。
拖一次就带走一整组、旋转一次整体转——不用给每个图形各自算坐标。

<iframe src="/downloads/code/shapes/Group.html" style="width: 50vw;height:300px;"></iframe>

```js
const group = new Konva.Group({
  x: 20,
  y: 20,
  rotation: 12,
  draggable: true,
});

group.add(rect);
group.add(circle);
group.add(text);
layer.add(group);
```

子节点的 `x` / `y` 是**相对于 Group** 的，不是舞台坐标。
Group 移动时子节点的 `x` / `y` 不变，变的是 Group 自己。

## Group 与 Layer 的区别

两者都是容器，都能 `add()` 子节点，但底层完全不同：

| | Layer | Group |
|---|---|---|
| 对应 DOM | **一个真实的 `<canvas>` 元素** | 无 |
| 内存开销 | 一张场景画布 + 一张命中画布 | 几乎为零 |
| 独立重绘 | 可以，其他层不受影响 | 不能，随所在图层一起重绘 |
| 数量建议 | 少，超过 5 个 Konva 会打印告警 | 不限 |

判断标准很清楚：**要「这部分变化时别的不用重画」用 Layer，
要「这几个东西一起动」用 Group。**

新手常见的错误是为了组织结构而拆很多 Layer。
每个 Layer 都要在 DOM 里放一个画布元素，在高分屏上一张全屏画布
就是几千万像素的显存，拆到十几层会明显拖慢合成。

Konva 自己会拦你——`stage.add()` 时图层数超过 5 就打印一条告警，
原文是：

> The stage has N layers. Recommended maximum number of layers is 3-5.
> Adding more layers into the stage may drop the performance.
> Rethink your tree structure, you can use Konva.Group.

**纯粹的逻辑分组一律用 Group。**

## Group 没有自己的尺寸

`Konva.Group` 不是 `Shape`，它没有 `sceneFunc`，
因此**没有 fill、stroke，也没有真正的宽高**：

```js
group.width();   // 0 —— 不管里面装了多大的东西
group.height();  // 0
```

想知道这一组占多大地方，用 `getClientRect()`：

```js
const box = group.getClientRect();
// { x, y, width, height } —— 含子节点、变换与描边的实际包围盒
```

这也是给 Group 加背景、加边框的办法：算出包围盒，
再往 Group 里插一个 `Konva.Rect` 放在最底层。注意插入之后包围盒会变，
要先算再插，不要在循环里反复取。

## 常见问题

### 变换 Group 之后子节点的坐标变了吗？

没有。子节点的 `x()` / `y()` 始终是相对父容器的值，
Group 的变换矩阵在**绘制时**才累乘上去。

要拿舞台坐标系里的真实位置，用 `getAbsolutePosition()`：

```js
circle.x();                    // 30 —— 相对 Group
circle.getAbsolutePosition();  // { x: ..., y: ... } —— 相对舞台
```

这一点在做碰撞检测、吸附、对齐时特别容易出错——
**两个不同 Group 里的节点，直接比较 `x()` 没有意义**。

### 能给 Group 设 fill 吗？

不能。Group 是容器，没有可填充的路径。

要给一组内容加背景，在 Group 里放一个 `Konva.Rect` 作为第一个子节点：

```js
const box = group.getClientRect({ relativeTo: group });
const bg = new Konva.Rect({
  x: box.x,
  y: box.y,
  width: box.width,
  height: box.height,
  fill: '#f5f5f5',
});
group.add(bg);
bg.moveToBottom();
```

`{ relativeTo: group }` 不能省——默认返回的是舞台坐标系里的包围盒，
直接拿去当子节点的 `x` / `y`，会额外偏移一个 Group 自身的位置。

### 怎么让 Group 里只有某几个子节点响应事件？

给不需要响应的子节点设 `listening(false)`。
注意 **Group 自己设 `listening(false)` 会让整组都不响应**，
包括所有子节点——这是[命中检测](/docs/events/custom-hit-region)里
最常见的困惑来源。

反过来，Group 设了 `draggable: true` 之后，
点在任意子节点上都能拖动整组；
如果想让某个子节点单独可拖，给它自己也设 `draggable: true`，
它的拖拽会覆盖父级的。

### Group 可以嵌套吗？

可以，而且没有层数限制。但每多一层嵌套，
每个子节点在绘制和求绝对坐标时就多一次矩阵乘法。

深层嵌套在节点多的时候会明显拖慢。
如果你发现自己嵌了五六层，通常说明结构可以拍扁——
Group 的层级应该反映**一起变换的单元**，而不是业务上的分类。

## 性能提示

Group 本身没有渲染开销——它不绘制任何东西，只是传递变换。
所以「为了组织结构而分组」是免费的，可以放心用。

真正影响性能的是围绕 Group 的两个操作。

**`group.cache()` 是性价比很高的优化，也很容易用错。**
它把整组内容烤成一张位图，之后绘制这一组就等于画一张图，
成本与内部有多少节点无关。一个装了两百个小图形的静态 Group，
缓存后绘制耗时能降一两个数量级。

代价是**缓存之后子节点的改动不会自动反映**——
改了子节点的属性，画面纹丝不动，必须 `group.clearCache()`
或重新 `group.cache()`。这是缓存最常见的坑：
「我明明改了值，为什么没变化」。

所以判断标准是**这一组会不会频繁变**：
静态或很少变的，缓存收益巨大；每帧都在改内部的，缓存是净损失
（每次都要重建位图）。

**`getClientRect()` 不便宜。** 它要递归遍历所有子节点、
逐个求变换后的包围盒再取并集。不要在 `dragmove` 之类的高频回调里
对一个大 Group 反复调用——把结果缓存起来，
只在内容真正变化时重算。

Konva 10.4.0 起 `clearCache()` 的行为有过修正：
此前对容器调用会把所有后代的缓存也一起清掉并泄漏它们的画布，
现在不会了。如果你的项目还在更早的版本上大量使用嵌套缓存，
这是一个值得升级的理由。
