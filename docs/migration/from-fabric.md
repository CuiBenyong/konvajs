---
title: '从 Fabric.js 迁移'
description: 'Fabric.js 与 Konva 的概念与 API 对照：画布与舞台、对象与节点、内置控制柄与 Transformer、事件名、序列化，以及 Fabric 内置而 Konva 需要自己实现的功能。'
sidebar_position: 2
---

Fabric.js 和 Konva 都是「带交互的 Canvas 场景图」，概念大体能一一对应。
最大的差别在于定位：**Fabric 是一个开箱即用的编辑器内核**，选中、控制柄、自由绘制、
文字编辑都是内置的；**Konva 是一套构建画布应用的积木**，这些能力要么显式挂载，要么自己组合。

本页的 Fabric API 以 **Fabric 7.4.0** 核对，Konva 以 10.7.0 为准。

## 概念对照

| Fabric.js | Konva | 说明 |
|---|---|---|
| `new Canvas('id')`，挂在 `<canvas>` 元素上 | `new Konva.Stage({ container: 'id' })`，挂在 `<div>` 上 | Konva 自己创建 canvas 元素 |
| 无 | `Konva.Layer` | Konva 多出图层这一层，每个图层是一块独立的 canvas；多数应用一两个图层就够 |
| `FabricObject` 及 `Rect`、`Circle`… | `Konva.Shape` 及 `Konva.Rect`、`Konva.Circle`… | |
| `Group` | `Konva.Group` | |
| `obj.set({ fill: 'red' })` | `node.setAttrs({ fill: 'red' })` 或 `node.fill('red')` | |
| `canvas.requestRenderAll()` | 通常不需要 | Konva 8 起默认自动重绘（`Konva.autoDrawEnabled`） |
| `left` / `top` | `x` / `y` | 参照点不同，见文末常见问题 |
| `angle`（角度制） | `rotation`（角度制） | |
| `scaleX` / `scaleY` | `scaleX` / `scaleY` | 两者的控制柄都是通过改缩放实现拉伸 |
| `originX` / `originY` | `offsetX` / `offsetY` | Fabric 7 已将 origin 标为弃用 |
| `canvas.toJSON()` | `stage.toJSON()` 或 `node.toJSON()` | 结构不同，不能互相导入 |
| `await canvas.loadFromJSON(json)` | `Konva.Node.create(json, container)` | Fabric 6 起返回 Promise |

## 用法

同一个需求——一个能拖动、能缩放旋转、改完后保存的矩形——两边的写法：

```js
// Fabric.js 7
import { Canvas, Rect } from 'fabric';

const canvas = new Canvas('c'); // <canvas id="c" width="600" height="400">
const rect = new Rect({ left: 100, top: 100, width: 120, height: 80, fill: '#60a5fa' });
canvas.add(rect);

// 点选、控制柄、拖动都是默认开启的
canvas.on('object:modified', (e) => save(e.target));
```

```js
// Konva 10
import Konva from 'konva';

const stage = new Konva.Stage({ container: 'c', width: 600, height: 400 }); // <div id="c">
const layer = new Konva.Layer();
stage.add(layer);

const rect = new Konva.Rect({
  x: 40, y: 60, width: 120, height: 80, fill: '#60a5fa',
  draggable: true, // 拖动要显式开启
});
layer.add(rect);

// 控制柄是一个单独的节点，要自己创建并决定它套在谁身上
const tr = new Konva.Transformer();
layer.add(tr);
stage.on('pointerdown', (e) => {
  tr.nodes(e.target === stage ? [] : [e.target]);
});

rect.on('dragend transformend', () => save(rect));
```

Konva 的写法更长，但每一步都是可替换的：点选规则、多选方式、哪些图形能被选中，
都由你的代码决定。Transformer 的更多配置见[选中、缩放与旋转](/docs/select-and-transform/basic-demo)。

## Fabric 内置、Konva 要自己做的

迁移工作量主要在这里。逐项评估你的项目用到了哪些：

- **框选与多选**：Fabric 的 `ActiveSelection` 是内置的。Konva 需要自己画选框矩形、
  在 `pointerup` 时用 `Konva.Util.haveIntersection` 找出框内的节点，再交给 `tr.nodes()`。
- **自由绘制**：Fabric 打开 `canvas.isDrawingMode` 并设置 `freeDrawingBrush` 即可。
  Konva 要在 `pointermove` 里把指针坐标追加进一条 `Konva.Line` 的 `points`。
- **就地文字编辑**：Fabric 的 `IText` / `Textbox` 自带光标和选区。
  Konva 要在文字上叠一个 textarea，中文输入法下还有额外的坑，见[文字编辑与中文输入法](/docs/china/ime-text-editing)。
- **SVG 导入导出**：Fabric 有 `loadSVGFromString` 与 `toSVG()`。Konva 不能导出 SVG；
  导入时只能把整张 SVG 当图片显示，或者取出其中的路径数据交给 `Konva.Path`。
- **复制粘贴、撤销重做**：两边都要自己写，但 Fabric 社区的现成示例更多。
  Konva 的写法见[复制与粘贴](/docs/editor/clipboard)。

反过来，也有 Konva 做起来更自然的：**多图层分别重绘**（背景层不动、只重画交互层）、
**任意节点都能用滤镜**（Fabric 的滤镜只作用于图片对象，Konva 对缓存过的任何节点都可用），
以及官方维护的 **React / Vue / Svelte 绑定**，可以在组件里声明式地写画布。

## 事件对照

| Fabric.js（`canvas.on(...)`） | Konva（`node.on(...)` / `stage.on(...)`） |
|---|---|
| `mouse:down` / `mouse:up` | `pointerdown` / `pointerup`（也有 `mousedown` 与 `touchstart`） |
| `mouse:over` / `mouse:out` | `mouseenter` / `mouseleave` |
| `object:moving` | `dragmove` |
| `object:scaling`、`object:rotating` | `transform` |
| `object:modified` | `dragend` + `transformend`，两个都要监听 |
| `selection:created` / `updated` / `cleared` | 无，选择状态由你自己维护，需要时自行派发 |
| `path:created`（自由绘制结束） | 无，在自己的绘制逻辑里处理 |

另一个区别是事件挂在哪里：Fabric 的事件大多挂在 canvas 上，通过 `e.target` 区分对象；
Konva 的事件可以直接挂在具体节点上，也会沿着节点树向上冒泡到 Group、Layer 和 Stage。

## 与其他方案的取舍

**不值得迁移的情况**：项目已经深度依赖 Fabric 的编辑能力，比如富文本编辑、SVG 往返导入导出、
内置的框选与对齐辅助线，而且没有遇到性能问题。迁移到 Konva 等于把这些功能重写一遍，
换来的只是 API 风格的变化。

**值得迁移的信号**：图形数量上到几千个之后拖动明显卡顿，需要用图层拆分、`listening(false)`、
节点缓存这些手段做局部优化；或者想在 React / Vue 里用组件的方式描述画布，
让画布状态直接进入框架的数据流；或者产品的交互方式和 Fabric 的默认行为差别很大，
一直在和它的内置控制柄、选择逻辑较劲。

迁移策略上，建议**先迁只读的展示部分**（预览图、缩略图、查看器），
它们不涉及编辑逻辑，能最快验证渲染结果一致；编辑器部分最后迁，并且逐个功能替换，
而不是一次性重写。两个库可以在同一个页面里各管一块画布，过渡期并存没有问题。
更完整的选型对比见[Canvas 库怎么选](/docs/guides/best-canvas-library)。

## 常见问题

### Fabric 的 JSON 能直接导入 Konva 吗？

不能。Fabric 的 JSON 是一个 `objects` 数组，每项带 `type` 和 Fabric 自己的属性名；
Konva 的 JSON 是嵌套的节点树，每项是 `{ className, attrs, children }`。
需要写一个转换函数，按类型逐个映射：`type: 'rect'` → `className: 'Rect'`，
`angle` → `rotation`，`left` / `top` 按下一问换算成 `x` / `y`。

### 迁移后图形位置都偏了？

两边的参照点不同。Konva 的矩形、图片、文字以**左上角**为 `x` / `y`，
圆形、正多边形、星形以**中心**为 `x` / `y`，可以用 `offset` 改变参照点。
Fabric 的 `left` / `top` 指向 `originX` / `originY` 所指的点：
**Fabric 7 起默认是中心**（`center` / `center`），Fabric 6 及以前默认是左上角（`left` / `top`）。
所以同一份坐标数据，要先确认它来自哪个 Fabric 版本、有没有改过 origin，再做换算。

### 滤镜效果不一样？

两个库的滤镜是各自实现的，同名滤镜的算法和参数范围不同，数值不能直接照搬。
Fabric 默认用 WebGL 执行滤镜；Konva 的内置滤镜在 CPU 上逐像素计算，
另外支持浏览器原生的 CSS 滤镜字符串，速度更接近 Fabric 的 WebGL 路径，见 [CSS 原生滤镜](/docs/filters/css-filters)。
迁移时建议拿同一张图逐个滤镜对比调参。
