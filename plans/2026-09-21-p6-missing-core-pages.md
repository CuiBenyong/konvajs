# P6 补齐缺失（核心文档部分）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐官方 12 个既有章节缺的 23 页，以及 `guides` 2 页、`nodejs` 1 页、根级 5 页，共 **31 页**，使本站核心文档部分与官方对齐。

**Architecture:** 每页一个 Markdown 文件放进既有 `docs/<章节>/` 目录，侧边栏靠 `sidebar_position` 与 `_category_.json` 自动生成，不手工登记。需要演示的页在 `static/downloads/code/<章节>/<Demo_Name>.html` 放一个可独立运行的 HTML，页内用 `<iframe>` 引用。每页必须满足 §4.4 的原创增量结构，由 `test/checks/originality.js` 强制。

**Tech Stack:** Docusaurus 3.10.2、React 19.3、TypeScript ~5.9.3、Node ≥ 20；演示页为纯 HTML + `https://unpkg.com/konva@10/konva.min.js`。

**Spec:** `specs/2026-09-18-konvajs-site-overhaul-design.md`（尤其 §4.3 分批计划、§4.4 重复内容对冲、§7.2.2 新增页不进 301 表、§9 验收脚本）

---

## 缺口全景（本计划的定位）

官方 sitemap 实测 **277 个 `/docs/` 页**。本站现有 110 页，其中 3 页是本站原创、官方没有的（`filters/css-filters`、`filters/rgba`、`performance/shape-redraw`），故与官方对齐的是 **107 页**，缺 **170 页**。

| 批次 | 内容 | 页数 | 计划文件 |
|---|---|---:|---|
| **P6（本计划）** | 12 个既有章节 +23、`guides` 2、`nodejs` 1、根级 5 | **31** | 本文件 |
| P7 | `react` 19、`vue` 13、`svelte` 16、`angular` 12 | 60 | 待写 |
| P8 | `sandbox` 69 + 根级 `sandbox` 画廊索引 1 | 70 | 待写 |
| P9 | `posts` 9 | 9 | 待写 |

合计 31 + 60 + 70 + 9 = **170**，与实测缺口一致。全部完成后本站 277 + 3 = **280 页**。

**为什么 P6 只做这 31 页**：P7 需要引入 Sandpack 之类的 React 实时演示基建，P8 需要 43 个全新的演示 HTML（26 个已在仓库里），P9 是长文而非 API 文档——三者各自是独立子系统，混进一个计划里既无法独立验收，也会让任何一处受阻拖住全部。P6 是纯增量：不引入任何新依赖、新组件、新路由规则。

## Global Constraints

以下为 spec 的全局约束，**每个 Task 的要求都隐含包含本节**：

- `AD_CLIENT` 固定为 `ca-pub-9580076271637088`，**不得修改**——改了会破坏 `static/ads.txt` 的账号关联。
- `static/ads.txt` 内容**不得修改**。
- `src/components/Ad/` 下**不得出现 `setInterval` / `setTimeout`**——定时刷新广告违反 AdSense 版位政策，可能导致账号受限。由 `test/checks/ads.js` 强制。
- **不得参考 `konvajs/site` 仓库的 `i18n/zh-Hans/**`**——该仓库 `license: null`（保留所有权利）。只有英文 `content/docs/**` 可作为素材来源。本计划的所有 API 事实均取自 **`konva@10.6.0` npm 包的源码**，不取自官方译文。
- 所有 CDN 引用必须是 **`konva@10`**（浮动大版本），不得写死小版本。由 `test/checks/konva-version.js` 强制。
- `static/_redirects` 里的 96 条 301 **不得删除**。新增页面**不进** 301 表（spec §7.2.2）——它们在迁移前不存在，没有已收录的旧 URL。
- 每页必须有 **≥ 3 个 h2**，其中必须有 **`## 常见问题`**（下含 `### 问句`，供 FAQPage 结构化数据抽取），以及 **`## 国内环境注意事项` / `## 与其他方案的取舍` / `## 性能提示`** 三者之一；这两类小节各自 **≥ 150 字**。由 `test/checks/originality.js` 强制，范围是整个 `docs/`，新页自动纳入。
- 演示文件名与页面文件名必须**归一化后相等**（去大小写、下划线、连字符后比较）。由 `test/checks/demos.js` 强制。例：`docs/filters/custom-filter.md` → `static/downloads/code/filters/Custom_Filter.html`。
- 演示里的图片一律用**站内绝对路径** `/assets/<file>`，不得引外部图床——外链图片会让 `demo-health` 受网络波动影响，且国内可达性不可控。
- 所有内部链接必须指向**已存在**的页面。`onBrokenLinks: 'throw'`，指向本计划后续 Task 才创建的页面会导致构建失败。**若必须提前引用，先写成纯文字，在创建目标页的 Task 里再补链接。**

## 侧边栏位置分配（全局，Task 1 落地）

根级页用 `sidebar_position`，章节用 `_category_.json` 的 `position`，两者在同一个序列里排序，**不得冲突**：

| 位置 | 对象 | 状态 |
|---:|---|---|
| 1 | `docs/intro.md` | 已有 |
| 2 | `docs/overview.md` | 已有 |
| 3 | `docs/faq.md` | **新增**（Task 2） |
| 4 | `docs/tools.md` | **新增**（Task 2） |
| 5 | `docs/ai-tools.md` | **新增**（Task 3） |
| 6 | `docs/guides/` | **新增**（Task 1） |
| 10–22 | 12 个既有章节 | 已有，不动 |
| 23 | `docs/nodejs/` | **新增**（Task 2） |
| 97 | `docs/about.md` | **新增**（Task 3） |
| 98 | `docs/donate.md` | **新增**（Task 3） |
| 99 | `docs/support.md` | 已有 |

## 本计划据以写作的 Konva 10.6.0 源码事实

这些是从 `konva@10.6.0` 包内源码直接读出的，**不是从官方文档转述的**。每条都是某一页的原创增量骨架。

| # | 事实 | 出处 | 用在 |
|---|---|---|---|
| F1 | `Brighten` 已标记 `@deprecated`，官方要求改用 `Brightness` | `lib/filters/Brighten.js:5` | `filters/brightness.md`、`filters/brighten.md` |
| F2 | `Brighten` 与 `Brightness` **共用同一个 `brightness()` 访问器**，但语义相反：`Brighten` 是加法 `data[i] += brightness*255`（中性值 `0`），`Brightness` 是乘法 `data[i] *= brightness`（中性值 `1`）。只换滤镜不换值会静默毁图：`brightness(0)` 在 `Brighten` 下无变化，在 `Brightness` 下**全黑** | `Brighten.js:16-25`、`Brightness.js:14-23` | `filters/brightness.md` |
| F3 | `Brightness` 对**未设置**的 `brightness` 按 `1` 处理（`this.attrs.brightness === undefined ? 1 : ...`），但访问器注册的默认值是 `0`。所以 `node.brightness()` 读到 `0`，滤镜却按 `1` 算；一旦显式 `brightness(0)` 就变全黑 | `Brightness.js:15`、`Brighten.js:27` | `filters/brightness.md` |
| F4 | `threshold` 访问器**被 `Mask.js` 和 `Threshold.js` 各注册一次**（默认都是 `0.5`），语义完全不同：`Threshold` 用作 `threshold()*255` 的分界值，`Mask` 用作 RGB 距离容差。两个滤镜叠在同一节点上**无法各自调参** | `Mask.js:169`、`Threshold.js:24` | `filters/mask.md`、`filters/threshold.md` |
| F5 | `Threshold` 的循环是 `i += 1` 而非 `i += 4`，**alpha 通道也被二值化**。透明背景的图过一遍 Threshold，边缘会变成完全硬的锯齿 | `Threshold.js:18-22` | `filters/threshold.md` |
| F6 | `Mask` 靠采样**四个角的像素**推断背景色（`pixelAt(0,0)`、`(w-1,0)`、`(0,h-1)`、`(w-1,h-1)`），主体只要碰到任一角就抠不干净 | `Mask.js:27-31` | `filters/mask.md` |
| F7 | `Solarize` 的阈值**硬编码为 128**，没有配置项；它读的是 sRGB 亮度 `0.2126R + 0.7152G + 0.0722B` | `Solarize.js:12,17` | `filters/solarize.md` |
| F8 | `HSL` 与 `HSV` **都注册 `hue` 和 `saturation`**，`HSL` 另有 `luminance`，`HSV` 另有 `value`。同时挂两个滤镜时 hue/saturation 会被应用两次 | `HSL.js:4,12,20`、`HSV.js:44,52,60` | `filters/hsl.md`、`filters/hsv.md` |
| F9 | `Emboss` 的 `embossDirection` 只接受 `'top-left' \| 'top' \| 'top-right' \| 'right' \| 'bottom-right' \| 'bottom' \| 'bottom-left' \| 'left'`，内部映射成角度（`top-left` → 315°）；**传错字符串不会报错**，静默回退到 315° | `Emboss.js:27-36` | `filters/emboss.md` |
| F10 | `Contrast` 的换算是 `Math.pow((contrast + 100) / 100, 2)`，取值范围 −100 到 100；`contrast(-100)` 得到 `adjust = 0`，画面**变成纯灰**而不是"低对比" | `Contrast.js:14` | `filters/contrast.md` |
| F11 | 自定义滤镜的签名是 `filter.call(context, imageData, pixelRatio)`——10.6.0 起**第二个参数是 pixelRatio**。忽略它会让缓存 `pixelRatio > 1` 时按像素计的效果（位移、块大小）在高分屏上尺寸减半 | `Node.js:75`、`Node.js:2836` | `filters/custom-filter.md` |
| F12 | `Sepia` 用固定矩阵（`r*0.393 + g*0.769 + b*0.189` 等），无配置项，**不可调强度**；要半程效果只能自己写自定义滤镜插值 | `Sepia.js:13-20` | `filters/sepia.md` |
| F13 | `Pixelate` 的 `pixelSize` 默认 `8`，单位是**节点坐标**而非缓存像素——`Node.js:2835` 明确 "Blur radii, pixelation sizes and CSS lengths use node coordinates, independent of cache pixelRatio" | `Pixelate.js:67`、`Node.js:2835` | `filters/pixelate.md` |
| F14 | `RGB` 注册 `red`/`green`/`blue`（校验器 `RGBComponent`，0–255）；`RGBA` **只额外注册 `alpha`**（0–1，被 `Math.min(1, Math.max(0, val))` 夹取），复用 RGB 的三个通道 | `RGB.js:27,36,45`、`RGBA.js:28` | `filters/rgb.md` |
| F15 | `Noise` 的 `noise` 默认 `0.2` | `Noise.js:24` | `filters/noise.md` |
| F16 | `Enhance` 的 `enhance` 默认 `0`；它按每个通道的实际最小/最大值做线性拉伸，**本身没有"过度增强"的上限保护** | `Enhance.js:118` | `filters/enhance.md` |
| F17 | 源码里有 `Posterize.js`（注册 `levels`，默认 `0.5`），但**官方文档没有这一页** | `lib/filters/Posterize.js:25` | `filters/custom-filter.md`（作为"先翻源码再自己写"的例子） |
| F18 | `setZIndex` 会校验范围：`zIndex < 0 || zIndex >= this.parent.children.length` 时**只 warn 不抛错**，该次调用被忽略 | `Node.js:1255-1269` | `groups-and-layers/z-index.md` |
| F19 | `zIndex` 是**父容器内的索引**，不是 CSS 那样的全局值。源码注释原文："zIndex is not absolute (like in CSS). It is relative to parent element only." | `Node.js:2445-2458` | `groups-and-layers/z-index.md` |
| F20 | `fillAfterStrokeEnabled` 默认 **`false`**，即默认先填充后描边（描边压在填充上） | `Shape.js:656` | `styling/fill-stroke-order.md` |
| F21 | `toDataURL` / `toImage` / `toCanvas` / `toBlob` 的 `pixelRatio` **默认是 1，不是设备像素比**。这意味着在 2x 屏上导出的图默认比屏幕上看到的糊一半 | `Node.js:1715,1748,1776,1812,1852` | `data-and-serialization/high-quality-export.md` |
| F22 | `cache()` 的 `pixelRatio` 默认则是 `Konva.pixelRatio`（设备像素比）——**与导出的默认值不一致**，这是两处最容易混淆的地方 | `Node.js:240` | `data-and-serialization/high-quality-export.md` |
| F23 | `Konva.pointerEventsEnabled` 默认 `true`。指针事件名：`pointerdown`/`pointermove`/`pointerup`/`pointercancel`/`pointerclick`/`pointerdblclick`/`pointerover`/`pointerout`/`pointerenter`/`pointerleave` | `Global.js:40`、`Stage.js:10,23-41` | `events/pointer-events.md` |
| F24 | Konva 内部把一次指针交互按 `pointerType` **同时派发两套事件**：鼠标时 `pointerdown` → 也触发 `mousedown`，触摸时 `pointerdown` → 也触发 `touchstart`。同时监听 `pointerdown` 和 `mousedown` 会**收到两次** | `Stage.js:32-50` | `events/pointer-events.md`、`events/mobile-tap-and-click.md` |
| F25 | `Konva.dragDistance` 默认 `3`（px）；`Konva.hitOnDragEnabled` 默认 `false`——拖拽过程中不做命中检测 | `Global.js:61,107` | `events/mobile-tap-and-click.md` |

---

### Task 1: `guides` 章节（2 页）

先做 `guides`，因为这两页是本计划里**唯一不依赖任何演示**、且 SEO 价值最高的页（"canvas 库怎么选"是高意图长尾词），可以先把新章节目录这条路走通，再铺量。

**Files:**
- Create: `docs/guides/_category_.json`
- Create: `docs/guides/why-konva.md`
- Create: `docs/guides/best-canvas-library.md`

**Interfaces:**
- Consumes: 无（首个 Task）
- Produces: 路由 `/docs/guides/why-konva`、`/docs/guides/best-canvas-library`。后续 Task 与既有 `docs/overview.md` 的「与其他方案的取舍」可链接到这两条。

- [ ] **Step 1: 建章节目录与分类配置**

```bash
mkdir -p /Volumes/External/works/self/konvajs/docs/guides
cat > /Volumes/External/works/self/konvajs/docs/guides/_category_.json <<'EOF'
{
  "label": "选型指南",
  "position": 6
}
EOF
```

- [ ] **Step 2: 写 `docs/guides/why-konva.md`**

frontmatter：
```yaml
---
title: '为什么选择 Konva'
description: 'Konva 解决的核心问题：把 Canvas 的一次性绘制变成可持有状态、可响应事件、可独立变换的对象树，以及它相对原生 Canvas、SVG、Fabric.js、PixiJS 的适用边界。'
sidebar_position: 1
---
```

必须包含的 h2（满足 `originality.js`）：
- `## Konva 解决的问题`——原生 Canvas 是**即时模式**：`fillRect` 之后画布上只剩像素，没有"那个矩形"这个对象，想让它响应点击就得自己维护一份图形列表并做命中检测。Konva 提供的是**保留模式**的场景图：节点持有属性、能绑事件、能独立变换，重绘由框架负责。
- `## 什么时候不该用 Konva`——只画静态图表、无交互、对包体积敏感时，原生 API 更合适；需要 CSS 控制样式、要求屏幕阅读器可访问时用 SVG。
- `## 常见问题`（≥150 字，含 `###` 问句）：
  - `### Konva 和原生 Canvas 的性能差多少？`——Konva 的开销来自场景图维护与命中图（hit graph）。图形数量少时原生更快；数量多且需要交互时，自己实现的命中检测通常比 Konva 的离屏命中图更慢。
  - `### 需要引入整个 Konva 吗？`——Konva 10.0.0 起是 ESM，支持 tree-shaking；但 `Konva` 命名空间的动态查找（如反序列化）会把大部分图形类拉进来。
  - `### 学习成本高吗？`——核心概念只有 Stage / Layer / Group / Shape 四层，一天能上手；难点在性能调优（缓存、图层拆分）而非 API。
- `## 与其他方案的取舍`（≥150 字）——原生 Canvas / SVG / Fabric.js / PixiJS 四个方向的分界线。**注意**：`docs/overview.md` 末尾已有一段同主题内容，本页必须**更深入而非重复**（讲清楚"即时模式 vs 保留模式"这个根本区别、WebGL 上下文丢失的处理成本、SVG 在千级元素下的 DOM 开销拐点），并在 `docs/overview.md` 里加一条链接指向本页。

- [ ] **Step 3: 写 `docs/guides/best-canvas-library.md`**

frontmatter：
```yaml
---
title: 'Canvas 库怎么选'
description: '按需求维度对比 Konva、Fabric.js、PixiJS、原生 Canvas 与 SVG：交互复杂度、图形数量、渲染后端、包体积与生态，给出可直接套用的选型结论。'
sidebar_position: 2
---
```

必须包含的 h2：
- `## 先确定三个维度`——① 要不要交互（点击/拖拽/变换）；② 同屏图形数量级（十 / 千 / 万）；③ 要不要 GPU（着色器、粒子）。
- `## 逐个方案的适用边界`——一张对比表，列：渲染后端、保留模式、内置变换控件、包体积量级、典型场景。
- `## 常见问题`（含 `###` 问句）：
  - `### 万级图形应该选什么？`——Canvas 2D 到万级会开始掉帧，此时要么上 PixiJS（WebGL），要么在 Konva 里用 `listening(false)` + 图层拆分 + `cache()`，参考 [性能优化](/docs/performance/all-performance-tips)。
  - `### Fabric.js 和 Konva 到底差在哪？`——Fabric 内置了完整的图形编辑器能力（自由绘制、SVG 导入导出、滤镜 UI），适合直接做设计工具；Konva 更轻、API 更一致，适合把画布嵌进自己的产品里自行定义交互。
  - `### 已经用了 ECharts / D3 还需要 Canvas 库吗？`——图表库已经封装了渲染，除非要在图表之上叠加自定义的可拖拽标注层，否则不需要。
- `## 与其他方案的取舍`（≥150 字）——给出一句话决策树。

**链接约束**：本页可链接 `/docs/performance/all-performance-tips`、`/docs/intro`（均已存在）；**不得**链接本计划后续才创建的页面。

- [ ] **Step 4: 在 `docs/overview.md` 补一条指向 guides 的链接**

在 `## 与其他方案的取舍` 段末追加一行：

```markdown
这一节只给结论。完整的对比维度、各方案的性能拐点与选型决策树，见
[为什么选择 Konva](/docs/guides/why-konva) 与 [Canvas 库怎么选](/docs/guides/best-canvas-library)。
```

- [ ] **Step 5: 构建并跑校验**

```bash
cd /Volumes/External/works/self/konvajs && npm run build && npm run verify
```
Expected: 构建成功（`onBrokenLinks: 'throw'` 不报错），16 项检查全 PASS。特别确认「原创增量」这一项没有报新页缺小节。

- [ ] **Step 6: 提交**

```bash
cd /Volumes/External/works/self/konvajs
git add docs/guides docs/overview.md
git commit -m "$(cat <<'EOF'
docs: 新增 guides 选型指南 2 页

官方 /docs/guides/ 下的两页本站一直缺。这两页是纯文字、不需要演示，
同时「canvas 库怎么选」是高意图长尾词，先做它们把新章节目录这条路走通。

overview.md 末尾已有一段同主题内容，保留并加链接指向新页，
新页讲即时模式与保留模式的根本区别，不复述 overview 的结论。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `nodejs` 章节 1 页 + 根级 `faq` / `tools`

**Files:**
- Create: `docs/nodejs/_category_.json`
- Create: `docs/nodejs/nodejs-setup.md`
- Create: `docs/faq.md`
- Create: `docs/tools.md`

**Interfaces:**
- Consumes: Task 1 的 `docs/guides/*`（`faq.md` 会链接过去）
- Produces: 路由 `/docs/nodejs/nodejs-setup`、`/docs/faq`、`/docs/tools`

- [ ] **Step 1: 写 `docs/nodejs/nodejs-setup.md`**

```bash
mkdir -p /Volumes/External/works/self/konvajs/docs/nodejs
cat > /Volumes/External/works/self/konvajs/docs/nodejs/_category_.json <<'EOF'
{
  "label": "Node.js 环境",
  "position": 23
}
EOF
```

frontmatter：
```yaml
---
title: '在 Node.js 中使用 Konva'
description: '在服务端用 Konva 渲染图片：安装 canvas 原生模块、用 konva/cmj 入口避开 DOM 依赖、导出 PNG 到文件，以及国内安装 node-canvas 的常见卡点。'
sidebar_position: 1
---
```

关键技术内容（**必须先实机验证再落笔**，见 Step 2）：
- Node 端要装 `konva` 和 `canvas`（node-canvas，原生模块）。
- 入口是 `konva/cmj`——它不引用 `window` / `document`。直接 `require('konva')` 在 Node 下会因为找不到 DOM 而报错。
- 没有 `container`，`new Konva.Stage({ width, height })` 直接建。
- 导出用 `stage.toDataURL()` 拿 base64，或 `stage.toCanvas().createPNGStream()` 写文件。
- 字体：node-canvas 不读系统字体表，中文要 `registerFont()` 显式注册，否则中文全是方框。

必须包含的 h2：
- `## 安装与入口`
- `## 一个完整的服务端渲染例子`
- `## 常见问题`（含 `###` 问句）：`### 为什么 require('konva') 报错？`、`### 中文显示成方框怎么办？`、`### 服务端渲染和浏览器渲染结果一致吗？`（抗锯齿与字体度量不同，像素级不一致）
- `## 国内环境注意事项`（≥150 字）——`node-canvas` 是原生模块，`npm install` 会尝试下载预编译二进制；国内常超时，需要设 `npm config set canvas_binary_host_mirror https://registry.npmmirror.com/-/binary/canvas`。下载不到会回退到本地编译，那要求先装好 `pkg-config cairo pango libpng jpeg giflib librsvg`（macOS 用 Homebrew，Debian 系用 apt）。Docker 镜像里尤其容易踩——基础镜像通常不带这些。

- [ ] **Step 2: 实机验证 Node 端代码再落笔**

> **这一步不能跳过。** 本页的每一条断言都必须来自真实运行结果，不得来自记忆或官方文档转述。上一阶段已经有过一次教训：一条从 changelog 抄来的结论（"CSS 滤镜不需要 cache()"）被实测推翻。

```bash
cd /private/tmp/claude-501/-Volumes-External-works-self-konvajs/f9c91430-4fc6-4214-8c54-8f24a8d1bc26/scratchpad
mkdir -p nodecheck && cd nodecheck
npm init -y >/dev/null 2>&1
npm install konva canvas 2>&1 | tail -5
cat > probe.cjs <<'EOF'
// 逐条验证要写进文档的断言
const results = [];
try { require('konva'); results.push(['require(konva)', 'OK']); }
catch (e) { results.push(['require(konva)', 'THROW: ' + e.message.split('\n')[0]]); }
try {
  const Konva = require('konva/cmj').default;
  const stage = new Konva.Stage({ width: 200, height: 100 });
  const layer = new Konva.Layer();
  layer.add(new Konva.Rect({ x: 10, y: 10, width: 80, height: 50, fill: 'tomato' }));
  layer.add(new Konva.Text({ x: 10, y: 70, text: '中文测试', fontSize: 20, fill: 'black' }));
  stage.add(layer);
  const url = stage.toDataURL();
  results.push(['konva/cmj + toDataURL', url.slice(0, 30) + '... len=' + url.length]);
} catch (e) { results.push(['konva/cmj', 'THROW: ' + e.message.split('\n')[0]]); }
console.table(results);
EOF
node probe.cjs
```

Expected: `require('konva')` 抛错或可用（**以实际输出为准，不要预设**），`konva/cmj` 路径产出 `data:image/png;base64,...`。把真实结果写进文档；若 `require('konva')` 其实能用，就**不要**写"会报错"。

- [ ] **Step 3: 写 `docs/faq.md`**

frontmatter：
```yaml
---
title: '常见问题汇总'
description: 'Konva 高频问题集中解答：图形不显示、点不中、导出图片被污染、中文字体不生效、拖拽卡顿、序列化丢事件等，每条给出排查顺序与对应文档。'
sidebar_position: 3
---
```

这是全站 FAQPage 结构化数据密度最高的一页，直接影响 AI 搜索引用率。必须包含的 h2：
- `## 按现象排查`——一张"现象 → 最可能的原因 → 去哪一页"的表。
- `## 常见问题`（**至少 8 个 `###` 问句**，每个答案 3–6 行）：
  - `### 图形画了但看不见？`——排查顺序：① 忘了 `layer.draw()`（Konva 9+ 多数情况自动，但手动改 context 的不会）；② 节点加到了 Layer 之外；③ `opacity(0)` 或 `visible(false)`；④ 坐标在画布外；⑤ 父 Group 被裁剪。
  - `### 点不中图形？`——① `listening(false)`；② 没有 `fill` 的图形内部不响应（描边线要用 `hitStrokeWidth`）；③ 上面压了一个透明但 listening 的节点；④ 见 [自定义命中区域](/docs/events/custom-hit-region)。
  - `### 导出图片报 Tainted canvas？`——跨域图片没有 CORS 头，画进画布后整块画布被污染，`toDataURL` 抛 `SecurityError`。
  - `### 中文字体不生效？`——见 [Text 文字](/docs/shapes/text)。
  - `### 序列化之后事件没了？`——`toJSON()` 只保存属性，函数（事件回调、`sceneFunc`、`dragBoundFunc`、`clipFunc`）一律不保存，见 [序列化舞台](/docs/data-and-serialization/serialize-a-stage)。
  - `### 拖拽时卡？`——见 [性能优化](/docs/performance/all-performance-tips)。
  - `### 缩放之后描边变粗了？`——`scale` 会把描边一起放大，用 `strokeScaleEnabled(false)`，见 [忽略描边](/docs/select-and-transform/ignore-stroke)。
  - `### 高分屏上画面模糊？`——导出默认 `pixelRatio: 1`（F21）。
- `## 与其他方案的取舍`（≥150 字）或 `## 国内环境注意事项`（≥150 字）——选后者，讲 CDN 可达性、图床 CORS、字体加载。

**链接约束**：上面列出的所有链接目标都**已存在**，可直接写。`### 高分屏上画面模糊？` 想链接的 `data-and-serialization/high-quality-export` 在 Task 8 才创建——**此处先写成纯文字，Task 8 完成后回来补链接**（Task 8 Step 5 会做这件事）。

- [ ] **Step 4: 写 `docs/tools.md`**

frontmatter：
```yaml
---
title: '周边工具'
description: 'Konva 生态工具清单：官方框架绑定 react-konva / vue-konva / svelte-konva、TypeScript 类型、调试与性能分析手段，以及社区常用的配套库。'
sidebar_position: 4
---
```

必须包含的 h2：
- `## 官方框架绑定`——`react-konva`、`vue-konva`、`svelte-konva`（各给仓库链接与一句话定位）。
- `## 调试手段`——`Konva.Stage#toJSON()` 导出结构、`layer.getContext()._context` 看原生调用、Chrome DevTools 的 Layers 面板看 canvas 数量、`stage.find('Shape').length` 数节点。
- `## 常见问题`（含 `###` 问句）：`### 有官方的可视化编辑器吗？`（没有，社区方案不稳定）、`### 怎么定位是哪个节点在拖慢渲染？`、`### TypeScript 类型要单独装吗？`（不用，`konva` 包自带，不存在 `@types/konva`）。
- `## 国内环境注意事项`（≥150 字）——unpkg / jsdelivr 在国内的可达性差异，可换 `registry.npmmirror.com` 的 CDN 镜像；GitHub 仓库访问不稳时用 `github.dev`。

**注意**：`docs/support.md` 已有一段「生态工具」列表（`react-konva` / `vue-konva` / `svelte-konva` / TypeScript 类型）。本页必须**取代并扩展**它，而不是重复——在 `docs/support.md` 里把那一段删掉，改为一行指向 `/docs/tools`。

- [ ] **Step 5: 精简 `docs/support.md` 的重复段**

把 `docs/support.md` 的 `## 生态工具` 整段替换为：

```markdown
## 生态工具

官方框架绑定、调试手段与社区配套库集中在[周边工具](/docs/tools)一页。
```

**验证**：替换后 `docs/support.md` 仍需 ≥ 3 个 h2，且 `## 常见问题`、`## 国内环境注意事项` 两节都在（它们本来就在，`## 生态工具` 只是第四个 h2），字数不受影响。

- [ ] **Step 6: 构建并跑校验**

```bash
cd /Volumes/External/works/self/konvajs && npm run build && npm run verify
```
Expected: 构建成功，16 项全 PASS。

- [ ] **Step 7: 提交**

```bash
cd /Volumes/External/works/self/konvajs
git add docs/nodejs docs/faq.md docs/tools.md docs/support.md
git commit -m "$(cat <<'EOF'
docs: 新增 nodejs 服务端渲染、faq 汇总、tools 周边工具 3 页

nodejs 页的每条断言都先在 scratchpad 里实机跑过 konva + node-canvas 再落笔，
不从官方文档转述——上一阶段有过从 changelog 抄来的结论被实测推翻的教训。

faq 是全站 FAQPage 结构化数据密度最高的一页，直接影响 AI 搜索的引用率，
按「现象 → 原因 → 去哪一页」组织，而不是按 API 分类。

tools 页取代 support.md 里的「生态工具」段，support.md 改为一行链接，
避免两处维护同一份清单。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 根级 `about` / `donate` / `ai-tools`

**Files:**
- Create: `docs/about.md`
- Create: `docs/donate.md`
- Create: `docs/ai-tools.md`

**Interfaces:**
- Consumes: Task 1、Task 2 的页面（可链接）
- Produces: 路由 `/docs/about`、`/docs/donate`、`/docs/ai-tools`

- [ ] **Step 1: 写 `docs/about.md`**

```yaml
---
title: '关于 Konva'
description: 'Konva 的项目背景、版本演进（KineticJS 的继任者、10.0 的 ESM 迁移）、许可证与维护现状，以及本中文站与官方文档的关系。'
sidebar_position: 97
---
```

必须包含的 h2：
- `## 项目沿革`——Konva 是 KineticJS 的继任者，由 lavrton 维护；MIT 许可。
- `## 版本演进的几个分水岭`——用已核实的事实：10.0.0 迁移到 ESM；10.4.0 引入 `destroy` 事件与字素（grapheme）感知排版；10.5.0 引入 `eventBatchFunc`；10.6.0 自定义滤镜签名变为 `(imageData, pixelRatio)` 且闭合路径的 `getLength()` 行为变化（F11）。
- `## 常见问题`（含 `###` 问句）：`### Konva 还在维护吗？`、`### 升级大版本要注意什么？`、`### 本站和官方文档是什么关系？`（本站是中文翻译 + 原创增量，API 权威来源始终是官方；内容冲突以官方为准）。
- `## 与其他方案的取舍`（≥150 字）或 `## 国内环境注意事项`（≥150 字）。

- [ ] **Step 2: 写 `docs/donate.md`**

```yaml
---
title: '支持 Konva'
description: 'Konva 是 MIT 许可的个人维护开源项目，本页说明可以通过哪些方式支持它，以及企业使用时更实际的回馈方式。'
sidebar_position: 98
---
```

**写作约束**：本页**不得**照搬官方捐赠页的文案或收款方式，只提供指向官方渠道的链接（`https://github.com/sponsors/lavrton`、官方站的 donate 页），并补充对中文读者更实际的内容：
- `## 为什么这件事重要`——Konva 是单人长期维护的项目，issue 响应速度直接取决于维护者能投入的时间。
- `## 除了出钱还能做什么`——提交可复现的 issue、补文档、回答 StackOverflow 上的问题、把公司在用 Konva 这件事公开（logo wall 对个人维护者争取赞助有实际帮助）。
- `## 常见问题`（含 `###` 问句）：`### 国内怎么赞助？`（GitHub Sponsors 需要绑定境外支付方式，国内个人不便；企业可走开源采购或直接雇佣支持）、`### 商用需要付费吗？`（MIT，不需要）、`### 作者提供付费支持吗？`（是，通过 GitHub 主页联系）。
- `## 国内环境注意事项`（≥150 字）——GitHub Sponsors、OpenCollective 的支付可达性，以及企业侧更可行的路径（技术支持合同、把 bug 修复回贡上游）。

- [ ] **Step 3: 写 `docs/ai-tools.md`**

```yaml
---
title: 'AI 工具与 Konva'
description: '让 AI 编程助手正确生成 Konva 代码：可直接投喂的 llms.txt、常见的过时 API 幻觉（get、Collection.each、konva@9 写法）与纠正方式。'
sidebar_position: 5
---
```

> 这一页的 GEO 价值最高——它既是给人看的，也是给抓取本站的 AI 爬虫看的。

必须包含的 h2：
- `## 直接投喂给模型的入口`——本站已生成 [`/llms.txt`](/llms.txt) 与 [`/llms-full.txt`](/llms-full.txt)，前者是目录，后者是全文，可直接贴进对话或作为 RAG 语料。
- `## AI 生成 Konva 代码时最常见的过时写法`——**用本站实测过的真实数据**（上一阶段修 8 个失效演示时确认的）：
  - `layer.get('#id')` / `stage.get('.name')`——Konva 8 已移除，改用 `findOne('#id')` / `find('.name')`。
  - `layer.children.each(fn)`——`Collection.each` 已移除，改用 `children.forEach(fn)`。
  - `new Konva.Text({...})` 后直接改 `text.width()` 期望自动换行——必须先设 `width`。
  - CDN 写 `konva@9` 或更老——本站统一用 `konva@10`。
- `## 常见问题`（含 `###` 问句）：`### 为什么 AI 老写出 Konva 8 的 API？`（训练语料里 KineticJS / 老版 Konva 的 StackOverflow 答案占比很高，且这些 API 删除时没有 runtime 报错提示，只是返回 undefined）、`### 怎么让 AI 用最新 API？`（在 prompt 里贴 llms.txt 的相关片段，或明确写出 Konva 版本号）、`### 生成的代码跑不出画面怎么排查？`（链接到 `/docs/faq` 的「图形画了但看不见」）。
- `## 与其他方案的取舍`（≥150 字）或 `## 国内环境注意事项`（≥150 字）。

- [ ] **Step 4: 确认 llms.txt 把新页收进去了**

```bash
cd /Volumes/External/works/self/konvajs && npm run build && grep -c '^' build/llms.txt && grep -E 'guides|nodejs|faq|tools|about|donate|ai-tools' build/llms.txt
```
Expected: 本 Task 与前两个 Task 新增的 8 页全部出现在 `llms.txt` 里。`plugins/llmsTxt.ts` 是读构建产物生成的，新页应自动进入，**无需改插件**；若某页缺失，说明它的正文没有落进 `.theme-doc-markdown`，需要排查该页而不是改插件。

- [ ] **Step 5: 跑全量校验**

```bash
cd /Volumes/External/works/self/konvajs && npm run verify
```
Expected: 16 项全 PASS。

- [ ] **Step 6: 提交**

```bash
cd /Volumes/External/works/self/konvajs
git add docs/about.md docs/donate.md docs/ai-tools.md
git commit -m "$(cat <<'EOF'
docs: 新增根级 about、donate、ai-tools 3 页

ai-tools 是这三页里 GEO 价值最高的：它同时服务于人和抓取本站的 AI 爬虫，
列出的过时写法全部来自上一阶段修 8 个失效演示时的实测结果
（get/Collection.each 在 Konva 8 被移除且不报错，只返回 undefined），
不是泛泛而谈。

donate 页不照搬官方捐赠文案，只给官方渠道链接，正文补的是
对中文读者更实际的部分：GitHub Sponsors 的支付可达性、企业侧可行路径。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `filters` 第一批 7 页（Brightness / Contrast / Custom_Filter / Emboss / Enhance / HSL / HSV）

`filters` 是本计划最大的一块：官方 20 页，本站只有 8 页（其中 `css-filters`、`rgba` 是本站原创），缺 **14 页**。分两个 Task 做，每批 7 页，便于独立评审。

**Files:**
- Create: `docs/filters/brightness.md` + `static/downloads/code/filters/Brightness.html`
- Create: `docs/filters/contrast.md` + `static/downloads/code/filters/Contrast.html`
- Create: `docs/filters/custom-filter.md` + `static/downloads/code/filters/Custom_Filter.html`
- Create: `docs/filters/emboss.md` + `static/downloads/code/filters/Emboss.html`
- Create: `docs/filters/enhance.md` + `static/downloads/code/filters/Enhance.html`
- Create: `docs/filters/hsl.md` + `static/downloads/code/filters/HSL.html`
- Create: `docs/filters/hsv.md` + `static/downloads/code/filters/HSV.html`

**Interfaces:**
- Consumes: 无新接口
- Produces: 路由 `/docs/filters/{brightness,contrast,custom-filter,emboss,enhance,hsl,hsv}`

- [ ] **Step 1: 建立演示模板**

所有滤镜演示共用一个骨架。**先把这个模板写成文件**，7 个演示各自只改中间那段：

```bash
cat > /private/tmp/claude-501/-Volumes-External-works-self-konvajs/f9c91430-4fc6-4214-8c54-8f24a8d1bc26/scratchpad/filter-demo-template.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva __TITLE__ Filter Demo</title>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; background-color: #F0F0F0; }
    #controls { padding: 8px 12px; font: 13px/1.6 system-ui, sans-serif; }
    #controls label { margin-right: 12px; }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="controls"></div>
  <script>
    var stage = new Konva.Stage({ container: 'container', width: 300, height: 200 });
    var layer = new Konva.Layer();
    stage.add(layer);

    Konva.Image.fromURL('/assets/lion.png', function (lion) {
      lion.setAttrs({ x: 40, y: 10, draggable: true });
      layer.add(lion);
      lion.cache();
      // __FILTER_SETUP__
    });
  </script>
</body>
</html>
EOF
```

**模板的两条硬约束**：
1. 图片用 `/assets/lion.png`（站内绝对路径，仓库里已存在）。不得引外部图床。
2. `cache()` 必须在 `filters()` 之前或之后都调用一次——滤镜只作用于缓存画布，**没有 `cache()` 滤镜完全不生效**，这是 `demo-health` 会抓到的（画面与原图无差别不会报错，但滤镜没效果等于演示是错的，需人工确认一次）。

- [ ] **Step 2: 逐页写作——每页的事实骨架**

每页统一结构：`## 用法`（含 iframe + 代码块）→ 该滤镜特有的 h2 → `## 常见问题` → 第三类小节。下表给出**每页必须写进去的、已核实的事实**（编号对应「Konva 10.6.0 源码事实」表）：

| 页面 | 演示文件 | 配置项 | 必须写进去的事实 | 第三类小节 |
|---|---|---|---|---|
| `brightness.md` | `Brightness.html` | `brightness`（乘数，中性值 1） | **F1 / F2 / F3**——这是本批最重要的一页。`Brighten` 已弃用；两者共用 `brightness()` 但一个加法一个乘法；`Brightness` 把未设置当 1、访问器默认却是 0 | `## 与其他方案的取舍`：何时用 `Brightness`、何时用 CSS 滤镜字符串（链接 `/docs/filters/css-filters`） |
| `contrast.md` | `Contrast.html` | `contrast`（−100 ~ 100，默认 0） | **F10**——`adjust = ((contrast+100)/100)²`；`contrast(-100)` 得到纯灰而非"低对比" | `## 性能提示`：对比度是逐像素乘加，成本随缓存面积线性增长；配合 `cache({ pixelRatio: 1 })` 可在不缩放的场景省一半像素 |
| `custom-filter.md` | `Custom_Filter.html` | 无（自定义函数） | **F11**——签名 `(imageData, pixelRatio)`，10.6.0 起第二参是 pixelRatio，忽略它会让按像素计的效果在高分屏上尺寸减半。**F17**——源码里有 `Posterize` 但官方无文档页，可作为"先翻源码"的例子 | `## 性能提示`：自定义滤镜跑在主线程，`imageData.data` 是 `Uint8ClampedArray`，避免在循环里建对象；大图考虑 OffscreenCanvas + Worker |
| `emboss.md` | `Emboss.html` | `embossStrength` 0.5、`embossWhiteLevel` 0.5、`embossDirection` `'top-left'`、`embossBlend` false | **F9**——8 个合法方向值及其角度映射；**传错字符串不报错，静默回退 315°** | `## 常见问题`里覆盖 `embossBlend` 的作用 + `## 性能提示` |
| `enhance.md` | `Enhance.html` | `enhance`（默认 0） | **F16**——按每通道实际最小/最大值线性拉伸，没有过度增强的上限保护；纯色图（各通道最大最小相等）会除零，需确认实际行为后如实写 | `## 性能提示` |
| `hsl.md` | `HSL.html` | `hue` 0、`saturation` 0、`luminance` 0 | **F8**——`hue`/`saturation` 与 HSV 共用访问器，同时挂两个滤镜会被应用两次 | `## 与其他方案的取舍`：HSL vs HSV 怎么选；要连续变色用 HSL 的 `hue`，要调"鲜艳度"用 HSV 的 `value` |
| `hsv.md` | `HSV.html` | `hue` 0、`saturation` 0、`value` 0 | **F8**（同上，从 HSV 视角写） | `## 与其他方案的取舍`（与 hsl.md 互相链接，但**角度不同**，不得复制粘贴） |

**反重复约束**：`hsl.md` 与 `hsv.md` 的「与其他方案的取舍」必须是两段**不同的文字**。原创校验只查字数，查不出复制粘贴；但搜索引擎查得出，两页互为重复内容会一起掉排名。

- [ ] **Step 3: 验证 F2 的断言（不可跳过）**

F2 是本批最有价值的一条，也是最容易写错的一条。**落笔前实测**：

```bash
cd /private/tmp/claude-501/-Volumes-External-works-self-konvajs/f9c91430-4fc6-4214-8c54-8f24a8d1bc26/scratchpad
cat > brightness-probe.html <<'EOF'
<!DOCTYPE html><html><head><meta charset="utf-8">
<script src="https://unpkg.com/konva@10/konva.min.js"></script></head><body>
<div id="c"></div><pre id="out"></pre><script>
var stage = new Konva.Stage({ container: 'c', width: 100, height: 100 });
var layer = new Konva.Layer(); stage.add(layer);
function sample(filter, value) {
  layer.destroyChildren();
  var r = new Konva.Rect({ x: 0, y: 0, width: 100, height: 100, fill: 'rgb(100,100,100)' });
  layer.add(r); r.cache(); r.filters([filter]); r.brightness(value); layer.draw();
  var d = layer.getContext().getImageData(50, 50, 1, 1).data;
  return d[0] + ',' + d[1] + ',' + d[2];
}
var lines = [
  'Brighten  brightness(0)   -> ' + sample(Konva.Filters.Brighten, 0),
  'Brightness brightness(0)  -> ' + sample(Konva.Filters.Brightness, 0),
  'Brighten  brightness(1)   -> ' + sample(Konva.Filters.Brighten, 1),
  'Brightness brightness(1)  -> ' + sample(Konva.Filters.Brightness, 1),
  'Brightness brightness(1.5)-> ' + sample(Konva.Filters.Brightness, 1.5)
];
document.getElementById('out').textContent = lines.join('\n');
</script></body></html>
EOF
```

用仓库已有的 playwright-core + 本机 Chrome 打开这个文件并读出 `#out` 的文本（参照 `test/lib/demo-health.mjs` 的 `channel: 'chrome'` 用法）。

Expected（基于源码推演，**以实测为准**）：起始色 rgb(100,100,100)；
`Brighten brightness(0)` → `100,100,100`（加 0，不变）；
`Brightness brightness(0)` → `0,0,0`（乘 0，全黑）；
`Brighten brightness(1)` → `255,255,255`（加 255，饱和）；
`Brightness brightness(1)` → `100,100,100`（乘 1，不变）。

**若实测与推演不符，以实测为准并回头修正上面的事实表 F2。**

- [ ] **Step 4: 构建 + 演示健康检查 + 校验**

```bash
cd /Volumes/External/works/self/konvajs && npm run build && npm run demo-health && npm run verify
```
Expected: 7 个新演示全部通过 `demo-health`（无 console 错误、canvas 存在、有非透明像素）；16 项校验全 PASS。

- [ ] **Step 5: 人工确认滤镜确实生效**

`demo-health` 只检查"画布上有东西"，**查不出"滤镜没生效"**。逐个打开 7 个演示，确认画面与未加滤镜的原图有可见差异：

```bash
cd /Volumes/External/works/self/konvajs && npm run serve -- --port 3223 --no-open
```
然后逐个访问 `http://localhost:3223/downloads/code/filters/<Name>.html`。**Emboss 和 Enhance 的效果可能很微弱**——若肉眼看不出，调大参数直到可见，演示的作用是让人一眼看懂这个滤镜做什么。

- [ ] **Step 6: 提交**

```bash
cd /Volumes/External/works/self/konvajs
git add docs/filters static/downloads/code/filters
git commit -m "$(cat <<'EOF'
docs: 新增 filters 第一批 7 页（Brightness/Contrast/Custom_Filter/Emboss/Enhance/HSL/HSV）

全部事实取自 konva@10.6.0 包内源码，不取自官方译文（该仓库 i18n 目录 license: null）。

brightness 页是这批里最重要的一页：Brighten 已 @deprecated，而它和 Brightness
共用同一个 brightness() 访问器却语义相反——一个加法（中性值 0）一个乘法（中性值 1）。
只换滤镜不换值会静默把图变全黑。这条已用真实浏览器逐像素采样验证过，不是推演。

emboss 的 embossDirection 传错字符串不报错、静默回退 315°，
contrast(-100) 得到纯灰而非低对比，两条都是读源码才能确认的。

hsl 与 hsv 共用 hue/saturation 访问器，两页互相链接但取舍段落各写各的——
原创校验只查字数查不出复制粘贴，但搜索引擎查得出。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `filters` 第二批 7 页（Mask / Noise / Pixelate / RGB / Sepia / Solarize / Threshold）

**Files:**
- Create: `docs/filters/mask.md` + `static/downloads/code/filters/Mask.html`
- Create: `docs/filters/noise.md` + `static/downloads/code/filters/Noise.html`
- Create: `docs/filters/pixelate.md` + `static/downloads/code/filters/Pixelate.html`
- Create: `docs/filters/rgb.md` + `static/downloads/code/filters/RGB.html`
- Create: `docs/filters/sepia.md` + `static/downloads/code/filters/Sepia.html`
- Create: `docs/filters/solarize.md` + `static/downloads/code/filters/Solarize.html`
- Create: `docs/filters/threshold.md` + `static/downloads/code/filters/Threshold.html`

**Interfaces:**
- Consumes: Task 4 的演示模板 `scratchpad/filter-demo-template.html`
- Produces: 路由 `/docs/filters/{mask,noise,pixelate,rgb,sepia,solarize,threshold}`

- [ ] **Step 1: 逐页写作——每页的事实骨架**

| 页面 | 演示文件 | 配置项 | 必须写进去的事实 | 第三类小节 |
|---|---|---|---|---|
| `mask.md` | `Mask.html` | `threshold`（默认 0.5，此处是 RGB 距离容差） | **F6**——采样四角像素推断背景色，主体碰到任一角就抠不干净；**F4**——`threshold` 与 `Threshold` 滤镜共用访问器 | `## 与其他方案的取舍`：Mask 只适合纯色背景的简单抠图；复杂背景该在服务端做或用现成的抠图 API |
| `noise.md` | `Noise.html` | `noise`（默认 0.2） | **F15**；噪点是每次 `cache()` 重算的伪随机，**同一节点重复 cache 会得到不同噪点**，动画里会闪 | `## 性能提示`：不要在 `Konva.Animation` 里反复 `cache()` 加噪；预生成一张噪点贴图叠加更省 |
| `pixelate.md` | `Pixelate.html` | `pixelSize`（默认 8） | **F13**——`pixelSize` 单位是**节点坐标**，与缓存 `pixelRatio` 无关（源码注释明确写了）。所以节点放大后马赛克块**跟着放大**，不会变细 | `## 性能提示` |
| `rgb.md` | `RGB.html` | `red` / `green` / `blue`（0–255，校验器 `RGBComponent`） | **F14**——`RGBA` 只额外注册 `alpha`（0–1，被夹取到 [0,1]），复用 RGB 三通道；两者的区别只在要不要动透明度 | `## 与其他方案的取舍`：RGB 是**替换**色调而非叠加，要保留原图明暗关系应该用 HSL 的 `hue`（链接 `/docs/filters/hsl`，Task 4 已创建） |
| `sepia.md` | `Sepia.html` | 无 | **F12**——固定矩阵，**不可调强度**；要半程效果只能自己写自定义滤镜做插值（链接 `/docs/filters/custom-filter`，Task 4 已创建，附一段可运行的插值实现） | `## 与其他方案的取舍` |
| `solarize.md` | `Solarize.html` | 无 | **F7**——阈值**硬编码 128**，没有配置项；用 sRGB 亮度 `0.2126R+0.7152G+0.0722B` 判断 | `## 与其他方案的取舍`：要可调阈值就得抄源码自己写一个自定义滤镜（给出完整实现） |
| `threshold.md` | `Threshold.html` | `threshold`（默认 0.5） | **F5**——循环是 `i += 1` 不是 `i += 4`，**alpha 通道也被二值化**，透明背景图边缘会变成硬锯齿；**F4**——与 `Mask` 共用访问器 | `## 性能提示` 或 `## 与其他方案的取舍` |

- [ ] **Step 2: 验证 F5 的断言（不可跳过）**

alpha 被二值化这条直接影响读者会不会踩坑，**必须实测**。用 Task 4 Step 3 的同样办法，画一个半透明矩形（`opacity(0.5)` 或 `fill: 'rgba(200,50,50,0.5)'`），加 `Threshold` 滤镜后采样该像素的第 4 个分量：

Expected: alpha 从 128 变成 0 或 255（取决于是否 ≥ `threshold()*255`）。**若实测 alpha 未变，说明源码读错了，回头修正 F5 再落笔。**

- [ ] **Step 3: Mask 演示必须换图（已实测，不要用 lion.png）**

F6 说 `Mask` 靠采样四角像素推断背景色。写本计划时已验证 `static/assets/lion.png`
的 PNG 色彩类型字节是 **6（RGBA）**，即带透明通道，四角大概率全透明——
四角都是 `rgba(0,0,0,0)` 时推断出的"背景色"就是透明，`Mask` 会**毫无效果**，
而 `demo-health` 查不出这种"演示跑通了但什么也没演示到"。

所以 `Mask.html` **改用 JPEG**（`/assets/yoda.jpg` 或 `/assets/darth-vader.jpg`，
JPEG 不存在透明通道，四角必为实色），并在文档正文里写明为什么这个滤镜
换了张图——这本身就是 F6 的最好注脚。

复核命令（确认所选图确为 JPEG 且能加载）：
```bash
cd /Volumes/External/works/self/konvajs && file static/assets/yoda.jpg static/assets/darth-vader.jpg
```

- [ ] **Step 4: 构建 + 演示健康检查 + 校验**

```bash
cd /Volumes/External/works/self/konvajs && npm run build && npm run demo-health && npm run verify
```
Expected: 全绿。

- [ ] **Step 5: 人工确认 7 个演示的滤镜确实生效**

同 Task 4 Step 5。**Mask 和 Solarize 最容易做成"看不出效果"**——Mask 选错图会毫无变化，Solarize 阈值固定 128，深色图几乎不变。选图时确认效果可见。

- [ ] **Step 6: 提交**

```bash
cd /Volumes/External/works/self/konvajs
git add docs/filters static/downloads/code/filters
git commit -m "$(cat <<'EOF'
docs: 新增 filters 第二批 7 页（Mask/Noise/Pixelate/RGB/Sepia/Solarize/Threshold）

filters 章节至此 20 页，与官方页数一致（另有本站原创的 css-filters、rgba 两页）。

三条读源码才能确认、且实测验证过的坑：
- Threshold 的循环是 i += 1 不是 i += 4，alpha 通道也被二值化，
  透明背景图过一遍会得到完全硬的锯齿边。
- Mask 靠采样四个角的像素推断背景色，主体碰到任一角就抠不干净；
  演示因此改用四角为纯色的 JPEG 而不是四角透明的 PNG。
- Solarize 的阈值硬编码 128，没有配置项——文档里给出可调阈值的自定义滤镜实现。

threshold 访问器被 Mask.js 和 Threshold.js 各注册一次，两个滤镜叠在
同一节点上无法各自调参，两页都写明了。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `filters/brighten.md` 勘误 + `shapes` 补 2 页（Group / Line）

**Files:**
- Modify: `docs/filters/brighten.md`
- Create: `docs/shapes/group.md` + `static/downloads/code/shapes/Group.html`
- Create: `docs/shapes/line.md` + `static/downloads/code/shapes/Line.html`

**Interfaces:**
- Consumes: Task 4 创建的 `/docs/filters/brightness`
- Produces: 路由 `/docs/shapes/group`、`/docs/shapes/line`

- [ ] **Step 1: 给 `docs/filters/brighten.md` 加弃用提示**

这不是"补齐缺失"，是 Task 4 顺带发现的**现有内容错误**：本站的 `brighten.md` 在推荐一个已被官方标记 `@deprecated` 的滤镜（F1），且没有提示它与 `Brightness` 的语义冲突（F2）。留着不管等于持续误导读者。

在 `docs/filters/brighten.md` 的正文开头（frontmatter 之后、第一个 h2 之前）插入：

```markdown
:::warning 该滤镜已弃用
Konva 10 起 `Konva.Filters.Brighten` 被标记为弃用，官方建议改用
[`Konva.Filters.Brightness`](/docs/filters/brightness)。

两者**共用同一个 `brightness()` 属性，但语义相反**——`Brighten` 是加法
（中性值 `0`），`Brightness` 是乘法（中性值 `1`）。只把滤镜换掉而不改数值，
`brightness(0)` 会从"不变"变成"全黑"。迁移时务必同时改值。
:::
```

同时在该页的 `## 常见问题` 里补一个问句：`### 应该迁移到 Brightness 吗？`（≥3 行答案：新代码直接用 `Brightness`；存量代码迁移时按 `新值 = 1 + 旧值` 近似，但两者数学上不等价，需目视确认）。

**验证**：`brighten.md` 改完后仍需满足原创校验（h2 ≥ 3、`## 常见问题` 与第三类小节各 ≥ 150 字）。

- [ ] **Step 2: 写 `docs/shapes/group.md`**

```yaml
---
title: 'Group 分组'
description: '用 Konva.Group 把多个图形当作一个整体移动、缩放、旋转与裁剪：Group 是容器不是图形，没有自己的填充与描边，变换会累乘到子节点。'
sidebar_position: 21
---
```

> **`sidebar_position` 已实测确认**：`docs/shapes/` 现有 20 页连续占满 1–20，无空位，故 Group=21、Line=22。

必须包含的 h2：
- `## 用法`（iframe + 代码块）
- `## Group 与 Layer 的区别`——`Layer` 对应一个真实的 `<canvas>` 元素，`Group` 不对应任何 DOM，只是逻辑容器。图层数量有成本（Konva 源码 `Stage.js:10` 定义 `MAX_LAYERS_NUMBER = 5` 作为告警阈值），分组没有。
- `## 常见问题`（含 `###` 问句）：`### Group 能设 fill 吗？`（不能，它不是 Shape，没有 `sceneFunc`）、`### Group 的宽高是什么？`（由子节点包围盒推导，`getClientRect()` 才是可靠的；直接 `width()` 返回 0）、`### 变换 Group 之后子节点的坐标变了吗？`（没有，子节点的 `x/y` 是**相对父容器**的，Group 的变换矩阵在绘制时累乘；要拿绝对坐标用 `getAbsolutePosition()`）。
- `## 性能提示`（≥150 字）——`group.cache()` 可以把一整组静态内容烤成一张位图，代价是缓存后子节点的改动不会自动反映，需要 `clearCache()`；分组本身没有渲染开销，但过深的嵌套会让每次变换都多算几层矩阵。

- [ ] **Step 3: 写 `docs/shapes/line.md`**

官方 `shapes/Line.html` 是 Line 的**总览页**，本站已有 `line-simple-line`、`line-polygon`、`line-blob`、`line-spline` 四个分页。本页要做的是**入口与选择指南**，而不是复述四个分页。

```yaml
---
title: 'Line 线条总览'
description: 'Konva.Line 的四种形态：直线、折线多边形、平滑闭合的 blob 与样条曲线，由 points、closed、tension 三个属性组合决定，本页给出选择路径。'
sidebar_position: 22
---
```

必须包含的 h2：
- `## 三个属性决定四种形态`——一张表：`closed` × `tension` 的四种组合分别对应哪一页。
  - `closed: false, tension: 0` → [直线 / 折线](/docs/shapes/line-simple-line)
  - `closed: true, tension: 0` → [多边形](/docs/shapes/line-polygon)
  - `closed: true, tension > 0` → [Blob](/docs/shapes/line-blob)
  - `closed: false, tension > 0` → [样条曲线](/docs/shapes/line-spline)
- `## points 的格式`——扁平数组 `[x1, y1, x2, y2, ...]`，**不是** `[[x1,y1], [x2,y2]]`。长度为奇数时最后一个值被忽略。
- `## 常见问题`（含 `###` 问句）：`### tension 到底是什么？`（Konva 用它控制样条的张力，0 = 直连，值越大曲线越"鼓"；不是贝塞尔控制点）、`### 为什么线条点不中？`（没有 `fill` 的线只有描边可命中，且命中区默认等于 `strokeWidth`；细线要设 `hitStrokeWidth`，链接 `/docs/events/custom-hit-region`）、`### 能画箭头吗？`（用 [`Konva.Arrow`](/docs/shapes/arrow)，它继承自 Line）。
- `## 性能提示`（≥150 字）——`points` 很长（自由绘制场景常见上万个点）时，每帧重建整个 Path 很贵；实践做法是把已完成的笔画 `cache()` 掉，只让当前正在画的那一笔保持活动状态。链接 `/docs/performance/shape-caching`。

**链接约束**：本页链接的 `line-simple-line`、`line-polygon`、`line-blob`、`line-spline`、`arrow`、`custom-hit-region`、`shape-caching` **全部已存在**，可直接写。

- [ ] **Step 4: 写两个演示**

`Group.html`：三个图形（Rect + Circle + Text）放进一个 `Konva.Group({ draggable: true, rotation: 10 })`，演示整体拖拽与旋转；旁边放一个未分组的对照图形。
`Line.html`：同一组 `points` 用四种 `closed` / `tension` 组合画四条线，颜色区分，一眼看清差别。

两者都遵守 Task 4 Step 1 的硬约束（站内资源、`konva@10`）。

- [ ] **Step 5: 构建 + 演示健康检查 + 校验**

```bash
cd /Volumes/External/works/self/konvajs && npm run build && npm run demo-health && npm run verify
```
Expected: 全绿。特别确认 `demos.js` 没报"演示名与页面不符"——`group.md` ↔ `Group.html`、`line.md` ↔ `Line.html` 归一化后相等。

- [ ] **Step 6: 提交**

```bash
cd /Volumes/External/works/self/konvajs
git add docs/filters/brighten.md docs/shapes static/downloads/code/shapes
git commit -m "$(cat <<'EOF'
docs: shapes 补 Group 与 Line 总览 2 页，brighten 页加弃用提示

brighten.md 的改动不属于「补齐缺失」，是写 Brightness 页时发现的现有内容错误：
本站一直在推荐一个已被官方标记 @deprecated 的滤镜，且没提示它与 Brightness
共用属性却语义相反。留着不管等于持续误导读者，顺手改掉。

shapes/line.md 是总览页而非第五个分页——本站已有 simple-line/polygon/blob/spline
四页，这页讲的是 closed × tension 两个属性如何组合出那四种形态，
给的是选择路径，不复述分页内容。

shapes 章节至此 22 页，与官方一致。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `events` 补 2 页 + `styling` 补 1 页

**Files:**
- Create: `docs/events/pointer-events.md` + `static/downloads/code/events/Pointer_Events.html`
- Create: `docs/events/mobile-tap-and-click.md` + `static/downloads/code/events/Mobile_Tap_And_Click.html`
- Create: `docs/styling/fill-stroke-order.md` + `static/downloads/code/styling/Fill_Stroke_Order.html`

**Interfaces:**
- Consumes: 无新接口
- Produces: 路由 `/docs/events/pointer-events`、`/docs/events/mobile-tap-and-click`、`/docs/styling/fill-stroke-order`

- [ ] **Step 1: 写 `docs/events/pointer-events.md`**

```yaml
---
title: 'Pointer 指针事件'
description: 'Konva 的 pointerdown / pointermove / pointerup 等指针事件统一处理鼠标、触摸与手写笔，并按 pointerType 同时派发对应的鼠标或触摸事件。'
sidebar_position: 16
---
```

> **`sidebar_position` 已实测确认**：`docs/events/` 现有 15 页连续占满 1–15，无空位，故本页 16、下一页 17。

必须包含的 h2：
- `## 指针事件列表`——**F23** 的完整事件名列表（`pointerdown` / `pointermove` / `pointerup` / `pointercancel` / `pointerclick` / `pointerdblclick` / `pointerover` / `pointerout` / `pointerenter` / `pointerleave`），并说明 `Konva.pointerEventsEnabled` 默认 `true`。
- `## 一次交互会派发两套事件`——**F24**，这是本页最有价值的一节。Konva 内部按 `pointerType` 把指针事件映射成鼠标或触摸事件并**一并派发**：鼠标操作时 `pointerdown` 与 `mousedown` 都会触发，触摸时 `pointerdown` 与 `touchstart` 都会触发。所以**同时监听 `pointerdown` 和 `mousedown` 会收到两次**，这是"点一下执行了两遍"最常见的原因。
- `## 常见问题`（含 `###` 问句）：`### 该用 pointer 还是 mouse + touch？`（新代码一律用 pointer，一套代码覆盖三种输入；只在需要区分手写笔压感等场景才下探到原生事件）、`### 怎么拿到是鼠标还是触摸？`（事件对象的 `evt.pointerType`）、`### pointerclick 和 click 有区别吗？`（Konva 把 `pointerclick` 映射成 `click`，监听任一个都行，但**不要两个都监听**）。
- `## 与其他方案的取舍`（≥150 字）或 `## 性能提示`（≥150 字）。

- [ ] **Step 2: 写 `docs/events/mobile-tap-and-click.md`**

```yaml
---
title: '移动端 tap 与 click'
description: 'Konva 在移动端同时派发 tap 与 click 的机制、300ms 延迟的由来、dragDistance 对轻触判定的影响，以及避免一次触摸触发两次回调的写法。'
sidebar_position: 17
---
```

必须包含的 h2：
- `## tap、click 与 dbltap`——移动端触摸会触发 `tap`，同时浏览器合成的鼠标事件会让 `click` 也触发。**同时监听 `tap` 和 `click` 在移动端会执行两次**，在桌面端只执行一次——这种"只在手机上出问题"的 bug 最难查。
- `## dragDistance 如何影响轻触判定`——**F25**，`Konva.dragDistance` 默认 3px。手指按下后移动不超过 3px 才算轻触；超过就进入拖拽，`tap` 不再触发。手指比鼠标抖，移动端常需要调大到 6–10。
- `## 常见问题`（含 `###` 问句）：`### 怎么写一次就够的点击处理？`（统一监听 `click tap` 两个事件名（Konva 支持空格分隔），或者只监听 `pointerclick`——但**不要 `on('click tap')` 又 `on('pointerclick')`**）、`### 还有 300ms 延迟吗？`（现代浏览器在有 `<meta name="viewport" content="width=device-width">` 时已移除，但老 WebView 仍可能有）、`### 为什么滑动列表时误触了画布？`（见 [移动端滚动](/docs/events/mobile-scrolling)）。
- `## 国内环境注意事项`（≥150 字）——国内的微信内置浏览器、各家 App 的 WebView 内核版本差异大，X5 内核在触摸事件上的行为与 Chrome 不完全一致；给出"在真机的微信里测一遍"这个具体建议，以及用 `vConsole` 打点验证事件触发次数的做法。

- [ ] **Step 3: 写 `docs/styling/fill-stroke-order.md`**

```yaml
---
title: '填充与描边的顺序'
description: 'fillAfterStrokeEnabled 控制 Konva 先填充还是先描边：默认先填充后描边（描边压在填充上），开启后反过来，影响半透明描边与粗描边的视觉效果。'
sidebar_position: 9
---
```

> **`sidebar_position` 已实测确认**：`docs/styling/` 现有 8 页连续占满 1–8，故本页 9。

必须包含的 h2：
- `## 默认顺序`——**F20**，`fillAfterStrokeEnabled` 默认 `false`，即**先填充后描边**，描边压在填充之上。
- `## 什么时候看得出区别`——只有两种情况：① 描边是**半透明**的（压在填充上时会与填充混色，反过来则与背景混色）；② 描边**很粗**（描边以路径为中心线各占一半，粗描边会吃掉填充区域的外侧一半）。**描边不透明且很细时两种顺序视觉上完全一样**——这解释了为什么大多数人从没注意过这个属性。
- `## 常见问题`（含 `###` 问句）：`### 为什么我的半透明描边看起来比设定的深？`（描边压在填充上，两层颜色叠加）、`### 粗描边让图形看起来变小了？`（描边以路径为中心线，向内吃掉一半）、`### 这个属性影响性能吗？`（不影响，只是两次绘制调用的先后）。
- `## 与其他方案的取舍`（≥150 字）——要让描边完全在图形外侧，Canvas 没有原生的 "outer stroke"；三条路：把图形放大一圈再描边、用两个叠放的图形、或用 `sceneFunc` 自己控制。各自的代价。

- [ ] **Step 4: 写三个演示**

`Pointer_Events.html`：一个矩形，把收到的每个事件名追加到页面上的日志区，让读者**亲眼看到一次点击派发了几个事件**（这是本页的核心论点，必须演示出来）。
`Mobile_Tap_And_Click.html`：两个矩形，一个 `on('click tap')`，一个同时 `on('click')` 和 `on('tap')`，各自计数并显示，桌面端两者都是 1，移动端后者是 2。
`Fill_Stroke_Order.html`：两个相同的图形并排，`fill: 'tomato'`、`stroke: 'rgba(0,0,255,0.5)'`、`strokeWidth: 20`，一个 `fillAfterStrokeEnabled(false)` 一个 `true`，差别一眼可见。

- [ ] **Step 5: 用真实浏览器验证 F24（不可跳过）**

`Pointer_Events.html` 的日志区就是验证工具。用 playwright-core + 本机 Chrome 打开它，模拟一次点击，读出日志文本：

Expected: 一次鼠标点击应当看到 `pointerdown` 与 `mousedown` **都出现**（以及 `pointerup`/`mouseup`、`pointerclick`/`click`）。**若实测只出现一套，说明 F24 读错了源码，回头修正再落笔。**

- [ ] **Step 6: 构建 + 演示健康检查 + 校验**

```bash
cd /Volumes/External/works/self/konvajs && npm run build && npm run demo-health && npm run verify
```
Expected: 全绿。`events` 章节 17 页、`styling` 章节 9 页，均与官方一致。

- [ ] **Step 7: 提交**

```bash
cd /Volumes/External/works/self/konvajs
git add docs/events docs/styling static/downloads/code/events static/downloads/code/styling
git commit -m "$(cat <<'EOF'
docs: events 补指针事件与移动端 tap/click 2 页，styling 补填充描边顺序 1 页

pointer-events 页的核心是一条读 Stage.js 才能确认的事实：Konva 按 pointerType
把指针事件同时映射成鼠标或触摸事件并一并派发，所以同时监听 pointerdown 和
mousedown 会收到两次。演示页把每个事件名打进日志，读者能亲眼看到一次点击
派发了几个事件——这条已用真实 Chrome 点击验证过。

fill-stroke-order 页写清楚了一件官方没说的事：描边不透明且很细时，
两种顺序视觉上完全一样，这就是为什么大多数人从没注意过 fillAfterStrokeEnabled。
只有半透明描边或粗描边才看得出区别，演示因此用 strokeWidth: 20 的半透明蓝边。

events 17 页、styling 9 页，均与官方一致。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `data-and-serialization` 补 2 页 + `animations` 补 1 页 + `groups-and-layers` 补 1 页

**Files:**
- Create: `docs/data-and-serialization/best-practices.md`
- Create: `docs/data-and-serialization/high-quality-export.md` + `static/downloads/code/data_and_serialization/High_Quality_Export.html`
- Create: `docs/animations/text-animations.md` + `static/downloads/code/animations/Text_Animations.html`
- Create: `docs/groups-and-layers/z-index.md` + `static/downloads/code/groups_and_layers/Z_Index.html`
- Modify: `docs/faq.md`（补 Task 2 Step 3 留下的链接）

**Interfaces:**
- Consumes: Task 2 创建的 `docs/faq.md`
- Produces: 路由 `/docs/data-and-serialization/{best-practices,high-quality-export}`、`/docs/animations/text-animations`、`/docs/groups-and-layers/z-index`

> **演示目录名注意**：`static/downloads/code/` 下的目录用的是**下划线**命名（`data_and_serialization`、`groups_and_layers`），而 `docs/` 下用的是**连字符**（`data-and-serialization`、`groups-and-layers`）。`demos.js` 只比较**文件名**不比较目录，所以这个不一致是允许的，但引用路径必须写对：`/downloads/code/data_and_serialization/High_Quality_Export.html`。

- [ ] **Step 1: 写 `docs/data-and-serialization/best-practices.md`**

```yaml
---
title: '序列化的最佳实践'
description: '什么该存进 JSON、什么不该：toJSON 只保存属性不保存函数，图片与字体要另行处理，以及如何设计一个能跨版本反序列化的数据结构。'
sidebar_position: 4
---
```

> **`sidebar_position` 已实测确认，注意两处空位**：`docs/data-and-serialization/` 现有 4 页占 **1、2、3、5**（**没有 4**），所以 `best-practices` 填空位 **4**、`high-quality-export` 用 **6**；`docs/animations/` 现有 5 页占 **1、2、3、4、6**（**没有 5**），所以 `text-animations` 填空位 **5** 而不是 6。这两处若按「接在最大值后面」的直觉写，都会与既有页撞号。

必须包含的 h2：
- `## toJSON 保存什么、不保存什么`——保存：节点类型、`attrs` 里的属性。**不保存**：所有函数（事件回调、`sceneFunc`、`dragBoundFunc`、`clipFunc`、`filters` 数组里的函数引用）、`Konva.Image` 的 `image` 对象（只留下不带图片的壳）、缓存。
- `## 不要把 Konva 的 JSON 当成你的数据模型`——这是本页的核心论点。`toJSON()` 的产物是**渲染层的快照**，它的结构跟着 Konva 版本走。把它直接存进数据库，等于把业务数据绑死在一个第三方库的内部格式上。正确做法是自己定义一份领域模型（"这张图里有哪些元素、各自什么属性"），渲染时从领域模型生成 Konva 节点，保存时序列化领域模型。
- `## 常见问题`（含 `###` 问句）：`### 反序列化后事件全没了怎么办？`（`Konva.Node.create()` 之后统一重新绑定；用 `name` 或 `id` 做锚点，见 [按名称选择](/docs/selectors/select-by-name)）、`### 图片怎么恢复？`（JSON 里存图片 URL，反序列化后遍历所有 `Image` 节点重新 `Konva.Image.fromURL`；见 [复杂加载](/docs/data-and-serialization/complex-load)）、`### JSON 太大了怎么办？`（只序列化领域模型而非 Konva 树；`points` 数组做抽稀）。
- `## 与其他方案的取舍`（≥150 字）——Konva JSON vs 自定义 schema vs SVG 导出，三者在"可回编辑性""跨工具兼容性""体积"上的取舍。

**这一页不需要演示**（它讲的是数据结构设计，没有可视化的东西），因此不写 iframe。原创校验不要求演示，`demos.js` 只检查已写出的引用是否存在。

- [ ] **Step 2: 写 `docs/data-and-serialization/high-quality-export.md`**

```yaml
---
title: '导出高清图片'
description: 'toDataURL / toImage / toBlob 的 pixelRatio 默认是 1 而非设备像素比，导出图在高分屏上会糊；本页给出正确的导出参数与常见陷阱。'
sidebar_position: 6
---
```

必须包含的 h2：
- `## 默认导出是模糊的`——**F21**，`toDataURL` / `toImage` / `toCanvas` / `toBlob` 的 `pixelRatio` **默认 1**。在 2x 屏上，屏幕显示的是 2 倍像素密度，导出的却是 1 倍——所以"导出的图比屏幕上看到的糊"是默认行为而非 bug。
- `## cache 与导出的默认值不一样`——**F22**，`cache()` 的 `pixelRatio` 默认是 `Konva.pixelRatio`（设备像素比），导出却默认 1。**两个 API 名字相同、默认值相反**，这是最容易混淆的一处。
- `## 常见问题`（含 `###` 问句）：`### pixelRatio 该设多少？`（导出用于屏幕显示设 `window.devicePixelRatio`；用于打印设 2–4；再高只是徒增体积）、`### 导出报 SecurityError / Tainted canvas？`（跨域图片污染画布，需要图片服务端返回 CORS 头且 `Konva.Image` 设 `crossOrigin: 'anonymous'`）、`### 为什么导出的图有透明背景？`（Stage 本身没有背景色，要白底得自己加一个铺满的 `Konva.Rect` 或导出 JPEG）。
- `## 国内环境注意事项`（≥150 字）——国内常用的图床（七牛、又拍、阿里 OSS）**默认不返回 `Access-Control-Allow-Origin`**，需要在存储桶的跨域设置里显式开启。更麻烦的是：设了 `crossOrigin: 'anonymous'` 而服务端不返回 CORS 头时，图片会**彻底加载失败**（连显示都没有），比不设更糟。所以正确顺序是先确认服务端 CORS 配置生效，再加 `crossOrigin`。

演示 `High_Quality_Export.html`：同一个 Stage 导出两次，`pixelRatio: 1` 和 `pixelRatio: 3`，把两张图并排显示在页面上（放大到同样的 CSS 尺寸），清晰度差异一眼可见。

- [ ] **Step 3: 写 `docs/animations/text-animations.md`**

```yaml
---
title: '文字动画'
description: '用 Konva.Animation 逐帧改写 Konva.Text 的属性实现打字机、跳动、渐显等效果，以及为什么文字动画比图形动画更容易掉帧。'
sidebar_position: 5
---
```

必须包含的 h2：
- `## 打字机效果`——每帧根据已过时间算出应显示的字符数，`text.text(full.slice(0, n))`。**注意按字素切分而非按码元**（Konva 10.4.0 起排版是字素感知的，但 `String.prototype.slice` 不是——切在 emoji 中间会得到乱码）。给出用 `Intl.Segmenter` 切分的写法。
- `## 逐字跳动`——用 `charRenderFunc`（见 [Text 文字](/docs/shapes/text)）配合 `Konva.Animation`，按字符索引给不同的 y 偏移。
- `## 常见问题`（含 `###` 问句）：`### 为什么文字动画特别卡？`（每次改 `text()` 都会触发重新测量与换行计算，比改 `x/y` 贵得多）、`### 能用 Tween 做打字机吗？`（不能，`text` 是字符串不能插值；同 [复杂补间动画](/docs/tweens/complex-tweening) 里渐变色标的情况）、`### 中英文混排时字符宽度不一致导致抖动？`（定宽容器 + `align` 而不是每帧重新居中）。
- `## 性能提示`（≥150 字）——改 `text()` 会让 Konva 重算换行与每行宽度；打字机效果如果整段文字很长，每帧都在重排整段。优化办法：把已完成的部分拆成一个独立的、不再变化的 `Konva.Text` 并 `cache()`，只让当前这一行保持活动。

- [ ] **Step 4: 写 `docs/groups-and-layers/z-index.md`**

```yaml
---
title: 'zIndex 层级'
description: 'Konva 的 zIndex 是节点在父容器 children 里的索引，不是 CSS 那样的全局值；moveToTop、moveUp 等方法与 zIndex 的关系，以及跨容器层级的正确做法。'
sidebar_position: 4
---
```

必须包含的 h2：
- `## zIndex 是父容器内的索引`——**F19**，源码注释原文："zIndex is not absolute (like in CSS). It is relative to parent element only."。所以两个不同 Group 里的节点，比较它们的 `zIndex` 毫无意义——决定谁在上面的是**它们各自父容器的先后**。
- `## 设置越界会被静默忽略`——**F18**，`setZIndex` 在 `zIndex < 0 || zIndex >= parent.children.length` 时只 `Util.warn` 不抛错，该次调用**被忽略**。所以 `node.zIndex(999)` 不会把节点置顶，而是什么都不做——想置顶用 `moveToTop()`。
- `## 常见问题`（含 `###` 问句）：`### 怎么让一个节点绝对置顶？`（`moveToTop()` 只在父容器内置顶；要全局置顶得把它移到最上面那个 Layer 里，见 [更换容器](/docs/groups-and-layers/change-containers)）、`### moveToTop 和 zIndex(n) 哪个快？`（都是数组 splice，差别可忽略；但 `moveToTop` 不会越界）、`### 为什么改了 zIndex 画面没变？`（越界被忽略，或者改的是 Group 内部的索引而视觉上被另一个 Layer 盖住）。
- `## 性能提示`（≥150 字）——每次 `zIndex()` / `moveToTop()` 都是对 `children` 数组做 splice，O(n)；在拖拽过程中每帧置顶会在大列表上明显掉帧。做法是**拖拽开始时置顶一次**（`dragstart`），而不是每帧。

演示 `Z_Index.html`：两个 Group 各含两个矩形，点击任一矩形调 `moveToTop()`，旁边实时显示每个节点的 `zIndex()` 与 `getAbsoluteZIndex()`，让读者看到"Group 内置顶不等于全局置顶"。

- [ ] **Step 5: 补上 Task 2 留下的链接**

Task 2 Step 3 在 `docs/faq.md` 的 `### 高分屏上画面模糊？` 里留了纯文字。现在目标页已存在，改成链接：

```bash
cd /Volumes/External/works/self/konvajs && grep -n '高分屏上画面模糊' docs/faq.md
```
把该问句下的答案改为包含 `[导出高清图片](/docs/data-and-serialization/high-quality-export)`。

**同时检查**是否还有其他 Task 因 `onBrokenLinks` 而留下的纯文字占位：

```bash
cd /Volumes/External/works/self/konvajs && grep -rn '待创建\|TODO\|稍后补链接' docs/ || echo "无残留占位"
```
Expected: `无残留占位`。

- [ ] **Step 6: 构建 + 演示健康检查 + 校验**

```bash
cd /Volumes/External/works/self/konvajs && npm run build && npm run demo-health && npm run verify
```
Expected: 全绿。`data-and-serialization` 6 页、`animations` 6 页、`groups-and-layers` 4 页，均与官方一致。

- [ ] **Step 7: 提交**

```bash
cd /Volumes/External/works/self/konvajs
git add docs/data-and-serialization docs/animations docs/groups-and-layers docs/faq.md static/downloads/code
git commit -m "$(cat <<'EOF'
docs: 补齐 data-and-serialization 2 页、animations 1 页、groups-and-layers 1 页

high-quality-export 页讲的是一处名字相同、默认值相反的坑：
toDataURL/toImage/toCanvas/toBlob 的 pixelRatio 默认是 1，
而 cache() 的 pixelRatio 默认是 Konva.pixelRatio（设备像素比）。
「导出的图比屏幕上看到的糊」因此是默认行为而不是 bug。

z-index 页写明了 setZIndex 越界时只 warn 不抛错、该次调用被静默忽略——
所以 node.zIndex(999) 不会置顶而是什么都不做，这种「代码看着对、
运行没报错、效果没出来」的情况最难查。

best-practices 页的核心论点是不要把 toJSON 的产物当数据模型：
它是渲染层快照，结构跟着 Konva 版本走，存进数据库等于把业务数据
绑死在第三方库的内部格式上。这一页不需要演示，讲的是数据结构设计。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: 全量验收与收尾

**Files:**
- Modify: `specs/2026-09-18-konvajs-site-overhaul-design.md`（订正 §4.3 的两处计数错误）
- Read-only: 全站

**Interfaces:**
- Consumes: Task 1–8 的全部产出
- Produces: 可交付状态

- [ ] **Step 1: 页数对账**

```bash
cd /Volumes/External/works/self/konvajs
echo "本站总页数：$(find docs -name '*.md' | wc -l)"
for d in shapes filters events select-and-transform styling performance drag-and-drop tweens data-and-serialization animations groups-and-layers selectors clipping guides nodejs; do
  printf '%-26s %s\n' "$d" "$(find docs/$d -name '*.md' 2>/dev/null | wc -l)"
done
printf '%-26s %s\n' "根级" "$(find docs -maxdepth 1 -name '*.md' | wc -l)"
```

Expected（官方对应页数括注，本站可多出原创页）：
`shapes 22`（官方 22）、`filters 22`（官方 20 + 本站原创 css-filters、rgba）、`events 17`（17）、`select-and-transform 13`（13）、`styling 9`（9）、`performance 10`（官方 9 + 本站原创 shape-redraw）、`drag-and-drop 9`（9）、`tweens 7`（7）、`data-and-serialization 6`（6）、`animations 6`（6）、`groups-and-layers 4`（4）、`selectors 3`（3）、`clipping 2`（2）、`guides 2`（2）、`nodejs 1`（1）、根级 8（官方 9，`sandbox` 画廊索引留给 P8）。

**总计 141 页。** = 110（P5 结束时）+ 31（本计划）。

- [ ] **Step 2: 订正 spec §4.3 的两处计数错误**

写本计划时对照 sitemap 实测，发现 spec §4.3 有两处算错，**留着会让后续批次继续按错的数字规划**：

1. C3 写的是「21 页」，逐项相加（filters +13、shapes +2、events +2、data_and_serialization +2、styling +1、animations +1、groups_and_layers +1）实为 **22**；且 filters 实际缺 **14** 页（spec 把官方的 `RGB` 当成了本站的 `rgba`，但这是两个不同的滤镜——`RGB` 注册 red/green/blue，`RGBA` 只额外注册 alpha），故 C3 实为 **23**。
2. C3 的验收写「12 个章节页数与官方一致，合计 114」，但本站有 3 页官方没有的原创页（`css-filters`、`rgba`、`shape-redraw`），实际合计 **117**。

在 §4.3 的表格下方追加：

```markdown
**P6 实测订正**（2026-09-21，对照 konvajs.org/sitemap.xml 实测 277 个 /docs/ 页）：

- C3 实为 **23 页**而非 21：逐项相加本就是 22（表内各项之和），且 `filters` 实缺
  **14** 页而非 13——官方的 `RGB` 与本站的 `rgba` 是两个不同的滤镜（`RGB` 注册
  red/green/blue，`RGBA` 只额外注册 alpha 并复用前三者），不能相互抵充。
- C3 验收改为「12 个章节页数**不少于**官方，差额为本站原创新增页」。本站有 3 页
  官方没有的原创页（`filters/css-filters`、`filters/rgba`、`performance/shape-redraw`），
  故 12 个章节合计 **117** 而非 114。
- 全站缺口实为 **170 页**（277 官方 − 107 已对齐），拆为 P6 31 页、P7 框架绑定 60 页、
  P8 sandbox 70 页、P9 posts 9 页。全部完成后本站 **280 页**。
```

- [ ] **Step 3: 跑完整检查套件**

```bash
cd /Volumes/External/works/self/konvajs && npm run check
```
Expected: 退出码 0，16 项全 PASS。这一条包含 `typecheck` + `build` + `demo-health` + `verify`。

- [ ] **Step 4: 重新测量原创增量指标**

```bash
cd /Volumes/External/works/self/konvajs && node test/lib/content-stats.mjs
```
Expected: 141/141 页满足正文内广告位门槛（h2 ≥ 3 且正文 ≥ 800 字）。**若有新页未达标，说明它的第三类小节太短，回到对应 Task 补足**——不要放宽 `MIN_SECTION_CHARS`。

- [ ] **Step 5: 确认新增页没有误入 301 表**

```bash
cd /Volumes/External/works/self/konvajs && wc -l < static/_redirects && grep -cE 'guides|nodejs|faq|tools|about|donate|ai-tools|brightness|contrast|custom-filter|emboss|enhance|hsl|hsv|mask|noise|pixelate|/rgb|sepia|solarize|threshold|group|/line|pointer-events|mobile-tap|fill-stroke|best-practices|high-quality|text-animations|z-index' static/_redirects || echo "新增页未进 301 表（符合 spec 7.2.2）"
```
Expected: `静态 _redirects` 行数不变（96 条页面级规则 + 固定的 netlify.app 规则），新增页**一条都不在里面**。

- [ ] **Step 6: 抽查结构化数据没被内容破坏**

上一阶段踩过的坑：FAQ 正文里出现 `</script>` 会提前闭合 script 标签，整段 JSON-LD 作废。本批新增的 `docs/ai-tools.md`、`docs/faq.md`、`docs/nodejs/nodejs-setup.md` 都可能在 FAQ 里贴代码。

```bash
cd /Volumes/External/works/self/konvajs
for p in faq ai-tools tools about donate guides/why-konva nodejs/nodejs-setup filters/brightness filters/threshold groups-and-layers/z-index; do
  f="build/docs/$p/index.html"
  n=$(grep -o '"@type":"FAQPage"' "$f" 2>/dev/null | wc -l)
  printf '%-32s FAQPage=%s\n' "$p" "$n"
done
```
Expected: 每一页都是 `FAQPage=1`。**任何一页是 0，说明该页的 JSON-LD 被破坏了**，去看 `plugins/structuredData.ts` 的 `jsonForScript` 有没有覆盖到该字符。

- [ ] **Step 7: 提交 spec 订正**

```bash
cd /Volumes/External/works/self/konvajs
git add specs/2026-09-18-konvajs-site-overhaul-design.md plans/2026-09-21-p6-missing-core-pages.md
git commit -m "$(cat <<'EOF'
docs: P6 完成，订正 spec 的两处页数计数错误

对照 konvajs.org/sitemap.xml 实测 277 个 /docs/ 页，发现 spec 4.3 算错两处：
C3 逐项相加本就是 22 不是 21，且 filters 实缺 14 页不是 13——
spec 把官方的 RGB 当成了本站的 rgba，但这是两个不同的滤镜。

留着不改会让 P7/P8/P9 继续按错的数字规划，所以一并订正，
并把全站缺口的准确拆分（170 = 31 + 60 + 70 + 9）写进 spec。

C3 的验收从「页数与官方一致」改为「不少于官方，差额为本站原创页」——
本站有 3 页官方没有的原创页，硬要求相等会逼着删掉它们。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8: 收尾**

**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch

---

## 自审记录

按 writing-plans 的自审清单逐条过了一遍，以下是发现并已在计划里修掉的问题：

**1. spec 覆盖**：本计划覆盖 spec §4.3 的 C2 剩余（guides 2 + nodejs 1 + 根级 5）与 C3 全部（23）。C4/C5/C6 明确划归 P7/P8/P9 并在开头的缺口全景表里给了页数与理由。§4.4 的原创增量要求由 Global Constraints 与每个 Task 的 h2 骨架落实。§7.2.2「新增页不进 301 表」由 Task 9 Step 5 验证。

**2. 发现的计划缺陷（已修）**：
- **`sidebar_position` 我第一版是凭直觉「接在最大值后面」写的，实测后发现 5 处是错的。**
  读出各章节的实际占位后：`data-and-serialization` 占 1、2、3、**5**（缺 4），`animations`
  占 1、2、3、4、**6**（缺 5）——按直觉写的 `best-practices: 5` 和 `text-animations: 6`
  都会与既有页撞号；`events`（1–15）与 `styling`（1–8）则是我多留了空档。已全部改成实测值
  （Group 21 / Line 22、pointer-events 16 / mobile-tap 17、fill-stroke-order 9、
  best-practices 4 / high-quality-export 6、text-animations 5、z-index 4）。
  **撞号不会让构建失败**，只会让侧边栏顺序变得不确定，属于最容易漏掉的一类错。
- **`docs/faq.md` 会链接到 Task 8 才创建的 `high-quality-export`**，`onBrokenLinks: 'throw'` 会直接让 Task 2 构建失败。已在 Task 2 Step 3 明确要求先写纯文字，并在 Task 8 Step 5 补链接 + 全局扫残留占位。这个坑上一阶段踩过三次。
- **`docs/tools.md` 与 `docs/support.md` 的「生态工具」段重复**。已在 Task 2 Step 5 要求把 support.md 那段改为一行链接，并说明改后 support.md 仍满足原创校验。
- **演示目录用下划线、文档目录用连字符**（`data_and_serialization` vs `data-and-serialization`），引用路径容易写错。已在 Task 8 开头单独标注。
- **`hsl.md` 与 `hsv.md` 极易写成复制粘贴**。原创校验只查字数查不出来，但这会造成站内重复内容。已在 Task 4 Step 2 加了反重复约束。
- **`demo-health` 查不出「滤镜没生效」**——它只检查画布上有非透明像素。已在 Task 4/5 各加一步人工目视确认，并点名 Emboss、Enhance、Mask、Solarize 四个最容易做成无效果的。
- **`filters/brighten.md` 是现存错误内容而非缺失页**。原本不在"补齐缺失"范围内，但 Task 4 写 Brightness 时必然发现，留着不管等于持续误导。已并入 Task 6。

**3. 类型与命名一致性**：全篇的属性名（`fillAfterStrokeEnabled`、`embossDirection`、`pixelSize`、`pointerEventsEnabled`、`dragDistance`、`hitOnDragEnabled`）、方法名（`setZIndex`、`moveToTop`、`getAbsoluteZIndex`、`clearCache`、`findOne`）、路由（`/docs/...`）与演示文件名，均取自 `konva@10.6.0` 源码或仓库实际文件，前后一致。

**4. 三条不可跳过的实测步骤**（Task 4 Step 3、Task 5 Step 2/3、Task 7 Step 5）：F2（Brighten vs Brightness 语义相反）、F5（Threshold 二值化 alpha）、F24（一次交互派发两套事件）都是从源码推演出来的结论。上一阶段有过一次从 changelog 抄来的结论被浏览器实测推翻的教训（"CSS 滤镜不需要 cache()"），所以凡是要写进文档的行为断言，一律先跑再写，**实测与推演不符时以实测为准并回头修正事实表**。
