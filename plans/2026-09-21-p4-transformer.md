# Transformer 章节 实施计划（P4）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐官方 `select_and_transform` 章节的 13 页内容与 13 个演示，填上本站完全缺失的 Transformer——Konva 最常用的交互特性。

**Architecture:** 新章节从零建立：文档在 `docs/select-and-transform/`（短横线，与其他文档目录一致），演示在 `static/downloads/code/select_and_transform/`（下划线，与其他演示目录一致）。每页沿用 P3 确立的三段结构（用法 / 常见问题 / 三选一），并把该目录加入 `test/checks/originality.js` 的 `ENFORCED_PREFIXES`——新页面是判重风险最高的内容，原创增量不能省。13 个新演示会被 P2 的演示健康检查自动覆盖。

**Tech Stack:** Docusaurus 3.10.2、Konva 10.x（CDN 浮动大版本）、Node ≥ 20

**Spec:** `specs/2026-09-18-konvajs-site-overhaul-design.md`（§4.3 的 C2 批次、§4.4）

**前置：** P1、P2、P3 已完成并合入 main。

## Global Constraints

以下为项目级约束，每个 Task 的要求都隐含包含本节。

- **禁止参考 `konvajs/site` 仓库的 `i18n/zh-Hans/**`**。该仓库 `license: null`，默认保留所有权利。唯一允许的英文底稿是 `content/docs/select_and_transform/**`。
- **每页必须有三段结构**：`## 用法`、`## 常见问题`（下含 `### 问句？`）、以及「国内环境注意事项 / 与其他方案的取舍 / 性能提示」三选一。这不只是 SEO——三个 h2 是正文内广告位的准入门槛。
- **原创段落必须是官方没有的内容。** 翻译官方正文不算原创，那正是判重风险的来源。
- **CDN 引用一律写 `https://unpkg.com/konva@10/konva.min.js`**，不得钉死精确版本（规格 §4.2.1）。
- **`.md` 代码块与 `static/downloads/code/` 下的演示 HTML 必须逐字一致。** 两者不同步会让读者照着抄的代码跑不出演示的效果。
- **`src/config/ads.ts` 的 `AD_CLIENT`（`ca-pub-9580076271637088`）与 `static/ads.txt` 不得改动。**
- 新页面**不进** `static/_redirects`。§7.2 的 96 条对应迁移前已被收录的 URL，该集合不再增长（规格 §7.2.2）。
- 演示代码必须在真实浏览器里验证过才算完成，`npm run demo-health` 是最低门槛。

---

## 页面清单

13 页，与官方 `content/docs/select_and_transform/` 一一对应。`sidebar_position` 沿用官方的数字前缀顺序。

| # | 文件 | 主题 |
|---|---|---|
| 1 | `basic-demo.md` | 选中、缩放、旋转的最小实现，含框选多个图形 |
| 2 | `centered-scaling.md` | `centeredScaling` 与 ALT 键，从中心缩放 |
| 3 | `keep-ratio.md` | `keepRatio` 与 SHIFT 键，保持宽高比 |
| 4 | `transformer-styling.md` | 锚点填充、描边、尺寸、边框颜色、圆角 |
| 5 | `complex-styling.md` | `anchorStyleFunc` 逐锚点定制 |
| 6 | `transform-events.md` | `transformstart` / `transform` / `transformend` |
| 7 | `resize-limits.md` | `boundBoxFunc` 限制最大最小尺寸 |
| 8 | `resize-snaps.md` | `anchorDragBoundFunc` 让锚点吸附到参考线 |
| 9 | `rotation-snaps.md` | `rotationSnaps` 吸附到 0/90/180/270 度 |
| 10 | `stop-transform.md` | `stopTransform()` 以编程方式中止变换 |
| 11 | `force-update.md` | `forceUpdate()` 处理无法自动感知的深层变化 |
| 12 | `resize-text.md` | 缩放文字时改 `width` 而非 `scale` |
| 13 | `ignore-stroke.md` | `strokeScaleEnabled` 与 `ignoreStroke`，描边不随缩放变粗 |

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `docs/select-and-transform/_category_.json` | 侧边栏分类，`position: 12`（events 之后、拖拽之前） |
| `docs/select-and-transform/*.md` | 13 页内容 |
| `static/downloads/code/select_and_transform/*.html` | 13 个演示 |
| `test/checks/originality.js` | 把新目录加入 `ENFORCED_PREFIXES` |
| `docusaurus.config.ts` | navbar 增加入口 |
| `docs/overview.md` | 教程目录增加该章节 |

---

## Task 1: 章节骨架与基础页

先建目录、分类与第一页，跑通「新章节 + 新演示」这条链路，再批量铺开。

**Files:**
- Create: `docs/select-and-transform/_category_.json`
- Create: `docs/select-and-transform/basic-demo.md`
- Create: `static/downloads/code/select_and_transform/Basic_Demo.html`
- Modify: `docusaurus.config.ts`、`docs/overview.md`

**Interfaces:**
- Consumes: P3 的三段结构约定
- Produces: 路由 `/docs/select-and-transform/basic-demo`；演示 `/downloads/code/select_and_transform/Basic_Demo.html`

- [ ] **Step 1: 建分类**

创建 `docs/select-and-transform/_category_.json`。position 取 12，排在 events（12）之后——
现有分类占 10–21，这里插在事件之后、拖拽之前，需要把后续分类顺延。
**改动顺延时要同时改对应目录的 `_category_.json`**，否则顺序会乱。

实际做法：把新章节定为 `position: 13`，并把原先 13–21 的九个目录各加一。

```json
{
  "label": "选择与变换",
  "position": 13
}
```

随后依次修改（每个文件只改 `position` 一个数字）：

| 目录 | 原 position | 新 position |
|---|---|---|
| `drag-and-drop` | 13 | 14 |
| `clipping` | 14 | 15 |
| `groups-and-layers` | 15 | 16 |
| `filters` | 16 | 17 |
| `tweens` | 17 | 18 |
| `animations` | 18 | 19 |
| `selectors` | 19 | 20 |
| `data-and-serialization` | 20 | 21 |
| `performance` | 21 | 22 |

- [ ] **Step 2: 写演示**

创建 `static/downloads/code/select_and_transform/Basic_Demo.html`。结构与其他演示一致
（同样的 `<style>`、`#container`、`konva@10` 引用）。内容为两个矩形 + Transformer +
框选矩形，支持点击选中、Shift 点击多选、空白处拖拽框选：

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Transformer Basic Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <script>
    var stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight
    });

    var layer = new Konva.Layer();
    stage.add(layer);

    layer.add(new Konva.Rect({
      x: 60, y: 60, width: 100, height: 90,
      fill: 'red', name: 'rect', draggable: true
    }));
    layer.add(new Konva.Rect({
      x: 250, y: 100, width: 150, height: 90,
      fill: 'green', name: 'rect', draggable: true
    }));

    var tr = new Konva.Transformer();
    layer.add(tr);

    // 框选用的半透明矩形
    var selectionRectangle = new Konva.Rect({
      fill: 'rgba(0,0,255,0.5)',
      visible: false,
      listening: false
    });
    layer.add(selectionRectangle);

    var x1, y1, x2, y2, selecting = false;

    stage.on('mousedown touchstart', function (e) {
      // 点在图形上时不启动框选，交给下面的选中逻辑
      if (e.target !== stage) return;
      e.evt.preventDefault();
      x1 = x2 = stage.getPointerPosition().x;
      y1 = y2 = stage.getPointerPosition().y;
      selecting = true;
      selectionRectangle.width(0);
      selectionRectangle.height(0);
    });

    stage.on('mousemove touchmove', function (e) {
      if (!selecting) return;
      e.evt.preventDefault();
      x2 = stage.getPointerPosition().x;
      y2 = stage.getPointerPosition().y;
      selectionRectangle.setAttrs({
        visible: true,
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1)
      });
    });

    stage.on('mouseup touchend', function (e) {
      selecting = false;
      if (!selectionRectangle.visible()) return;
      e.evt.preventDefault();
      selectionRectangle.visible(false);

      var box = selectionRectangle.getClientRect();
      var selected = stage.find('.rect').filter(function (shape) {
        return Konva.Util.haveIntersection(box, shape.getClientRect());
      });
      tr.nodes(selected);
    });

    stage.on('click tap', function (e) {
      // 框选刚结束时不要把这次点击当成选中操作
      if (selectionRectangle.visible()) return;

      if (e.target === stage) {
        tr.nodes([]);
        return;
      }
      if (!e.target.hasName('rect')) return;

      var metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      var isSelected = tr.nodes().indexOf(e.target) >= 0;

      if (!metaPressed && !isSelected) {
        tr.nodes([e.target]);
      } else if (metaPressed && isSelected) {
        var nodes = tr.nodes().slice();
        nodes.splice(nodes.indexOf(e.target), 1);
        tr.nodes(nodes);
      } else if (metaPressed && !isSelected) {
        tr.nodes(tr.nodes().concat([e.target]));
      }
    });
  </script>

</body>
</html>
```

- [ ] **Step 3: 写文档页**

创建 `docs/select-and-transform/basic-demo.md`。`## 用法` 之后嵌入 iframe 与**与演示文件逐字一致**的代码块。

```markdown
---
title: '选中、缩放与旋转'
description: '用 Konva.Transformer 给图形加上可拖拽的控制柄，实现选中、缩放与旋转，并支持 Shift 多选与空白处框选。'
sidebar_position: 1
---

`Konva.Transformer` 是一个特殊节点，它把控制柄画在被选中的图形周围，
让用户可以直接拖拽来缩放和旋转。

## 用法

Transformer 自己也是一个节点，要 `add` 到图层上，再用 `nodes()` 告诉它当前操作哪些图形：

```js
const tr = new Konva.Transformer();
layer.add(tr);
tr.nodes([rect]);
```

`nodes()` 接受数组，传多个图形即可同时变换；传空数组 `tr.nodes([])` 取消选中。

下面的演示在此基础上加了完整的选择交互：点击选中、Shift 点击多选、在空白处拖拽框选。

（此处放 iframe 与代码块）

## 常见问题

### 为什么 Transformer 不显示？

三个最常见的原因：忘了把它 `add` 到图层；`nodes()` 传的是单个节点而不是数组；
或者被操作的图形本身 `visible(false)`。

另外 Transformer 必须和被操作的图形在**同一个图层**上，跨图层时控制柄画在别处，
看起来就是没出现。

### 点击空白处为什么取消不了选中？

`click` 事件在点到空白处时 `e.target` 是 stage 本身，要判断这个条件来清空：

```js
stage.on('click tap', (e) => {
  if (e.target === stage) {
    tr.nodes([]);
  }
});
```

如果同时实现了框选，还要额外判断本次点击是不是框选动作的收尾——
框选结束时浏览器也会派发一次 `click`，不排除掉的话刚框选好的图形立刻被清空。

### 缩放之后图形的 width 没变，变的是 scaleX？

这是 Transformer 的设计：它改的是 `scaleX`/`scaleY`，不是 `width`/`height`。
对大多数图形这没有区别，但对文字和带描边的图形会带来问题——
字号和描边宽度会跟着一起被拉伸。

处理办法见[缩放文字](/docs/select-and-transform/resize-text)与
[描边不随缩放变粗](/docs/select-and-transform/ignore-stroke)两页。

## 性能提示

Transformer 在每次变换中都要重算控制柄位置。选中节点很多时，
Konva 10.4.0 起做了优化——未变化的图形边界会被复用、选择框未变时不重建锚点——
但节点数量仍然是主要成本。

一个实用做法是：批量操作时先 `tr.nodes([])` 解除关联，操作完再重新关联，
避免中间过程触发大量无意义的重算。
```

- [ ] **Step 4: 加导航入口**

`docusaurus.config.ts` 的 `navbar.items` 在「图形」之后插入：

```ts
        { to: '/docs/select-and-transform/basic-demo', position: 'left', label: '变换' },
```

`docs/overview.md` 的「交互与视觉」一节开头插入：

```markdown
- [选择与变换](/docs/select-and-transform/basic-demo)：Transformer 控制柄、缩放限制、旋转吸附与事件
```

- [ ] **Step 5: 构建并验证**

```bash
npm run build && npm run demo-health && node test/verify.js
```

Expected: 构建成功，演示健康 118 个全通过，verify 全绿。

- [ ] **Step 6: 浏览器验证交互**

`npm run serve -- --port 3222 --no-open`，打开
`http://localhost:3222/docs/select-and-transform/basic-demo`，在 iframe 里确认：
点击矩形出现控制柄、拖角能缩放、拖顶部把手能旋转、Shift 点击可多选、
空白处拖拽出现蓝色框选矩形且松手后选中框内图形、点击空白取消选中。

**这一步不能省。** 演示健康检查只验证「没报错、画布非空」，验证不了交互是否真的可用。

- [ ] **Step 7: 提交**

```bash
git add docs static docusaurus.config.ts
git commit -m "feat: 新增「选择与变换」章节与基础页

本站此前完全没有 Transformer 内容，而它是 Konva 最常用的交互特性。
新章节 position 13，原 13-21 的九个分类各顺延一位。"
```

---

## Task 2: 变换行为 4 页

**Files:**
- Create: `docs/select-and-transform/centered-scaling.md`、`keep-ratio.md`、`resize-limits.md`、`rotation-snaps.md`
- Create: `static/downloads/code/select_and_transform/Centered_Scaling.html`、`Keep_Ratio.html`、`Resize_Limits.html`、`Rotation_Snaps.html`

**Interfaces:**
- Consumes: Task 1 的章节骨架
- Produces: 4 个路由与 4 个演示

- [ ] **Step 1: 逐页实现**

每页的演示都以 Task 1 的 HTML 为模板，只改 Transformer 的配置与图形。各页要点：

**`centered-scaling.md`**（`sidebar_position: 2`）— `centeredScaling: true` 让缩放以中心为基准而非对角锚点。
常见问题：① 设了之后拖角为什么图形往两边同时长——这正是「以中心为基准」的含义；
② 按住 ALT 可以临时切换，不设置属性也能用，但这依赖键盘、触屏上没有等价操作；
③ 与 `keepRatio` 同时开启时两者独立生效，不冲突。
第三小节用**与其他方案的取舍**：`centeredScaling` vs 自己在 `transform` 事件里改 `offset`，
指出后者要处理旋转后的坐标换算，没有必要。

**`keep-ratio.md`**（`sidebar_position: 3`）— `keepRatio`（默认 `true`）与 SHIFT 键。
常见问题：① 默认就是 `true`，很多人以为要手动开；② `keepRatio: true` 只作用于**角**锚点，
边锚点本来就是单向拉伸，不受影响；③ 想完全禁止非等比缩放，除了 `keepRatio` 还要用
`enabledAnchors` 只保留四个角。
第三小节用**与其他方案的取舍**：`keepRatio` vs 在 `boundBoxFunc` 里自己算比例，
说明前者已处理好 SHIFT 临时反转，自己实现要额外处理这个交互。

**`resize-limits.md`**（`sidebar_position: 7`）— `boundBoxFunc` 限制尺寸。
**注意官方示例的写法**：它不是简单 `return oldBox`，而是在 `oldBox` 与 `newBox` 之间按比例插值，
把结果钳制到边界上。这一点必须照做并在正文里解释——直接返回 `oldBox` 时，
快速拖动会让图形停在离限制值还有一段距离的地方，手感发黏。

```js
const tr = new Konva.Transformer({
  nodes: [rect],
  boundBoxFunc: (oldBox, newBox) => {
    if (newBox.width > 200) {
      // 在新旧框之间插值，让结果正好落在 200 上；
      // 直接 return oldBox 会让快速拖动时停在半路，手感发黏
      const t = (200 - oldBox.width) / (newBox.width - oldBox.width);
      return {
        x: oldBox.x + t * (newBox.x - oldBox.x),
        y: oldBox.y + t * (newBox.y - oldBox.y),
        width: 200,
        height: oldBox.height + t * (newBox.height - oldBox.height),
        rotation: newBox.rotation,
      };
    }
    return newBox;
  },
});
```

常见问题：① 为什么不能直接 `return oldBox`（答案即上面的手感问题）；
② `boundBoxFunc` 里的 box 是**变换后的包围盒**，含旋转，不能当成未旋转的宽高直接用；
③ 限制最小尺寸时别忘了负值——快速拖过头会让 `width` 变成负数。
第三小节用**性能提示**：`boundBoxFunc` 在拖动过程中每一帧都会被调用，
里面不要做 DOM 查询或复杂计算。

**`rotation-snaps.md`**（`sidebar_position: 9`）— `rotationSnaps: [0, 90, 180, 270]`。
常见问题：① 吸附范围由 `rotationSnapTolerance` 控制，默认 5 度，感觉「不吸」时先调这个值；
② 数组里的角度是绝对角度，不是相对当前角度的增量；
③ 吸附只作用于拖拽旋转把手，用代码 `node.rotation(37)` 不受影响。
第三小节用**与其他方案的取舍**：`rotationSnaps` vs 在 `transform` 事件里四舍五入，
指出后者会在每帧强行改写角度，视觉上是抖动的，而 `rotationSnaps` 只在接近吸附点时生效。

- [ ] **Step 2: 验证**

```bash
npm run build && npm run demo-health && node test/verify.js
```
Expected: 演示健康 122 个全通过；`原创增量段` 此时尚未覆盖新目录，不会报错

- [ ] **Step 3: 浏览器逐页确认交互**

`npm run serve -- --port 3222 --no-open`，逐页确认：居中缩放确实从中心长、
按 SHIFT 能临时切换比例锁定、宽度到 200 就停住且拖动顺滑、旋转在 90 度附近吸附。

- [ ] **Step 4: 提交**

```bash
git add docs static
git commit -m "feat: Transformer 变换行为 4 页

boundBoxFunc 照官方写法在新旧框之间插值钳制，而不是直接 return oldBox——
后者在快速拖动时会让图形停在离限制值还有一段的位置，手感发黏。
正文里解释了这一点。"
```

---

## Task 3: 吸附与事件 4 页

**Files:**
- Create: `docs/select-and-transform/resize-snaps.md`、`transform-events.md`、`stop-transform.md`、`force-update.md`
- Create: 对应的 4 个演示 HTML

**Interfaces:**
- Consumes: Task 1 的章节骨架
- Produces: 4 个路由与 4 个演示

- [ ] **Step 1: 逐页实现**

**`resize-snaps.md`**（`sidebar_position: 8`）— `anchorDragBoundFunc` 让锚点吸附到参考线。
常见问题：① 这个回调收到的是**绝对坐标**，做吸附计算前不需要再转换；
② 它只约束锚点位置，不约束最终尺寸，尺寸限制要另外用 `boundBoxFunc`；
③ 吸附到网格用取整即可，吸附到其他图形的边则要先收集这些边的坐标。
第三小节用**性能提示**：回调每帧触发，参考线坐标应在变换开始时算好缓存起来，
不要在回调里遍历全部图形。

**`transform-events.md`**（`sidebar_position: 6`）— `transformstart` / `transform` / `transformend`。
常见问题：① 事件绑在**被变换的图形**上，不是绑在 Transformer 上；
② `transform` 在拖动过程中高频触发，里面做重活会掉帧，状态同步应放在 `transformend`；
③ Konva 10.4.0 起 `Transformer` 会感知变换过程中对节点的外部修改，
此前在 `transform` 回调里改节点属性会被下一帧覆盖。
第三小节用**性能提示**：`transform` 里避免触发 React/Vue 的状态更新，
那会让每一帧都走一遍框架的渲染流程；正确做法是过程中直接改 Konva 节点，
`transformend` 时再同步回框架状态。

**`stop-transform.md`**（`sidebar_position: 10`）— `stopTransform()`。
常见问题：① 它中止的是当前正在进行的拖拽，图形保持在中止那一刻的状态，不会回滚；
② 想回滚要自己在 `transformstart` 里记下原始属性，`stopTransform()` 之后恢复；
③ Konva 10.6.0 起对未在变换的节点调用 `stopTransform()` 是空操作，不再报错。
第三小节用**与其他方案的取舍**：`stopTransform()` vs 在 `boundBoxFunc` 里拒绝新框，
指出后者只是「不让它继续变大」，拖拽仍在进行；前者是真的结束这次交互。

**`force-update.md`**（`sidebar_position: 11`）— `forceUpdate()`。
常见问题：① 什么时候需要它——Transformer 通过监听节点的变化事件自动更新，
但对分组内部的深层改动（例如往 Group 里新增子节点）感知不到；
② 频繁调用会抵消 Konva 10.4.0 的锚点复用优化，只在确实需要时调；
③ 如果发现 Transformer 位置总是慢一拍，先确认是不是改了节点却没触发变化事件，
而不是到处加 `forceUpdate()`。
第三小节用**性能提示**：`forceUpdate()` 会重算全部锚点，
在动画循环里每帧调用相当于放弃了整套缓存机制。

- [ ] **Step 2: 验证**

```bash
npm run build && npm run demo-health && node test/verify.js
```
Expected: 演示健康 126 个全通过

- [ ] **Step 3: 浏览器确认**

重点确认 `transform-events` 页的事件日志确实按 start→transform×N→end 的顺序输出，
以及 `stop-transform` 页点击按钮后拖拽立即结束。

- [ ] **Step 4: 提交**

```bash
git add docs static
git commit -m "feat: Transformer 吸附与事件 4 页

写明变换事件绑在被变换的图形上而非 Transformer 上，以及 transform 回调
高频触发时不应触发框架状态更新——过程中直接改 Konva 节点，
transformend 再同步回去。"
```

---

## Task 4: 样式与特例 4 页

**Files:**
- Create: `docs/select-and-transform/transformer-styling.md`、`complex-styling.md`、`resize-text.md`、`ignore-stroke.md`
- Create: 对应的 4 个演示 HTML

**Interfaces:**
- Consumes: Task 1 的章节骨架
- Produces: 4 个路由与 4 个演示，章节 13 页齐全

- [ ] **Step 1: 逐页实现**

**`transformer-styling.md`**（`sidebar_position: 4`）— 锚点与边框样式。
常见问题：① 锚点样式属性是 `anchorFill`、`anchorStroke`、`anchorSize`、`anchorCornerRadius`，
边框是 `borderStroke`、`borderDash`；② `anchorSize` 改大后点击区域也跟着变大，
移动端上建议设到 16 以上；③ 想隐藏某些锚点用 `enabledAnchors`，不要把 `anchorSize` 设成 0——
那样锚点不可见但仍可点中。
第三小节用**国内环境注意事项**：移动端浏览器（尤其是微信内置浏览器）的触摸目标下限
比桌面大得多，默认 10 像素的锚点在手机上很难点准；给触屏场景单独放大 `anchorSize`
并配合 `Konva.hitOnDragEnabled` 提升手感。

**`complex-styling.md`**（`sidebar_position: 5`）— `anchorStyleFunc` 逐锚点定制。
常见问题：① 回调收到的是锚点节点本身，用 `anchor.name()` 区分是哪一个
（如 `'top-left'`、`'rotater'`）；② 在回调里改属性即可，不需要返回值；
③ 想隐藏单个锚点在回调里 `anchor.visible(false)`，比用 `enabledAnchors` 更灵活。
第三小节用**与其他方案的取舍**：`anchorStyleFunc` vs 全局 `anchorFill` 等属性，
指出后者一次改全部、前者可按锚点区分，但每次更新都会调用，逻辑要保持轻量。

**`resize-text.md`**（`sidebar_position: 12`）— 缩放文字。
**核心事实**：Transformer 改的是 `scaleX`，直接缩放会把字形拉变形。正确做法是在
`transform` 事件里把缩放量折算成 `width` 并把 `scaleX` 复位：

```js
const tr = new Konva.Transformer({
  nodes: [text],
  // 只留左右两个锚点，这样只改宽度、不改字号
  enabledAnchors: ['middle-left', 'middle-right'],
});
layer.add(tr);

text.on('transform', function () {
  text.setAttrs({
    width: text.width() * text.scaleX(),
    scaleX: 1,
  });
});
```

常见问题：① 为什么不能直接让文字跟着 `scale`——那是把字形拉伸，不是改字号，
横向拉长的文字笔画会变粗变扁；② 想改字号而不是宽度，把 `fontSize` 按 `scaleY` 折算，
同样要复位 `scaleY`；③ 复位必须在 `transform` 而不是 `transformend`，
否则拖动过程中看到的是拉伸变形的中间态。
第三小节用**与其他方案的取舍**：改 `width`（文字重新排版换行）vs 改 `fontSize`（整体变大），
指出这是两种不同的产品语义，要先想清楚用户期望哪一种。

**`ignore-stroke.md`**（`sidebar_position: 13`）— 描边不随缩放变粗。
**两种做法**（官方示例给的就是两种，都要写）：

```js
// 做法一：变换结束后把 scale 折算进 width/height 并复位
rect1.on('transformend', () => {
  const scaleX = rect1.scaleX();
  const scaleY = rect1.scaleY();
  rect1.scaleX(1);
  rect1.scaleY(1);
  rect1.width(Math.max(5, rect1.width() * scaleX));
  rect1.height(Math.max(5, rect1.height() * scaleY));
});

// 做法二：直接关掉描边缩放
const rect2 = new Konva.Rect({
  // ...
  strokeScaleEnabled: false,
});
```

常见问题：① 两种做法的区别——做法一让节点始终保持 `scale: 1`，属性值是真实尺寸，
适合需要把尺寸存回服务端的场景；做法二只是显示上不缩放描边，`scaleX` 仍然不是 1；
② `Transformer` 上还有一个 `ignoreStroke`，它控制的是**控制柄边框**是否把描边计入包围盒，
和图形自身的描边缩放是两回事，名字相近很容易混；
③ 做法一里的 `Math.max(5, ...)` 不是装饰——快速拖过头时宽度会变成极小值甚至负数。
第三小节用**与其他方案的取舍**：说明什么时候该选哪一种，以及为什么不建议两个都开
（都开之后描边既不缩放、尺寸又被折算，视觉上描边相对图形会越来越细）。

- [ ] **Step 2: 验证**

```bash
npm run build && npm run demo-health && node test/verify.js
```
Expected: 演示健康 130 个全通过

- [ ] **Step 3: 浏览器确认**

重点确认 `resize-text` 页拖动左右锚点时文字**重新换行**而不是被拉扁，
`ignore-stroke` 页两个矩形缩放后描边粗细都没变。

- [ ] **Step 4: 提交**

```bash
git add docs static
git commit -m "feat: Transformer 样式与特例 4 页，章节 13 页齐全

resize-text 与 ignore-stroke 是 Transformer 最常被问到的两个问题，
根源都是它改的是 scale 而非 width/height。两页分别给出折算复位的写法。

顺带辨析一处易混：Transformer 的 ignoreStroke 控制的是控制柄包围盒是否
计入描边，与图形自身的 strokeScaleEnabled 是两回事。"
```

---

## Task 5: 启用原创校验与收尾

**Files:**
- Modify: `test/checks/originality.js`
- Modify: `README.md`
- Modify: `specs/2026-09-18-konvajs-site-overhaul-design.md`

**Interfaces:**
- Consumes: Task 1–4 的 13 页
- Produces: 新章节纳入 CI 强制校验

- [ ] **Step 1: 把新目录加入强制校验**

`test/checks/originality.js` 的 `ENFORCED_PREFIXES` 改为：

```js
const ENFORCED_PREFIXES = ['docs/shapes/', 'docs/select-and-transform/'];
```

- [ ] **Step 2: 运行，修掉不合规的页面**

Run: `node test/verify.js`

若某页报「缺第三类小节」或「小节字数不足」，补齐后重跑。
**不要为了过检查而放宽校验器**——门槛本身就是这套机制的价值所在。

- [ ] **Step 3: 度量**

Run: `node test/lib/content-stats.mjs`

记录 `select-and-transform` 的散文中位数、h2 中位数，以及全站「够正文内广告位门槛」
的页数变化（P3 结束时为 22 / 97）。写进下一步的提交信息。

- [ ] **Step 4: 规格补记**

在 §4.3 的批次表下方追加：

```markdown
**C2 进度**：`select_and_transform` 13 页已于 P4 完成，路由为
`/docs/select-and-transform/*`，并已纳入 `test/checks/originality.js` 的强制校验。
`guides` 2 页、`nodejs` 1 页、根级 8 页仍待补。
```

- [ ] **Step 5: README 补记**

在目录结构一节把页数从 97 更新为 110，并在 `originality` 检查器那一行的说明里
补上当前生效范围：`docs/shapes/` 与 `docs/select-and-transform/`。

- [ ] **Step 6: 全量验收**

Run: `npm run check`
Expected: 全部 PASS

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "chore: 新章节纳入原创校验并收尾"
```

---

## 计划自审

**规格覆盖核对：**

| 规格章节 | 对应 Task |
|---|---|
| §4.3 C2 批次的 `select_and_transform` 13 页 | Task 1–4 |
| §4.4 原创增量段 | 每页的「常见问题」与第三类小节；Task 5 纳入强制校验 |
| §6.4 FAQPage | 自动生成，无需额外工作——插件对所有含「常见问题」小节的页面生效 |
| §7.2.2 新增页面不进 301 表 | 本计划不改 `static/_redirects` |
| §4.2.1 浮动大版本 | 13 个新演示统一用 `konva@10` |

**未在本计划覆盖、明确留给后续计划的规格条目：**

- C2 剩余部分：`guides` 2 页、`nodejs` 1 页、根级 8 页
- C3–C6：既有章节增量 21 页、react/vue/svelte/angular 60 页、sandbox 69 页、posts 9 页
- shapes 之外既有章节的原创增量段（events 15 页、performance 10 页等共 77 页）

**类型一致性核对：**文档目录用短横线 `docs/select-and-transform/`，演示目录用下划线
`static/downloads/code/select_and_transform/`，与仓库既有约定一致（`docs/drag-and-drop/`
对应 `static/downloads/code/drag_and_drop/`）。`ENFORCED_PREFIXES` 中的路径必须与文档
目录名逐字一致，写成下划线会静默匹配不到任何文件——校验器对此有兜底：
匹配不到任何页面时会直接报错而非默默通过。`sidebar_position` 沿用官方数字前缀顺序
（1–13），与 `_category_.json` 的 `position: 13` 是两个层级的排序，互不影响。
