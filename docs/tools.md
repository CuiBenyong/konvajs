---
title: '周边工具'
description: 'Konva 生态工具清单：官方框架绑定 react-konva / vue-konva / svelte-konva、TypeScript 类型、调试与性能分析手段，以及社区常用的配套库。'
sidebar_position: 4
---

Konva 本身只做画布运行时，周边由几个官方绑定和一些社区库补齐。
这一页把它们和**调试手段**放在一起——后者才是日常更需要的。

## 官方框架绑定

三个都由 Konva 作者维护，把场景图映射成框架的组件树：

- <a href="https://github.com/konvajs/react-konva" target="_blank">react-konva</a>——
  最成熟的一个，用自定义 reconciler 实现，写法是 `<Stage><Layer><Rect /></Layer></Stage>`。
- <a href="https://github.com/konvajs/vue-konva" target="_blank">vue-konva</a>——
  Vue 2 / 3 均支持，组件名带 `v-` 前缀。
- <a href="https://github.com/konvajs/svelte-konva" target="_blank">svelte-konva</a>——
  较新，API 面比前两者小。

用不用绑定层是个真实的取舍。**好处**是画布内容进入了框架的数据流，
状态变更自动反映到画面上，和表单、面板的联动写起来自然。
**代价**是多了一层抽象：性能问题更难定位（一次重渲染到底改了哪些节点不直观）、
命令式的 API（`node.cache()`、`tween.play()`）需要通过 ref 穿透，
而且高频动画走框架的 diff 通常比直接操作节点慢。

常见的折中是**混用**：静态结构用绑定层声明，
高频交互（拖拽中的实时反馈、动画）拿到 ref 后直接操作 Konva 节点，
交互结束时再把结果同步回框架状态。

## TypeScript

**不需要装 `@types/konva`**，类型声明随 `konva` 包一起分发。
历史上存在过一个 `@types/konva` 包，现已废弃，装了反而会冲突。

```ts
import Konva from 'konva';

const rect = new Konva.Rect({ x: 0, y: 0, width: 10, height: 10 });
rect.fill('red');                    // ✅
rect.fill(123);                      // ❌ 类型错误
```

要注意的是 `find()` 和 `findOne()` 返回的是基类型，
需要自己断言成具体图形：

```ts
const circle = layer.findOne<Konva.Circle>('#target');
circle?.radius(50);
```

## 调试手段

Canvas 上的东西在 DevTools 的 Elements 面板里看不到——整个画布只是一个
`<canvas>` 标签。所以调试方式和 DOM 完全不同。

**数一数有多少节点。** 性能问题的第一步永远是确认规模：

```js
console.log('总节点', stage.find('Shape').length);
console.log('在监听的', stage.find('Shape').filter((n) => n.isListening()).length);
console.log('图层数', stage.getLayers().length);
```

第二行往往是关键——大量本可以关掉监听的节点仍在命中图里绘制，
是最常见的性能浪费。

**把场景图打出来看结构。** `stage.toJSON()` 输出的是完整的节点树，
比在代码里追 `add()` 调用清楚得多。节点多的时候只看某个分支：
`group.toJSON()`。

**确认某个节点到底在哪。** 坐标是相对父容器的，嵌套几层之后很难心算：

```js
console.log(node.getAbsolutePosition());   // 舞台坐标系里的实际位置
console.log(node.getClientRect());         // 含变换与描边的实际包围盒
```

`getClientRect()` 比 `width()` / `height()` 可靠得多——
后者在 Group 上直接返回 0，在缩放过的节点上不含缩放。

**看命中图。** 命中问题最直接的排查方式是把命中图画出来：

```js
document.body.appendChild(layer.getHitCanvas()._canvas);
```

能点中的区域在这张图上是有颜色的，点不中的是透明的，一眼就能看出问题。

**看有几个 canvas。** Chrome DevTools 的 Layers 面板能看到实际的合成层。
图层拆过头（十几个 Layer）时内存占用会很显眼。

## 常见问题

### 有官方的可视化编辑器吗？

没有。Konva 是运行时库，不提供设计器。

社区出现过几个基于 Konva 的编辑器项目，但维护状态普遍不稳定，
放进生产项目前一定要看最近的提交时间和 issue 响应情况。
更常见的做法是自己用 `Transformer` 搭一个满足自身需求的编辑层——
这也正是 Konva 相对 Fabric.js 的定位差异，见
[Canvas 库怎么选](/docs/guides/best-canvas-library)。

### 怎么定位是哪个节点在拖慢渲染？

Konva 没有内置的性能面板，靠 Chrome Performance 录制 + 二分排查：

1. 录一段卡顿，看 `Layer.draw` 的耗时占比。如果主要时间在脚本而不是绘制，
   问题在你的业务逻辑不在 Konva。
2. 绘制耗时高的话，**二分注释掉图层**，看去掉哪一层之后恢复流畅。
3. 定位到图层之后，检查这一层里有没有：开着滤镜的节点、
   带阴影的大面积图形（`shadowBlur` 很贵）、
   以及大量本可以 `listening(false)` 的节点。

见 [性能优化总览](/docs/performance/all-performance-tips)。

### 能在测试里跑 Konva 吗？

可以，但需要给它一个画布实现。jsdom **不带** canvas，
`new Konva.Stage()` 会抛 `unsupported environment`。

两条路：在 Node 环境里用 `konva/canvas-backend`
（见 [在 Node.js 中使用 Konva](/docs/nodejs/nodejs-setup)），
适合断言导出的像素；或者用真实浏览器跑（Playwright、Cypress），
适合断言交互行为。

单元测试里更实用的做法是**不测画面，测状态**——
把「点了之后哪个节点的哪个属性变成什么」作为断言对象，
而不是比对截图。截图比对在字体和抗锯齿上太脆。

## 国内环境注意事项

**CDN。** unpkg 与 jsdelivr 在国内的可达性不稳定，时快时不通。
本站演示用的是 `https://unpkg.com/konva@10/konva.min.js`，
自己的生产项目不建议这么写——把 Konva 打进自己的 bundle 最稳，
必须用 CDN 的话可以换成 npmmirror 的镜像：

```html
<script src="https://registry.npmmirror.com/konva/10/files/konva.min.js"></script>
```

**npm 安装。** 换成国内镜像能大幅加快安装：

```bash
npm config set registry https://registry.npmmirror.com
```

代价是 `npm audit` 会失效——npmmirror 没有实现安全审计接口，
需要审计时得临时切回官方源，或者直接调官方的批量通告接口。

**GitHub。** 仓库访问不稳时，只查阅代码可以把 URL 里的 `github.com`
改成 `github.dev` 直接在网页版 VS Code 里看，比克隆快也更可靠。
