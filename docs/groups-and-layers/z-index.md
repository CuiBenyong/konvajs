---
title: 'zIndex 层级'
description: 'Konva 的 zIndex 是节点在父容器 children 里的索引，不是 CSS 那样的全局值；设置越界会告警但仍然执行，效果等同 moveToTop。'
sidebar_position: 4
---

Konva 的 `zIndex` 和 CSS 的 `z-index` 名字像，含义完全不同。
搞混这一点是层级问题最常见的根源。

<iframe src="/downloads/code/groups_and_layers/Z_Index.html" style="width: 50vw;height:300px;"></iframe>

## zIndex 是父容器内的索引

Konva 源码里的注释说得很直接：

> zIndex is not absolute (like in CSS). It is relative to parent element only.

`zIndex` 就是这个节点在 `parent.children` 数组里的**下标**，
从 0 开始，0 在最下面。

后果是：**两个不同父容器里的节点，比较 `zIndex` 毫无意义。**

上面演示里，A 组和 B 组各有两个方块。A1 的 `zIndex` 是 0、
B1 的 `zIndex` 也是 0，但 B 组整体在 A 组之上（B 组后加进图层），
所以 B1 永远盖着 A1——**不管 A1 的 `zIndex` 调到多少**。

要在全局比较，用 `getAbsoluteZIndex()`，它按整棵树的绘制顺序给出全局序号。
但注意它只能**读**，不能设。

## 越界不会被忽略，而是等同于置顶

源码里 `setZIndex` 的逻辑值得看一眼：

```js
if (zIndex < 0 || zIndex >= this.parent.children.length) {
  Util.warn('Unexpected value ' + zIndex + ' for zIndex property. ...');
}
const index = this.index;
this.parent.children.splice(index, 1);
this.parent.children.splice(zIndex, 0, this);
```

**告警之后没有 `return`**——代码继续往下执行 `splice`。

而 `Array.prototype.splice` 会把超出长度的下标钳到数组末尾。
所以 `node.zIndex(999)` 的实际效果是**把节点移到最后，也就是置顶**。

实测三个子节点的 Group：

| 操作 | 结果 |
|---|---|
| 初始 A1/A2/A3 的 `zIndex` | `0 / 1 / 2` |
| `a1.zIndex(999)` | 不抛错，控制台告警 |
| 告警内容 | `Konva warning: Unexpected value 999 for zIndex property. zIndex is just index of a node in children of its parent. Expected value is from 0 to 2.` |
| 之后 `a1.zIndex()` | **`2`**（跑到了最后） |

所以"设了越界值所以没生效"这个猜想是错的——它生效了，
只是效果和你想的不一样。**想置顶就直接用 `moveToTop()`**，
语义明确、不产生告警、也不依赖 `splice` 的钳制行为。

## 常见问题

### 怎么让一个节点绝对置顶？

先想清楚"绝对"的范围。

`moveToTop()` 只在**父容器内**置顶。要让它盖住整个画面，
必须把它移到最上层容器里：

```js
// 移到最顶层的 Layer 上
topLayer.add(node);   // add 会自动从原父容器移除
node.moveToTop();
```

常见做法是专门留一个"浮层" Layer 放提示框、拖拽中的元素、右键菜单，
这个层永远在最上面。见[更换容器](/docs/groups-and-layers/change-containers)。

注意跨容器移动会改变坐标系——节点的 `x` / `y` 是相对父容器的。
移动前后想保持视觉位置不变，得用 `getAbsolutePosition()` / `setAbsolutePosition()` 换算。

### moveToTop、moveUp、zIndex(n) 该用哪个？

| 方法 | 语义 | 越界行为 |
|---|---|---|
| `moveToTop()` | 移到父容器内最上 | 无越界问题 |
| `moveToBottom()` | 移到父容器内最下 | 同上 |
| `moveUp()` / `moveDown()` | 上移 / 下移一位 | 已在顶/底时返回 `false`，不动 |
| `zIndex(n)` | 移到指定下标 | 越界会告警，且行为等同置顶/置底 |

**能用前四个就别用 `zIndex(n)`**。它们语义明确、不会越界、
也不需要你先知道 `children.length`。

`zIndex(n)` 只在"要恢复到某个记录下来的具体位置"时才有用，
比如撤销一次层级调整。

### 为什么改了 zIndex 画面没变？

三种可能，按概率排序：

1. **改的是 Group 内部的顺序，但整个 Group 被另一个容器盖住了。**
   这是最常见的。检查父容器之间的顺序，而不是节点之间的。
2. **两个节点根本不重叠。** 层级只在重叠时可见。
3. **它们在不同的 Layer 上。** Layer 是独立的 canvas 元素，
   层级由 Layer 在 Stage 中的顺序决定，子节点的 `zIndex` 影响不到跨层的关系。

打开演示页看 `getAbsoluteZIndex()` 的输出，能很快定位是哪一种。

### 节点没有父容器时设 zIndex 会怎样？

告警 `Node has no parent. zIndex parameter is ignored.` 并**直接返回**，
什么也不做。这一种才是真正的"被忽略"——
和上面越界的情况不同，这里源码里是有 `return` 的。

## 性能提示

`zIndex()`、`moveToTop()` 这些方法都要对 `children` 数组做两次 `splice`
（先删后插），之后还要调 `_setChildrenIndices()` 重新给所有兄弟节点编号。
**这是 O(n) 操作，n 是同级兄弟节点的数量。**

在几个节点的容器里完全无所谓。问题出在两个场景：

**拖拽时每帧置顶。** 一个常见的写法是在 `dragmove` 里调 `moveToTop()`
让被拖的元素保持在最上面。在有几百个兄弟节点的容器里，
这意味着每帧两次数组 splice 加一次全量重新编号，会明显掉帧。

正确做法是**在 `dragstart` 里置顶一次**：

```js
node.on('dragstart', () => node.moveToTop());
```

拖拽过程中层级不会变，没有必要重复置顶。

**批量调整层级。** 如果要一次性重排很多节点，
不要逐个调 `zIndex()`——那是 O(n²)。
直接操作数组再统一通知 Konva 更可取，
或者干脆按目标顺序重新 `add()` 一遍（`add` 会追加到末尾）。

还有一条容易忽略的：**层级变化会让整个图层重绘**。
如果你的置顶操作发生在一个包含大量静态内容的图层上，
成本不只是数组操作，还有整层的重绘。
把频繁变动的元素放到单独的图层，见[图层管理](/docs/performance/layer-management)。
