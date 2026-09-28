# P10 原创专题（官方没有的四个章节）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增四个官方文档完全没有的原创章节——「中文环境」4 页、「框架与工程集成」2 页、「编辑器常用功能」3 页、「升级与迁移」2 页，共 **11 页**；顺手修掉 3 个既有章节在面包屑与 llms.txt 里归类错误的问题。

**Architecture:** 与 P6 相同：每页一个 Markdown 放进 `docs/<章节>/`，章节靠 `_category_.json` 与 `sidebar_position` 自动进侧边栏。需要演示的 5 页在 `static/downloads/code/<章节>/<Demo_Name>.html` 放可独立运行的 HTML。唯一的代码改动是 Task 1：`plugins/structuredData.ts` 的章节名改为从 `_category_.json` 读取，`plugins/llmsTxt.ts` 补齐章节表，并各加一道检查防止再漏。

**Tech Stack:** Docusaurus 3.10.2、React 19.3、TypeScript ~5.9.3、Node ≥ 20；演示页为纯 HTML + `https://unpkg.com/konva@10/konva.min.js`。

**Spec:** `specs/2026-09-18-konvajs-site-overhaul-design.md`（§1.2 重复内容风险、§4.4 原创增量、§7.2.2 新增页不进 301 表）

---

## 为什么是这 11 页

spec §1.2 已写明：官方 `konvajs.org/zh-Hans` 有完整官方中文版，P7–P9 这类对齐页在搜索与 AI 引用上天然处于劣势，原创增量段只是对冲。**官方完全没有的主题**才是本站能独占的内容。

选题前对照了官方 sitemap（2026-09-28 实测）的全部 `/docs/` 页，**以下主题官方有、本批不做**，避免与 P8/P9 撞车：

| 想过的主题 | 官方已有 | 归属 |
|---|---|---|
| 撤销 / 重做 | `posts/canvas-undo-redo`、`react/Undo-Redo`、`vue/Undo-Redo` | P7 / P9 |
| 以指针为中心缩放、无限画布 | `sandbox/Zooming_Relative_To_Pointer`、`sandbox/Infinite_Canvas` | P8 |
| 可编辑文字（基础版） | `sandbox/Editable_Text` | P8；本批只做它没覆盖的**输入法**部分 |
| 自定义字体（基础版） | `sandbox/Custom_Font` | P8；本批只做它没覆盖的**中文字体排版失效**部分 |
| 对象吸附与参考线 | `sandbox/Objects_Snapping` | P8；本批只做**标尺与拖出式参考线** |
| 白板、标注、选座、画布编辑器 | `sandbox/Multiplayer_Whiteboard` 等 | P8；完整项目系列留给 P11 |
| SvelteKit | `svelte/SvelteKit` | P7 |

**官方没有的**：升级指南、从 Fabric 迁移、Next.js、Nuxt、中文字体排版、输入法、WebView 画布上限、小程序、快捷键、剪贴板、标尺——即本批 11 页。

## 批次全景

| 批次 | 内容 | 页数 | 状态 |
|---|---|---:|---|
| P6 | 核心文档补齐 | 31 | 已完成（本站 141 页） |
| P7 | 四套框架绑定 | 60 | 待写 |
| P8 | sandbox 画廊 | 70 | 待写 |
| P9 | posts | 9 | 待写 |
| **P10（本计划）** | **四个原创章节** | **11** | 本文件 |
| P11 | 实战项目系列（编辑器 / 白板 / 标注） | 约 15 | 待写 |

P10 结束时本站 **152 页**。P10 与 P7–P9 互不依赖，可先于它们执行。

## Global Constraints

以下为 spec 的全局约束，**每个 Task 的要求都隐含包含本节**：

- `AD_CLIENT` 固定为 `ca-pub-9580076271637088`，**不得修改**；`static/ads.txt` 内容**不得修改**。
- `src/components/Ad/` 下**不得出现 `setInterval` / `setTimeout`**。由 `test/checks/ads.js` 强制。
- **不得参考 `konvajs/site` 仓库的 `i18n/zh-Hans/**`**（`license: null`）。本计划所有 Konva API 事实取自 **`konva@10.7.0` npm 包源码**与本计划「事实表」里的实测，不取自任何译文。
- 所有 CDN 引用必须是 **`konva@10`**，路径只能是 `konva.js` 或 `konva.min.js`。需要展示旧版写法时，该行或紧邻上一行非空行必须带 `❌`。由 `test/checks/konva-version.js` 强制。
- `static/_redirects` 的 96 条 301 **不得删除**；新增页面**不进** 301 表。
- 每页 **≥ 3 个 h2**，必须有 **`## 常见问题`**（下含以 `？` 结尾的 `### 问句`），以及 **`## 国内环境注意事项` / `## 与其他方案的取舍` / `## 性能提示`** 之一；这两类小节各自 **≥ 150 字**（不含代码块）。由 `test/checks/originality.js` 强制。
- 页面 `title` 全站唯一，`description` 非空且不是站点兜底文案。由 `test/checks/metadata.js` 强制。
- 演示文件名与页面文件名**归一化后相等**（去大小写、下划线、连字符）。例：`docs/china/ime-text-editing.md` → `static/downloads/code/china/Ime_Text_Editing.html`。由 `test/checks/demos.js` 强制。
- 演示图片一律用站内绝对路径 `/assets/<file>`；演示首屏画布必须非空（`demo-health` 统计非透明像素）。
- 内部链接必须指向**已存在**的页面（`onBrokenLinks: 'throw'`）。引用本计划后续 Task 才创建的页面时先写纯文字，在目标页的 Task 里回填链接。
- **新页必须先 `git commit` 再 `npm run build && npm run verify`**——sitemap 的 `lastmod` 取自 `git log`，未提交的页会让 `seo` 检查 FAIL（P6 Task 1 实测）。
- 本批**不得**写「需要 `dynamic(..., { ssr: false })`」之类的旧结论，除非明确限定在 Konva ≤ 9——见事实 F9。

## 事实表（本计划所有技术断言的出处）

**实测环境**：`konva@10.7.0`、`react-konva@19.3.0`、`vue-konva@4.0.1`，Node 22，本机 Chrome（playwright-core）。实验脚本在会话草稿目录，不入库；每条都写明了可复现的做法。

| # | 事实 | 出处 | 用在 |
|---|---|---|---|
| F1 | `Text` 的换行结果 `textArr` 与基线偏移 `_baselineShift` 只在**构造时**和 `ATTR_CHANGE_LIST` 里的属性变化时由 `_setTextData()` 计算 | `lib/shapes/Text.js` 构造函数、`ATTR_CHANGE_LIST`、文件末尾 `Text.prototype.on(...)` | chinese-fonts |
| F2 | 设成**相同的值**不触发任何事件：`_setAttr` 里 `oldVal === val` 直接 return | `lib/Node.js:2016-2020` | chinese-fonts |
| F3 | **实测**：宽 200 的 `Text`（`'Konva 10.7 WWW mmm iii 中英混排 Transformer width 测试 lorem ipsum dolor'`，20px）在字体加载前构造得 4 行、基线偏移 6.5；字体加载完成后该节点**仍是 4 行、6.5**，新建节点是 **5 行、8**。`t.fontFamily(t.fontFamily())` 无效；`t.fontFamily(''); t.fontFamily(f)` 后与新建节点一致 | 本机 Chrome + `@font-face` 延迟 800ms 返回字体 | chinese-fonts |
| F4 | **实测**：纯中文段落在字体加载前后换行**完全相同**（各行宽 200/200/180）——中文字形几乎都是等宽全角，问题集中在中英混排、数字与基线 | 同上 | chinese-fonts |
| F5 | **实测**：字体只在 canvas 里使用、DOM 没用到时，Chrome 仍会触发下载；但第一帧用的是回退字体，且 Konva 不监听字体加载，**不会自动重绘** | 同上，`document.fonts.check()` 首帧 false、1.5s 后 true | chinese-fonts |
| F6 | 在 Node 里 `import Konva` 成功，`new Konva.Rect()` 成功，`new Konva.Stage()` 抛 `Konva.js unsupported environment ... "document" object is undefined` | 本机 Node 22 直接运行 | nextjs、mini-program |
| F7 | Konva 创建画布走 `Util.createCanvasElement()` → `ensureBrowser()` → `document.createElement('canvas')`，**没有 DOM 就无法创建任何画布** | `lib/Util.js:591-604` | mini-program |
| F8 | react-konva 在 `useLayoutEffect` 里才 `new Konva.Stage`；`renderToString(<Stage><Layer><Rect/><Text/></Layer></Stage>)` 输出 `<div></div>`、不报错 | `react-konva/es/ReactKonvaCore.js:96-101`；本机 `react-dom/server` 实测 | nextjs |
| F9 | react-konva README「Usage with Next.js」：Konva 10+ 用 `'use client'` 即可，**无需额外 canvas 配置**；Konva 9 及更早才需要装 `canvas` 或关闭 SSR | `react-konva@19.3.0/README.md:174-180` | nextjs、upgrade-to-v10 |
| F10 | vue-konva 的 `v-stage` 在 `setup()` 里就 `new Konva.Stage({ container: document.createElement('div') })`；Vue SSR 渲染时抛 `document is not defined` | `vue-konva/dist/vue-konva.js:112-119`；本机 `@vue/server-renderer` 实测 | nuxt |
| F11 | `konva.min.js` 10.7.0 为 192,898 字节，gzip 后 57,486 字节 | 本机 `wc -c` / `gzip -c` | nextjs、nuxt |
| F12 | Layer 的场景画布像素比取 `Konva.pixelRatio`（默认 `window.devicePixelRatio`），命中画布固定 `pixelRatio: 1` | `lib/Layer.js:41-44`、`lib/Global.js:97`、`lib/Canvas.js:26-31` | webview-canvas-limits |
| F13 | 10.3.2 起：`listening: false` 的图层释放舞台大小的命中画布；舞台的两块缓冲画布延迟到首次需要时才分配 | CHANGELOG 10.3.2 | webview-canvas-limits |
| F14 | `Konva.releaseCanvasOnDestroy` 默认 `true`，销毁时把画布宽高设为 0，注释写明是为 Safari（macOS/iOS）内存泄漏 | `lib/Global.js:165-175`、`lib/Util.js:1141-1148` | webview-canvas-limits |
| F15 | `toObject()` 跳过所有「非纯对象」属性——`Konva.Image` 的 `image`（HTMLImageElement）不会被序列化；`filters` 只保留字符串（CSS 滤镜），函数滤镜被丢弃 | `lib/Node.js:1292-1324` | clipboard |
| F16 | 10.0.0：ESM；CJS 须 `require('konva').default`；Node 端须显式 `import 'konva/canvas-backend'` 或 `'konva/skia-backend'`；文本定位对齐 DOM/CSS，可用 `Konva.legacyTextRendering = true` 恢复；`Brighten` 由 `Brightness` 取代；新增 CSS 滤镜字符串 `node.filters(['blur(10px)'])` | CHANGELOG 10.0.0 | upgrade-to-v10 |
| F17 | 9.0.0 唯一变化是把 npm 包从 ES 改回 CommonJS；8.0.0 移除 `Konva.Collection`（`find()` 返回数组）、移除 `Util.extend`、移除 Stage 的 `content*` 事件、引入 `autoDrawEnabled` 自动重绘 | CHANGELOG 9.0.0、8.0.0 | upgrade-to-v10 |
| F18 | 10.x 小版本里的行为变化：10.4.0 `getChildren()` 返回副本、`Konva.Animation.animations` 变为 `Set`、`text.off('textChange.konva')` 不再能移除重排监听；10.6.0 自定义滤镜签名变为 `(imageData, pixelRatio)`、未在拖拽的节点上 `stopDrag()` 为空操作、`absolutePosition(stage.getPointerPosition())` 不再能通过类型检查；10.7.0 移除 `Stage.bufferCanvas` | CHANGELOG 10.4.0 / 10.6.0 / 10.7.0 | upgrade-to-v10 |
| F19 | `Konva.Node.create(json, container?)` 是反序列化入口 | `lib/Node.js:2352` | clipboard |

**浏览器与平台事实**（非 Konva 源码，页内须以「以官方文档为准」措辞承载，不给出无法核验的精确数字）：

- iOS Safari 单块 canvas 面积上限普遍为 4096 × 4096 = 16,777,216 像素；超出后画布空白、导出为空。另有**进程级 canvas 总内存上限**，报错形如 `Total canvas memory use exceeds the maximum limit`，具体数值随设备而异。
- 输入法组合输入期间 `keydown` 的 `isComposing` 为 `true`；Safari 在确认候选词的那次回车上 `isComposing` 可能已为 `false`、但 `keyCode === 229`。判断须写成 `e.isComposing || e.keyCode === 229`。
- iOS 只在用户手势的**同步调用栈**里允许 `focus()` 弹出软键盘。
- 微信小程序的逻辑层没有 DOM；`<web-view>` 须在后台配置业务域名，个人主体小程序不支持 `<web-view>`（以微信官方文档为准）。
- `navigator.clipboard` 只在安全上下文（HTTPS 或 localhost）可用，写入须在用户手势内。

## Review Focus

spec 没写、但读者最可能踩到的五个情况，每条都落在了对应 Task 的步骤里：

1. **中英混排、数字的文字在字体晚到后换行错误**——chinese-fonts 页必须用 F3 的实测数据说明，不能只说「记得重绘」（Task 2 Step 1 断言页内含 `fontFamily('')`）。
2. **输入法确认候选词的回车被当作「提交编辑」**——ime 演示必须实现 `isComposing || keyCode === 229` 判断（Task 3 Step 3 的 grep 断言）。
3. **快捷键在页面其他输入框里误触发**——keyboard 演示必须跳过 `input`/`textarea`/`contentEditable` 目标（Task 8 Step 3 的 grep 断言）。
4. **粘贴图片节点得到空白**——clipboard 页必须写明 F15，演示对 `Image` 节点单独保存 `src`（Task 9 Step 3 的 grep 断言）。
5. **标尺跟着舞台一起被缩放**——rulers 演示必须变换「世界」图层而不是 Stage（Task 10 Step 3 的 grep 断言 `stage.scale(` 不出现）。

---

## Task 1: 章节名单一来源 + 修复既有归类错误

**现状问题**（2026-09-28 实测）：`plugins/structuredData.ts` 的 `SECTION_LABELS` 缺 `select-and-transform`、`guides`、`nodejs`，这三个章节的面包屑第三级显示的是英文目录名；`plugins/llmsTxt.ts` 的 `SECTIONS` 也缺这三项，它们在 llms.txt 里被塞进「其他」。本批再加四个章节，若继续手工维护两张表，只会漏得更多。

**Files:**
- Modify: `plugins/structuredData.ts`（`SECTION_LABELS` 改为读 `docs/*/_category_.json`）
- Modify: `plugins/llmsTxt.ts`（`SECTIONS` 补齐）
- Modify: `test/checks/jsonld.js`（新增：面包屑分类名不得是 ASCII 目录名）
- Modify: `test/checks/llms.js`（新增：「其他」里不得出现章节页）

**Interfaces:**
- Produces: 之后任何新章节只需建 `_category_.json`，面包屑自动正确；llms.txt 漏登记会被检查拦下。

- [ ] **Step 1: 写失败的检查**

`test/checks/jsonld.js` 的面包屑循环里追加：

```js
        // 三级面包屑的第三项是章节名。插件找不到章节名时会退回目录名，
        // 退回的结果是英文 slug（如 select-and-transform），不含中文即说明漏了。
        if (items.length === 4 && !/[一-鿿]/.test(items[2].name)) {
          problems.push(`${r} 面包屑的章节名是目录名「${items[2].name}」，_category_.json 未被读到`);
        }
```

`test/checks/llms.js` 在条目检查之后追加：

```js
    // 「其他」只该收根级页（/docs/<page>）。章节页（/docs/<section>/<page>）
    // 落进来，说明 plugins/llmsTxt.ts 的 SECTIONS 漏登记了该章节。
    const rest = txt.split(/^## 其他$/m)[1];
    if (rest) {
      const nested = [...rest.matchAll(/\]\(https:\/\/[^/]+\/docs\/([^/)]+)\/[^)]+\)/g)].map((m) => m[1]);
      const sections = [...new Set(nested)];
      if (sections.length) {
        problems.push(`llms.txt 的「其他」里有章节页，SECTIONS 漏登记：${sections.join('、')}`);
      }
    }
```

- [ ] **Step 2: 确认两项检查在现状下失败**

Run: `npm run build && npm run verify`
Expected: `结构化数据` FAIL，提到 `select-and-transform`、`guides`、`nodejs`；`llms.txt` FAIL，提到同样三个章节。

- [ ] **Step 3: structuredData 改为读 `_category_.json`**

删除 `SECTION_LABELS` 常量，改为插件启动时读取：

```ts
/**
 * 目录名 → 面包屑显示名，直接取自 docs/<section>/_category_.json 的 label。
 *
 * 原先是手写的一张表，要求与 _category_.json「保持一致」——实际上
 * select-and-transform、guides、nodejs 三个章节加进来时都漏了，
 * 面包屑退回成英文目录名。侧边栏本就以 _category_.json 为准，这里跟它走同一个来源。
 */
async function loadSectionLabels(siteDir: string): Promise<Record<string, string>> {
  const docsDir = path.join(siteDir, 'docs')
  const labels: Record<string, string> = {}
  for (const entry of await fs.readdir(docsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    try {
      const raw = await fs.readFile(path.join(docsDir, entry.name, '_category_.json'), 'utf8')
      const { label } = JSON.parse(raw) as { label?: string }
      if (label) labels[entry.name] = label
    } catch {
      // 没有 _category_.json 的目录不是章节，跳过
    }
  }
  return labels
}
```

插件签名改为接收 context：`export default function structuredDataPlugin(context: LoadContext): Plugin`（`import type { LoadContext, Plugin } from '@docusaurus/types'`），在 `postBuild` 开头 `const sectionLabels = await loadSectionLabels(context.siteDir)`，原 `SECTION_LABELS[section]` 改为 `sectionLabels[section]`。

- [ ] **Step 4: llmsTxt 补齐章节表**

`SECTIONS` 在 `performance` 之后、`support` 之前按侧边栏顺序补：

```ts
  { prefix: '/docs/select-and-transform', title: '选择与变换' },
  { prefix: '/docs/guides', title: '选型指南' },
  { prefix: '/docs/nodejs', title: 'Node.js 环境' },
  { prefix: '/docs/migration', title: '升级与迁移' },
  { prefix: '/docs/integration', title: '框架与工程集成' },
  { prefix: '/docs/china', title: '中文环境' },
  { prefix: '/docs/editor', title: '编辑器常用功能' },
```

后四个章节此时还没有页面——`matched.length === 0` 时该分区会被跳过，不产生空标题，所以提前登记无害，且避免后续 Task 各改一次这个文件。

- [ ] **Step 5: 检查通过**

Run: `npm run typecheck && npm run build && npm run verify`
Expected: 全部 PASS。抽查 `build/docs/select-and-transform/basic-demo/index.html` 的 BreadcrumbList 第三项为「选择与变换」。

- [ ] **Step 6: Commit**

```bash
git add plugins/structuredData.ts plugins/llmsTxt.ts test/checks/jsonld.js test/checks/llms.js
git commit -m "fix: 面包屑章节名改读 _category_.json，llms.txt 补齐漏登记的章节"
```

---

## Task 2: 「中文环境」章节 + 中文字体页

**Files:**
- Create: `docs/china/_category_.json` → `{ "label": "中文环境", "position": 26 }`
- Create: `docs/china/chinese-fonts.md`（`sidebar_position: 1`）

**Frontmatter:**
```yaml
title: '中文字体加载'
description: '中文 Web 字体晚于 Konva.Text 创建时，已有节点的换行与基线不会自动更新。用 document.fonts.load 预加载，或对已有节点强制重排。'
```

**正文结构（每一小节的要点都必须写到）：**

- 开篇两三句：症状是「字体明明加载了，文字位置和换行还是不对」。
- `## 用法`——推荐做法：先 `await document.fonts.load('20px "思源黑体"', sampleText)` 再创建节点。说明第二个参数的作用：切片字体（`unicode-range`）只下载样本文字涉及的分片，所以要传**实际要显示的文字**，而不是 `'中'` 一个字。代码示例用 `async function` 包起来。
- `## 为什么已有节点不会更新`——F1、F2、F3。给出 F3 的实测数据表（加载前 4 行 / 6.5，已有节点加载后仍 4 行 / 6.5，新建节点 5 行 / 8）。给出强制重排的写法并解释为什么必须先设成别的值：

  ```js
  document.fonts.ready.then(() => {
    stage.find('Text').forEach((t) => {
      const family = t.fontFamily();
      // 设成相同的值不触发重排（Node#_setAttr 会直接跳过），先换一个值再换回来
      t.fontFamily('');
      t.fontFamily(family);
    });
  });
  ```
  并说明 F4：纯中文段落通常看不出问题，中英混排、数字、`verticalAlign`、Transformer 包围盒才是重灾区。
- `## 导出图片前等字体`——F5：canvas 首帧用回退字体且不会自动重绘；`toDataURL()` 在字体就绪前调用，导出图里就是回退字体。示例：`await document.fonts.ready; stage.toDataURL({ pixelRatio: 2 })`。Node 端导出链接 `/docs/nodejs/nodejs-setup`。
- `## 国内环境注意事项`（≥ 150 字）——完整中文字体动辄数 MB 到十几 MB，必须子集化或切片；Google Fonts 在国内访问不稳定，自托管或走国内 CDN；**字体版权**：微软雅黑、苹方等系统字体不能作为 Web 字体分发，可商用的开源选择举思源黑体 / Noto Sans SC（OFL）、霞鹜文楷（OFL）等，注明以各字体的授权文本为准；`fontFamily` 里写回退链 `'"思源黑体", "PingFang SC", "Microsoft YaHei", sans-serif'`。
- `## 常见问题`：`### 为什么只有英文和数字的位置不对？`（F4）、`### document.fonts.ready 之后还是不对？`（ready 只等**已经开始下载**的字体；canvas 没画过、DOM 也没用过的字体根本没开始下载，要用 `load()` 主动触发）、`### 能不能监听字体加载自动重排？`（可以 `document.fonts.addEventListener('loadingdone', …)` 后跑上面的重排循环，但要防抖，切片字体会触发很多次）。

**链接约束**：可链接 `/docs/shapes/text`、`/docs/nodejs/nodejs-setup`、`/docs/data-and-serialization/high-quality-export`（均已存在）。

- [ ] **Step 1: 写页面与 `_category_.json`**，按上面结构。写完自查：`grep -c "fontFamily('')" docs/china/chinese-fonts.md` 输出 ≥ 1。
- [ ] **Step 2: Commit**：`git add docs/china && git commit -m "docs: 新增「中文环境」章节与中文字体加载页"`
- [ ] **Step 3: 校验**：`npm run build && npm run verify`，Expected 全部 PASS；`build/llms.txt` 出现 `## 中文环境`。

---

## Task 3: 输入法与文字就地编辑（含演示）

**Files:**
- Create: `docs/china/ime-text-editing.md`（`sidebar_position: 2`）
- Create: `static/downloads/code/china/Ime_Text_Editing.html`

**Frontmatter:**
```yaml
title: '文字编辑与中文输入法'
description: 'Konva 文字就地编辑要叠一个 textarea。中文输入法下，确认候选词的回车会被误当成提交；Safari 还需额外判断 keyCode 229。'
```

**演示要求**（`Ime_Text_Editing.html`）：
- 舞台上一个可拖拽的 `Konva.Text`（初始文字「双击编辑这段文字，试试用中文输入法打字」）和一个 Transformer。
- `dblclick dbltap` 时：隐藏文字与 Transformer；创建 `textarea`，位置用 `text.absolutePosition()` 加 `stage.container().getBoundingClientRect()` 与 `window.scrollX/Y` 计算，宽度 `text.width() * text.getAbsoluteScale().x`，字号、行高、字体、`transform: rotate(...)` 与文字一致；同步调用 `textarea.focus()`（iOS 手势要求）。
- `keydown`：`if (e.isComposing || e.keyCode === 229) return;` 放在最前；无 Shift 的 Enter 提交、Esc 取消。
- 另挂 `compositionstart` / `compositionend`，在画布角落用一个 `Konva.Text` 显示「输入法：组合中 / 空闲」，让读者看到事件时序。
- 失焦（`blur`）也提交。提交后移除 textarea、恢复显示。

**正文结构：**
- `## 用法`——textarea 叠层的完整思路 + 演示 iframe + 演示源码代码块（与既有页一致，代码块首行注释 `china/Ime_Text_Editing.html`）。
- `## 输入法下的回车`——为什么 `isComposing` 不够、Safari 的 229；错误写法与正确写法对照。
- `## 国内环境注意事项`（≥ 150 字）——搜狗、微信键盘、百度输入法都走组合输入；手机上软键盘弹出会改变视口高度，textarea 定位要在 `visualViewport` 的 `resize` 里重算；iOS 必须在手势同步栈里 `focus()`，异步（如 `setTimeout` 之后）调用不弹键盘；textarea 与画布字体不一致会导致编辑态与显示态换行不同（链接 Task 2 页 `/docs/china/chinese-fonts`）。
- `## 常见问题`：`### 为什么打拼音时按回车，编辑框直接关了？`、`### 编辑时文字和输入框对不齐怎么办？`（缩放、旋转、`padding`、`lineHeight` 四项逐一对齐）、`### 能不能不用 textarea，直接在画布里处理键盘输入？`（不能获得输入法候选窗、光标、选区、系统粘贴，自己实现成本极高）。

**链接约束**：可链接 `/docs/china/chinese-fonts`、`/docs/select-and-transform/resize-text`、`/docs/events/keyboard-events`。

- [ ] **Step 1: 写演示**，本地打开确认：双击出现输入框、中文输入法下回车只上屏不关闭。
- [ ] **Step 2: 写页面**
- [ ] **Step 3: 断言关键逻辑存在**：`grep -c "keyCode === 229" static/downloads/code/china/Ime_Text_Editing.html` 输出 ≥ 1。
- [ ] **Step 4: Commit**：`git add docs/china static/downloads/code/china && git commit -m "docs: 新增文字编辑与中文输入法页及演示"`
- [ ] **Step 5: 校验**：`npm run build && npm run demo-health && npm run verify`，Expected 全部 PASS。

---

## Task 4: WebView 与移动端画布上限（含演示）

**Files:**
- Create: `docs/china/webview-canvas-limits.md`（`sidebar_position: 3`）
- Create: `static/downloads/code/china/Webview_Canvas_Limits.html`

**Frontmatter:**
```yaml
title: '移动端画布内存上限'
description: 'iOS 与微信内置浏览器对 canvas 面积和总内存都有上限，超出后画布白屏、导出为空。按 Konva 的图层结构估算占用，并降低 pixelRatio 与图层数。'
```

**演示要求**（`Webview_Canvas_Limits.html`）：读取当前 `window.devicePixelRatio`、舞台尺寸，按 F12 的公式计算「每个图层场景画布 = 宽 × 高 × dpr² × 4 字节，命中画布 = 宽 × 高 × 4 字节」，用 `Konva.Rect` 画出 1–6 个图层时的柱状图与数字标注，另标出「导出 pixelRatio=3 时的画布面积」与 16,777,216 像素的对比线。首屏必须有内容（demo-health）。

**正文结构：**
- `## 用法`——估算公式、iframe、演示源码；三个降耗手段：移动端 `Konva.pixelRatio = Math.min(window.devicePixelRatio, 2)`（必须在创建舞台之前设置）、合并图层、纯展示图层 `listening: false`（F13）。
- `## 导出高清图时的面积上限`——`toDataURL({ pixelRatio })` 的结果面积 = 舞台面积 × pixelRatio²；超过面积上限时导出为空；给出按上限反推最大 pixelRatio 的函数 `Math.floor(Math.sqrt(16777216 / (w * h)) * 100) / 100`。链接 `/docs/data-and-serialization/high-quality-export`。
- `## 国内环境注意事项`（≥ 150 字）——微信、支付宝等内置浏览器里，单页应用切换路由时旧舞台若未 `destroy()`，画布内存不会归还，累积后报 `Total canvas memory use exceeds the maximum limit`；F14 的 `releaseCanvasOnDestroy` 默认开启，关掉它会复现泄漏；上限数值随设备而异，给出的 16,777,216 是 iOS 上普遍观察到的单画布面积上限，以实机测试为准；链接 `/docs/performance/avoid-memory-leaks`。
- `## 常见问题`：`### 为什么电脑上正常，iPhone 上白屏？`、`### 降低 pixelRatio 会变模糊吗？`（会，2 倍与 3 倍在手机上肉眼差别小，内存差 2.25 倍）、`### 怎么知道当前占了多少画布内存？`（Safari Web 检查器的「Graphics」/「Canvas」面板；Chrome 的 `about:gpu` 与 Memory 面板）。

- [ ] **Step 1: 写演示**
- [ ] **Step 2: 写页面**
- [ ] **Step 3: Commit**：`git add docs/china static/downloads/code/china && git commit -m "docs: 新增移动端画布内存上限页及估算演示"`
- [ ] **Step 4: 校验**：`npm run build && npm run demo-health && npm run verify`，Expected 全部 PASS。

---

## Task 5: 小程序与 uni-app / Taro

**Files:**
- Create: `docs/china/mini-program.md`（`sidebar_position: 4`）

**Frontmatter:**
```yaml
title: '在小程序中使用 Konva'
description: 'Konva 依赖 DOM 创建画布，不能直接运行在微信小程序的逻辑层。可选方案是 web-view 内嵌 H5、uni-app 与 Taro 的 H5 端，或改用小程序原生 Canvas 2D。'
```

**正文结构（无演示）：**
- 开篇直接给结论：不能直接用，原因是 F6、F7（引用源码位置与报错原文）。
- `## 用法`——三条路线各一段并给最小代码：
  1. `<web-view src="https://你的域名/editor">`，H5 页里正常用 Konva；与小程序通信用 `wx.miniProgram.postMessage`（注明消息只在后退、组件销毁、分享等特定时机送达，以微信文档为准）或 `wx.miniProgram.navigateTo` 带参数。
  2. uni-app：编译到 H5 时正常 `import Konva from 'konva'`；编译到小程序时同样不可用；App 端可用 `renderjs`（运行在视图层 WebView，有 DOM）。
  3. Taro：H5 端可用，小程序端不可用。
- `## 与其他方案的取舍`（≥ 150 字）——web-view：功能完整，但需要业务域名、个人主体不支持、首屏多一次 H5 加载；原生 Canvas 2D（`<canvas type="2d">`）：性能与体验最好，但要自己实现命中检测、拖拽、变换，等于重写 Konva 的一大半；按「交互复杂度 × 是否必须在小程序内」给出选择建议。
- `## 常见问题`：`### 有没有 Konva 的小程序适配版？`（官方没有；社区的适配多停留在旧版本，采用前确认维护状态与版本）、`### web-view 里的 Konva 性能会差吗？`（与普通手机浏览器同级，内存限制见 `/docs/china/webview-canvas-limits`）、`### 能不能在小程序里用 Konva 做离屏计算？`（不能，连 `new Konva.Stage` 都会抛错；只有纯数学的 `Konva.Util`、`Konva.Transform` 可用）。

**链接约束**：可链接 `/docs/china/webview-canvas-limits`、`/docs/nodejs/nodejs-setup`。

- [ ] **Step 1: 写页面**
- [ ] **Step 2: Commit**：`git add docs/china && git commit -m "docs: 新增在小程序中使用 Konva 页"`
- [ ] **Step 3: 校验**：`npm run build && npm run verify`，Expected 全部 PASS。

---

## Task 6: 「框架与工程集成」章节 + Next.js 页

**Files:**
- Create: `docs/integration/_category_.json` → `{ "label": "框架与工程集成", "position": 25 }`
- Create: `docs/integration/nextjs.md`（`sidebar_position: 1`）

**Frontmatter:**
```yaml
title: '在 Next.js 中使用'
description: 'Konva 10 与 react-konva 19 在 Next.js App Router 下只需 use client，不必再用 dynamic 关闭 SSR。说明服务端渲染的实际输出、水合不一致与按需加载。'
```

**正文结构：**
- 开篇：网上大量「必须 `dynamic(() => import(...), { ssr: false })`」的答案来自 Konva 9 时代（F9）。
- `## 用法`——`'use client'` 组件的最小示例（`Stage` / `Layer` / `Rect`），说明 F8：服务端只输出一个空 `div`，舞台在浏览器 `useLayoutEffect` 里创建，所以不报错；Server Component 里 `import Konva` 本身没问题，但 `new Konva.Stage()` 会抛错（F6，贴报错原文）。
- `## 水合不一致`——在渲染阶段读 `window.innerWidth` 定舞台尺寸会导致服务端与客户端输出不同；正确写法是 `useState` 初始固定值 + `useEffect` 里测量容器（`ResizeObserver`）。
- `## 性能提示`（≥ 150 字）——F11：Konva 约 57 KB gzip，加 react-konva 后更多；编辑器页以外的页面不该打包它；此时 `dynamic()` 的价值是**拆包**而不是规避 SSR 报错，给出 `dynamic(() => import('./Editor'), { ssr: false, loading: … })` 并说明 `ssr: false` 在这里只是省掉服务端渲染一个空 div 的开销；React 19 须配 react-konva 19。
- `## 常见问题`：`### 升级到 Konva 10 后还需要装 canvas 包吗？`（浏览器端不需要，只有在 Node 里真正渲染画布时才需要，见 `/docs/nodejs/nodejs-setup`）、`### 报 window is not defined 怎么办？`（多半是自己的代码在模块顶层或渲染阶段访问了 `window`，而不是 Konva）、`### Pages Router 也一样吗？`（一样，组件在 `useLayoutEffect` 前不碰 DOM；Pages Router 没有 `'use client'` 概念）。

- [ ] **Step 1: 写页面与 `_category_.json`**
- [ ] **Step 2: 断言没有写出旧结论**：`grep -n "必须.*ssr: false" docs/integration/nextjs.md` 无输出。
- [ ] **Step 3: Commit**：`git add docs/integration && git commit -m "docs: 新增「框架与工程集成」章节与 Next.js 页"`
- [ ] **Step 4: 校验**：`npm run build && npm run verify`，Expected 全部 PASS。

---

## Task 7: Nuxt 页

**Files:**
- Create: `docs/integration/nuxt.md`（`sidebar_position: 2`）

**Frontmatter:**
```yaml
title: '在 Nuxt 中使用'
description: 'vue-konva 的 v-stage 在 setup 阶段就创建 Konva.Stage，Nuxt 服务端渲染时会报 document is not defined。用 ClientOnly、.client.vue 组件或按路由关闭 SSR 解决。'
```

**正文结构：**
- 开篇：与 Next.js 的情况**不同**——F10，贴源码位置与报错原文，说明差异来自两个绑定库创建舞台的时机（react-konva 在 `useLayoutEffect`，vue-konva 在 `setup`）。
- `## 用法`——插件 `plugins/vue-konva.client.ts`：

  ```ts
  import VueKonva from 'vue-konva';
  export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(VueKonva);
  });
  ```
  页面里 `<ClientOnly><v-stage :config="…">…</v-stage><template #fallback>…</template></ClientOnly>`。
- `## 三种写法怎么选`——`<ClientOnly>` / 组件命名为 `Editor.client.vue` / `routeRules: { '/editor/**': { ssr: false } }` 各自的适用场景。
- `## 与其他方案的取舍`（≥ 150 字）——三种写法对 SEO、首屏与代码组织的影响：ClientOnly 粒度最细、页面其余部分仍 SSR；`.client.vue` 适合整个组件只在客户端存在；`routeRules` 最省事但整页失去 SSR，只适合登录后的编辑器页。
- `## 常见问题`：`### 为什么 Next.js 不用处理，Nuxt 要？`、`### 插件不加 .client 后缀行不行？`（注册组件本身在服务端不报错，报错发生在渲染 `v-stage` 时；但只在客户端用的插件加后缀能少打一份服务端包）、`### fallback 里放什么？`（与舞台同尺寸的占位，避免布局跳动）。

**链接约束**：可链接 `/docs/integration/nextjs`。

- [ ] **Step 1: 写页面**
- [ ] **Step 2: Commit**：`git add docs/integration && git commit -m "docs: 新增在 Nuxt 中使用页"`
- [ ] **Step 3: 校验**：`npm run build && npm run verify`，Expected 全部 PASS。

---

## Task 8: 「编辑器常用功能」章节 + 快捷键页（含演示）

**Files:**
- Create: `docs/editor/_category_.json` → `{ "label": "编辑器常用功能", "position": 27 }`
- Create: `docs/editor/keyboard-shortcuts.md`（`sidebar_position: 1`）
- Create: `static/downloads/code/editor/Keyboard_Shortcuts.html`

**Frontmatter:**
```yaml
title: '快捷键'
description: '给 Konva 编辑器加删除、方向键微调、全选、Ctrl/Cmd 组合键：监听位置、焦点管理、跳过输入框与输入法组合输入，以及拦截浏览器默认行为。'
```

**演示要求**：若干可点选的图形 + Transformer；点空白处取消选择；`Delete`/`Backspace` 删除选中、方向键移动 1px（按住 Shift 移动 10px）、`Ctrl/Cmd + A` 全选、`Esc` 取消选择；画布角落显示最近一次按键组合。键盘监听挂在 `window`，入口处先判断：

```js
function shouldIgnore(e) {
  const el = e.target;
  return e.isComposing || e.keyCode === 229 ||
    el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}
```

**正文结构：**
- `## 用法`——两种监听位置：`window` 加 `shouldIgnore`，或容器 `tabIndex = 1` + `focus()` 后监听容器（页面有多个画布时用后者）；iframe + 源码。
- `## 组合键与默认行为`——`e.metaKey || e.ctrlKey` 兼容 macOS；`Ctrl+A`、`Ctrl+S`、`Backspace`（旧浏览器会后退）要 `preventDefault()`；用 `e.key` 而不是已废弃的 `keyCode` 判断按键（输入法判断除外）。
- `## 性能提示`（≥ 150 字）——按住方向键会以 30Hz 左右连发 `keydown`，每次都 `node.x(node.x() + 1)`；Konva 的自动重绘本身已按帧合并（`batchDraw`），但若每次按键都写撤销快照或同步到框架状态，就会卡；做法是在 `keyup` 时才提交一次历史记录；多选时移动的是 Transformer 的节点数组，逐个设置即可，不必移动 Transformer 本身。
- `## 常见问题`：`### 为什么按键没反应？`（容器没有获得焦点，或被 `shouldIgnore` 过滤）、`### 在输入框里按 Delete 把画布上的图形删了？`、`### 能不能用 Konva 的事件系统监听键盘？`（不能，Konva 事件只覆盖指针类事件，键盘要用 DOM；链接 `/docs/events/keyboard-events`）。

- [ ] **Step 1: 写演示**
- [ ] **Step 2: 写页面与 `_category_.json`**
- [ ] **Step 3: 断言关键逻辑存在**：`grep -c "isContentEditable" static/downloads/code/editor/Keyboard_Shortcuts.html` 输出 ≥ 1。
- [ ] **Step 4: Commit**：`git add docs/editor static/downloads/code/editor && git commit -m "docs: 新增「编辑器常用功能」章节与快捷键页及演示"`
- [ ] **Step 5: 校验**：`npm run build && npm run demo-health && npm run verify`，Expected 全部 PASS。

---

## Task 9: 复制粘贴（含演示）

**Files:**
- Create: `docs/editor/clipboard.md`（`sidebar_position: 2`）
- Create: `static/downloads/code/editor/Clipboard.html`

**Frontmatter:**
```yaml
title: '复制与粘贴'
description: 'Konva 节点的复制粘贴：画布内用 clone，跨页面用 toObject 写入系统剪贴板再 Node.create 还原；Image 节点的图片不会被序列化，粘贴系统图片则读 clipboardData。'
```

**演示要求**：矩形、星形、一张 `/assets/` 下的图片（用 `Konva.Image`，`setAttr('src', url)` 单独记录地址）可选中；`Ctrl/Cmd + C` 复制、`Ctrl/Cmd + V` 粘贴（偏移 20px、重新生成 `id`、粘贴后选中新节点）、`Ctrl/Cmd + D` 原地复制（`clone()`）；监听 `paste` 事件，剪贴板里有图片文件时用 `URL.createObjectURL` 生成 `Konva.Image`。`navigator.clipboard` 不可用时退回页面内存变量。演示图片从 `ls static/assets` 里挑一张已有的（如 `/assets/lion.png` 等实际存在的文件）。

**正文结构：**
- `## 用法`——画布内复制用 `clone()`；跨标签页或跨应用用 `toObject()` → `JSON.stringify` → `navigator.clipboard.writeText`，粘贴时 `JSON.parse` → `Konva.Node.create()`（F19）；给剪贴板内容加一个类型标记字段，粘贴时先判断是不是自己写入的。iframe + 源码。
- `## 图片节点要单独处理`——F15：`image` 属性不进序列化；做法是创建时 `node.setAttr('src', url)`，还原后按 `src` 重新加载；函数滤镜同样丢失，只有 CSS 字符串滤镜会保留。
- `## 国内环境注意事项`（≥ 150 字）——`navigator.clipboard` 只在 HTTPS 或 localhost 可用，内网 HTTP 部署的后台系统会直接拿不到；读取剪贴板（`readText`）在 Safari 与部分国产浏览器会弹权限确认或直接拒绝，所以粘贴优先走 `paste` 事件的 `clipboardData`，不要主动 `readText()`；微信内置浏览器对剪贴板读取限制更严，粘贴图片基本不可用，应另提供「上传图片」入口。
- `## 常见问题`：`### 粘贴出来的图片是空白的？`（F15）、`### 粘贴后 id 重复了怎么办？`（还原后遍历 `find('*')` 重新赋 id；`find('#id')` 只返回第一个，重复会引发选择错乱）、`### 复制的节点能粘贴到 Figma 或 PPT 吗？`（不能直接用；要互通就另外写一份 PNG（`toBlob()`）进剪贴板，用 `ClipboardItem`）。

- [ ] **Step 1: 写演示**（先 `ls static/assets` 确认图片文件名）
- [ ] **Step 2: 写页面**
- [ ] **Step 3: 断言关键逻辑存在**：`grep -c "setAttr('src'" static/downloads/code/editor/Clipboard.html` 输出 ≥ 1。
- [ ] **Step 4: Commit**：`git add docs/editor static/downloads/code/editor && git commit -m "docs: 新增复制与粘贴页及演示"`
- [ ] **Step 5: 校验**：`npm run build && npm run demo-health && npm run verify`，Expected 全部 PASS。

---

## Task 10: 标尺与参考线（含演示）

**Files:**
- Create: `docs/editor/rulers-and-guides.md`（`sidebar_position: 3`）
- Create: `static/downloads/code/editor/Rulers_And_Guides.html`

**Frontmatter:**
```yaml
title: '标尺与参考线'
description: '给 Konva 画布加随缩放平移更新刻度的标尺，并从标尺拖出参考线、让图形吸附。关键是变换内容图层而不是整个舞台。'
```

**演示要求**：
- 两个图层：`world`（内容，可缩放平移）与 `ui`（标尺，不变换）。**不得调用 `stage.scale(` / `stage.position(`**——stage 的变换会作用于全部图层，标尺会跟着被缩放。
- 滚轮以指针为中心缩放 `world`；拖拽空白处平移 `world`（`world.draggable(true)`，或在舞台 `pointerdown` 时改拖 `world`）。
- 顶部、左侧各一条 20px 标尺，刻度间隔取「1、2、5 × 10ⁿ」中使屏幕间距 ≥ 50px 的最小值；每次 `world` 变换后重画。
- 从标尺按下拖出参考线（水平或竖直 `Konva.Line`，`dragBoundFunc` 锁定一个轴），拖回标尺上删除；参考线存世界坐标，重画时换算到屏幕坐标。
- 拖动图形时，边缘或中心距参考线小于 `6 / world.scaleX()` 世界单位就吸附。

**正文结构：**
- `## 用法`——两图层结构图（用文字列表描述即可），刻度步长算法代码，iframe + 源码。
- `## 世界坐标与屏幕坐标`——`world.getAbsoluteTransform().copy().invert().point(pos)` 把指针换算成世界坐标；参考线必须存世界坐标，否则缩放后错位。
- `## 性能提示`（≥ 150 字）——标尺刻度每次变换都要重画，用 `Konva.Shape` 的 `sceneFunc` 一次画完全部刻度，而不是为每个刻度建一个 `Line` 节点；标尺图层 `listening(false)` 以外单独留一个可点击的透明矩形用于拖出参考线；吸附计算只对当前拖动的节点做，参考线数量少时直接遍历即可，不需要空间索引。
- `## 常见问题`：`### 为什么缩放后标尺也变大了？`（缩放的是 stage）、`### 刻度数字在高倍缩放下变成很长的小数？`（按步长的小数位数 `toFixed`）、`### 和官方的对象吸附示例有什么区别？`（官方 sandbox 的 Objects Snapping 是图形之间互相吸附、参考线临时出现；这里是用户主动放置、持久存在的参考线，两者可以叠加使用）。

**链接约束**：可链接 `/docs/drag-and-drop/drag-a-stage`、`/docs/drag-and-drop/simple-drag-bounds`、`/docs/groups-and-layers/layering`。官方 sandbox 页在 P8 之前不存在，只写纯文字。

- [ ] **Step 1: 写演示**
- [ ] **Step 2: 写页面**
- [ ] **Step 3: 断言没有变换舞台**：`grep -nE "stage\.(scale|position|x|y)\(" static/downloads/code/editor/Rulers_And_Guides.html` 只允许出现读取 `stage.getPointerPosition` 之类的调用，不得有 `stage.scale(`、`stage.position(`。
- [ ] **Step 4: Commit**：`git add docs/editor static/downloads/code/editor && git commit -m "docs: 新增标尺与参考线页及演示"`
- [ ] **Step 5: 校验**：`npm run build && npm run demo-health && npm run verify`，Expected 全部 PASS。

---

## Task 11: 「升级与迁移」章节 + 升级到 Konva 10 页

**Files:**
- Create: `docs/migration/_category_.json` → `{ "label": "升级与迁移", "position": 24 }`
- Create: `docs/migration/upgrade-to-v10.md`（`sidebar_position: 1`）

**Frontmatter:**
```yaml
title: '升级到 Konva 10'
description: '从 Konva 8、9 升级到 10 的逐项清单：ESM 与 require 写法、Node 端画布后端、文本定位变化、Brighten 改名，以及 10.x 小版本里容易踩到的行为变化。'
```

**正文结构：**
- 开篇：先确认当前版本（`Konva.version`），8 → 10 与 9 → 10 的清单不同。
- `## 用法`——按「必改 / 可能受影响 / 可以顺手用上」三档列 F16 与 F17，每条给出旧写法（`❌` 标记）与新写法。例如：

  ```js
  // ❌ Konva 9 的 CommonJS 写法
  const Konva = require('konva');
  // Konva 10 的 CommonJS 写法
  const Konva = require('konva').default;
  ```
- `## 10.x 小版本里的行为变化`——F18 逐条，每条一句「如果你的代码这样写，会怎样」。本站演示跟随浮动大版本 `konva@10`，这些变化会直接作用在读者代码上，这正是这一节存在的理由。
- `## 国内环境注意事项`（≥ 150 字）——npm 国内镜像（npmmirror）同步通常有延迟，刚发布的小版本可能暂时装不到；CDN 引用写 `konva@10` 这样的浮动大版本会自动吃到小版本的行为变化，生产环境建议锁定到具体版本并在升级前读 CHANGELOG；unpkg 在国内的可达性不稳定，生产环境应自托管或用国内镜像 CDN；老项目常见 webpack 4，对 `exports` 字段与 ESM 的支持不完整，升级前先确认打包工具版本。
- `## 常见问题`：`### 升级后文字整体偏了一两像素？`（F16 的文本定位变化，`Konva.legacyTextRendering = true` 可临时恢复，长期应调整坐标）、`### 服务端报 unsupported environment？`（F6 与 F16，链接 `/docs/nodejs/nodejs-setup`）、`### 用了 Next.js 还要 ssr: false 吗？`（F9，链接 `/docs/integration/nextjs`）、`### AI 生成的代码是 Konva 8 的写法怎么办？`（链接 `/docs/ai-tools`）。

**链接约束**：可链接 `/docs/nodejs/nodejs-setup`、`/docs/integration/nextjs`、`/docs/ai-tools`、`/docs/filters/brightness`、`/docs/filters/css-filters`、`/docs/filters/custom-filter`。

- [ ] **Step 1: 写页面与 `_category_.json`**
- [ ] **Step 2: 本地跑版本检查**：`npm run build && npm run verify` 中 `Konva 版本引用` 必须 PASS——若 FAIL，说明某行旧版 CDN 写法漏了 `❌`。
- [ ] **Step 3: Commit**：`git add docs/migration && git commit -m "docs: 新增「升级与迁移」章节与升级到 Konva 10 页"`
- [ ] **Step 4: 校验**：`npm run build && npm run verify`，Expected 全部 PASS。

---

## Task 12: 从 Fabric.js 迁移

**Files:**
- Create: `docs/migration/from-fabric.md`（`sidebar_position: 2`）

**Frontmatter:**
```yaml
title: '从 Fabric.js 迁移'
description: 'Fabric.js 与 Konva 的概念与 API 对照：画布与舞台、对象与节点、内置控制柄与 Transformer、事件名、序列化，以及 Fabric 内置而 Konva 需要自己实现的功能。'
```

**正文结构（无演示）：**
- `## 概念对照`——表格：`Canvas` ↔ `Stage` + `Layer`（Konva 多了图层这一层，多数情况下一个图层足够）；`Object` ↔ `Shape`；`Group` ↔ `Group`；`obj.set({...})` ↔ `node.setAttrs({...})`；`canvas.requestRenderAll()` ↔ 自动重绘（F17 的 `autoDrawEnabled`）；`angle` ↔ `rotation`（都是角度制）；`originX/originY` ↔ `offsetX/offsetY`；`canvas.toJSON()` / `loadFromJSON()` ↔ `stage.toJSON()` / `Konva.Node.create()`。
- `## 用法`——同一个「可选中、可缩放的矩形」两种写法并排。Fabric 写法必须用 v6 起的 ESM 具名导入 `import { Canvas, Rect } from 'fabric'`；Konva 写法需显式创建 Transformer 并处理点选（链接 `/docs/select-and-transform/basic-demo`）。
- `## Fabric 内置、Konva 要自己做的`——框选多选、选中控制柄（Konva 的 Transformer 需显式挂载）、自由绘制笔刷（用 `Konva.Line` 记录点）、就地文字编辑（Fabric 的 `IText` ↔ 链接 `/docs/china/ime-text-editing`）、SVG 导入（Konva 只能把整个 SVG 当图片，或用 `Konva.Path` 逐条路径导入）、复制粘贴（链接 `/docs/editor/clipboard`）。
- `## 事件对照`——`mouse:down` ↔ `pointerdown`；`object:moving` ↔ `dragmove`；`object:modified` ↔ `dragend` + `transformend`；`selection:created` ↔ 无，需自己在选中逻辑里派发。
- `## 与其他方案的取舍`（≥ 150 字）——什么时候不值得迁移：已经深度使用 Fabric 的编辑器能力（文字编辑、SVG 往返），迁移等于重写这些；值得迁移的信号：需要多图层独立重绘、大量节点下的性能（图层拆分、`listening(false)`、缓存）、在 React/Vue 里声明式写画布；给出「先迁移只读展示部分、编辑部分最后迁」的分步策略。
- `## 常见问题`：`### Fabric 的 JSON 能直接导入 Konva 吗？`（不能，结构不同，要写转换函数，逐类映射属性）、`### 迁移后坐标对不上？`（原点：Fabric 的 `left/top` 相对 `originX/originY` 所指的锚点，Konva 的 `x/y` 相对 `offset` 所指的点）、`### 滤镜效果不一样？`（两者算法不同，链接 `/docs/filters/css-filters`）。

**Fabric API 事实核验**：写页前在草稿目录 `npm pack fabric` 读其 `package.json` 版本与 `dist/index.d.ts`，确认 `Canvas`、`Rect`、`requestRenderAll`、`loadFromJSON`、事件名 `object:modified` / `mouse:down` / `selection:created` 均存在；不存在的一律不写。

**链接约束**：可链接 `/docs/select-and-transform/basic-demo`、`/docs/china/ime-text-editing`、`/docs/editor/clipboard`、`/docs/guides/best-canvas-library`、`/docs/filters/css-filters`。

- [ ] **Step 1: 核验 Fabric API**（见上）
- [ ] **Step 2: 写页面**
- [ ] **Step 3: Commit**：`git add docs/migration && git commit -m "docs: 新增从 Fabric.js 迁移页"`
- [ ] **Step 4: 校验**：`npm run build && npm run verify`，Expected 全部 PASS。

---

## Task 13: 目录、spec 与收尾

**Files:**
- Modify: `docs/overview.md`（新增「原创专题」一节，列出四个章节；frontmatter `description` 与开篇里的「十二个主题」改为实际数目）
- Modify: `docs/guides/best-canvas-library.md`（在提到 Fabric 的位置加一句指向 `/docs/migration/from-fabric`）
- Modify: `specs/2026-09-18-konvajs-site-overhaul-design.md`（§4.3 批次表追加 P10 已完成、P11 待写两行）

- [ ] **Step 1: 改 overview**——新增：

  ```markdown
  ## 原创专题

  以下章节官方文档没有，是本站针对中文开发者补写的：

  - [中文环境](/docs/china/chinese-fonts)：中文字体、输入法、移动端画布上限、小程序
  - [框架与工程集成](/docs/integration/nextjs)：Next.js 与 Nuxt 下的服务端渲染
  - [编辑器常用功能](/docs/editor/keyboard-shortcuts)：快捷键、复制粘贴、标尺与参考线
  - [升级与迁移](/docs/migration/upgrade-to-v10)：升级到 Konva 10、从 Fabric.js 迁移
  ```
- [ ] **Step 2: 改 best-canvas-library 与 spec**
- [ ] **Step 3: Commit**：`git add docs/overview.md docs/guides/best-canvas-library.md specs && git commit -m "docs: 教程目录收录原创专题，spec 记录 P10"`
- [ ] **Step 4: 全量校验**：`npm run check`，Expected typecheck、build、demo-health、verify 全部通过；`node test/lib/content-stats.mjs` 中四个新章节的散文字数与广告位达标。
- [ ] **Step 5: 页数核对**：`find docs -name '*.md' | wc -l` 输出 152。
