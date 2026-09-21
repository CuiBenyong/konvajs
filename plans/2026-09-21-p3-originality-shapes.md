# 原创增量段基建与 shapes 章节 实施计划（P3）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立「每页三段结构 + 原创增量」的标准与机械校验，接入 FAQPage 结构化数据，并把 shapes 章节 20 页改造到位，使其同时获得独立搜索价值与正文内广告位库存。

**Architecture:** 规格 §4.4 要求每页含官方所无的原创内容。本计划把这个要求落成可机械校验的页面结构：每页至少三个 `## ` 小节，其中必须有 `## 常见问题`，再加一个「国内环境注意事项 / 与其他方案的取舍 / 性能提示」三选一。这个结构同时解决两件事——原创段落提供判重所需的独立价值，三个 h2 满足 `IN_ARTICLE_RULES.minHeadings` 从而让正文内广告位生效。`## 常见问题` 下的 `### 问句` 与随后段落被插件提取为 FAQPage JSON-LD。

**Tech Stack:** Docusaurus 3.10.2、Konva 10.x、Node ≥ 20

**Spec:** `specs/2026-09-18-konvajs-site-overhaul-design.md`（§4.4、§6.4、§9）

**前置：** P1 与 P2 已完成并合入 main。

## Global Constraints

以下为项目级约束，每个 Task 的要求都隐含包含本节。

- **禁止参考 `konvajs/site` 仓库的 `i18n/zh-Hans/**`**。该仓库 `license: null`，默认保留所有权利。原创段落必须是自己写的中文，不得是任何既有译文的改写。
- **原创段落必须是官方英文站没有的内容。** 把英文原文翻译过来不算原创——那正是判重风险的来源。可写的是：中文开发者实际会踩的坑、国内环境（CDN、字体、移动端浏览器）的注记、与其他方案的横向取舍。
- **不得为了凑数写空话。** `check-originality.js` 会校验每个原创小节的散文字数下限；但字数达标不等于有价值，写之前先问「这句话对读者有没有用」。
- **CDN 版本一律写 `konva@10`**，不得改回精确版本（规格 §4.2.1）。
- `.md` 代码块与 `static/downloads/code/` 下的演示 HTML 必须同步。
- **`src/config/ads.ts` 的 `AD_CLIENT`（`ca-pub-9580076271637088`）与 `static/ads.txt` 不得改动。**
- 本计划只做 shapes 章节 20 页，其余 77 页属 P4。

---

## 页面结构标准

每页统一为：

```markdown
---
title: '...'
description: '...'
sidebar_position: N
---

（开篇一到两句，说明这个图形/特性是什么）

## 用法

（原有的说明文字）

<iframe src="/downloads/code/..." style="width: 50vw;height:300px;"></iframe>

```html
（演示代码）
```

## 常见问题

### 具体的问句？

（回答，至少两三句，给出原因而不只是结论）

### 另一个问句？

（回答）

## 国内环境注意事项 ｜ 与其他方案的取舍 ｜ 性能提示

（三选一，按页面性质定）
```

三个 h2 是硬要求：`IN_ARTICLE_RULES.minHeadings` 为 3，广告插在第 2 个小节之后，
后面还得剩至少 1 节。少于 3 个 h2，该页就拿不到正文内广告位。

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `test/checks/originality.js` | 校验页面结构与原创小节字数 |
| `plugins/structuredData.ts` | 扩展：从 `## 常见问题` 提取 FAQPage |
| `test/checks/jsonld.js` | 扩展：校验 FAQPage |
| `docs/shapes/*.md` | 20 页内容改造 |

---

## Task 1: 页面结构校验器

**Files:**
- Create: `test/checks/originality.js`
- Modify: `test/verify.js`

**Interfaces:**
- Consumes: P1 建立的 `ctx`（`ctx.root`）
- Produces: 导出常量 `REQUIRED_SECTION`（值 `'常见问题'`）与 `THIRD_SECTIONS`（数组），供后续任务与人工对照

- [ ] **Step 1: 写校验器**

创建 `test/checks/originality.js`。**只校验已改造的章节**——一次性对全部 97 页开启会让 CI 立刻全红，把未开工的页面也算成失败，那样这个信号就没用了。用 `ENFORCED_PREFIXES` 控制生效范围，P4 推进时逐个加进来。

```js
'use strict';
const fs = require('fs');
const path = require('path');

/**
 * 已按规格 §4.4 改造完成、开始强制校验的目录。
 *
 * 不一次性对全部 97 页开启：未开工的页面会让 CI 立刻全红，
 * 真实的回归就淹没在里面了。P4 每完成一个章节就把它加进来。
 */
const ENFORCED_PREFIXES = ['docs/shapes/'];

/** 每页必须有的小节。 */
const REQUIRED_SECTION = '常见问题';

/** 第三个小节三选一，按页面性质定。 */
const THIRD_SECTIONS = ['国内环境注意事项', '与其他方案的取舍', '性能提示'];

/**
 * 原创小节的散文字数下限（不含代码块）。
 *
 * 150 这个值来自实测：改造前全站散文中位数只有 137 字，整页加起来都不到。
 * 要求单个原创小节就达到 150，是为了确保它真的承载了内容，
 * 而不是一个标题加一句套话。
 */
const MIN_SECTION_CHARS = 150;

/** h2 数量下限。src/config/ads.ts 的 IN_ARTICLE_RULES.minHeadings 为 3，
 *  少于 3 个该页拿不到正文内广告位。两处需保持一致。 */
const MIN_H2 = 3;

function walkMd(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

/** 去掉代码块、iframe 与 HTML 标签后的纯文字长度（忽略空白）。 */
function proseLength(text) {
  let t = text.replace(/```[\s\S]*?```/g, '');
  t = t.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  t = t.replace(/<[^>]+>/g, '');
  return t.replace(/\s+/g, '').length;
}

/** 按 ## 切分正文，返回 [{ title, body }]。 */
function splitSections(body) {
  const parts = body.split(/^## +/m);
  // 第一段是开篇，没有标题
  return parts.slice(1).map((chunk) => {
    const nl = chunk.indexOf('\n');
    return {
      title: (nl === -1 ? chunk : chunk.slice(0, nl)).trim(),
      body: nl === -1 ? '' : chunk.slice(nl + 1),
    };
  });
}

module.exports = {
  name: '原创增量段',
  REQUIRED_SECTION,
  THIRD_SECTIONS,
  run(ctx) {
    const problems = [];
    const files = walkMd(path.join(ctx.root, 'docs')).filter((f) => {
      const rel = path.relative(ctx.root, f).split(path.sep).join('/');
      return ENFORCED_PREFIXES.some((p) => rel.startsWith(p));
    });

    if (files.length === 0) {
      problems.push('ENFORCED_PREFIXES 没有匹配到任何页面，校验范围配置有误');
      return problems;
    }

    for (const file of files) {
      const rel = path.relative(ctx.root, file).split(path.sep).join('/');
      const text = fs.readFileSync(file, 'utf8');
      const body = text.startsWith('---') ? text.split('---').slice(2).join('---') : text;
      const sections = splitSections(body);

      if (sections.length < MIN_H2) {
        problems.push(
          `${rel} 只有 ${sections.length} 个 h2，需要至少 ${MIN_H2} 个` +
            `（少于此则拿不到正文内广告位）`
        );
      }

      const titles = sections.map((s) => s.title);
      if (!titles.includes(REQUIRED_SECTION)) {
        problems.push(`${rel} 缺「${REQUIRED_SECTION}」小节`);
      }
      const third = THIRD_SECTIONS.filter((t) => titles.includes(t));
      if (third.length === 0) {
        problems.push(`${rel} 缺第三类小节，需要以下之一：${THIRD_SECTIONS.join('、')}`);
      }

      // 原创小节必须真的有内容
      for (const s of sections) {
        if (s.title !== REQUIRED_SECTION && !THIRD_SECTIONS.includes(s.title)) continue;
        const len = proseLength(s.body);
        if (len < MIN_SECTION_CHARS) {
          problems.push(`${rel} 的「${s.title}」只有 ${len} 字，少于 ${MIN_SECTION_CHARS} 字`);
        }
      }

      // 常见问题下必须是 ### 问句的形式，FAQPage 结构化数据据此提取
      const faq = sections.find((s) => s.title === REQUIRED_SECTION);
      if (faq) {
        const questions = [...faq.body.matchAll(/^### +(.+)$/gm)].map((m) => m[1].trim());
        if (questions.length === 0) {
          problems.push(`${rel} 的「${REQUIRED_SECTION}」下没有 ### 问句，无法生成 FAQPage`);
        }
        for (const q of questions) {
          if (!/[？?]$/.test(q)) {
            problems.push(`${rel} 的问句「${q}」没有以问号结尾`);
          }
        }
      }
    }

    return problems;
  },
};
```

在 `test/verify.js` 的 `checks` 数组末尾追加 `require('./checks/originality'),`。

- [ ] **Step 2: 运行，确认全部 20 页失败**

Run: `node test/verify.js`
Expected: FAIL，`原创增量段` 报告 shapes 下 20 页均缺小节。这是预期——内容还没写。

- [ ] **Step 3: 提交**

```bash
git add test/checks/originality.js test/verify.js
git commit -m "test: 新增页面结构与原创增量校验

校验范围用 ENFORCED_PREFIXES 控制，先只覆盖 shapes。一次性对 97 页开启
会让 CI 立刻全红，真实回归就淹没在里面了。

h2 下限 3 与 src/config/ads.ts 的 IN_ARTICLE_RULES.minHeadings 对齐——
少于 3 个小节，该页拿不到正文内广告位。"
```

---

## Task 2: FAQPage 结构化数据

**Files:**
- Modify: `plugins/structuredData.ts`
- Modify: `test/checks/jsonld.js`

**Interfaces:**
- Consumes: Task 1 约定的 `## 常见问题` + `### 问句` 结构
- Produces: 含该结构的页面额外获得一段 `FAQPage` JSON-LD

- [ ] **Step 1: 扩展 jsonld 校验器（先失败）**

在 `test/checks/jsonld.js` 的每页循环内，`BreadcrumbList` 校验之后追加：

```js
      // 含「常见问题」小节的页面必须产出 FAQPage。
      // 判断依据是渲染后的 HTML 里有对应的标题锚点，而不是去读 .md——
      // 检查器只看构建产物，与页面源码的组织方式解耦。
      const hasFaqSection = /<h2[^>]*>[\s\S]{0,80}?常见问题/.test(ctx.read(r));
      const faqBlocks = types.filter((t) => t === 'FAQPage').length;
      if (hasFaqSection && faqBlocks === 0) {
        problems.push(`${r} 有「常见问题」小节但没有 FAQPage 结构化数据`);
      }
      if (faqBlocks > 1) {
        problems.push(`${r} 有 ${faqBlocks} 个 FAQPage，应当有且仅有一个`);
      }
      const faqLd = blocks.find((b) => b['@type'] === 'FAQPage');
      if (faqLd) {
        const items = faqLd.mainEntity || [];
        if (items.length === 0) problems.push(`${r} 的 FAQPage 没有问答条目`);
        for (const it of items) {
          if (it['@type'] !== 'Question') problems.push(`${r} 的 FAQPage 条目类型不是 Question`);
          if (!it.name) problems.push(`${r} 的 FAQPage 有条目缺 name`);
          if (!it.acceptedAnswer?.text) problems.push(`${r} 的 FAQPage 有条目缺答案正文`);
        }
      }
```

- [ ] **Step 2: 运行**

Run: `npm run build && node test/verify.js`
Expected: `结构化数据` PASS（此时还没有任何页面含「常见问题」小节，条件不触发）

- [ ] **Step 3: 扩展插件生成 FAQPage**

在 `plugins/structuredData.ts` 中，`extractDescription` 之后加入提取函数：

```ts
/**
 * 从渲染后的 HTML 中提取「常见问题」小节下的问答对。
 *
 * 从构建产物读而非从 .md 读，理由与本文件顶部一致：产物里的结构是最终结果，
 * 不需要复刻 Markdown 到 HTML 的转换规则。
 *
 * 结构约定见 test/checks/originality.js：`## 常见问题` 下用 `### 问句？`
 * 提问，随后的段落是答案。渲染后即 h2「常见问题」之后、下一个 h2 之前的
 * 若干 h3 与其后的 p。
 */
function extractFaq(html: string): { question: string; answer: string }[] {
  // 截出「常见问题」h2 到下一个 h2 之间的片段
  const start = /<h2[^>]*>(?:(?!<\/h2>)[\s\S])*?常见问题[\s\S]*?<\/h2>/i.exec(html)
  if (!start) return []
  const rest = html.slice(start.index + start[0].length)
  const end = /<h2[^>]*>/i.exec(rest)
  const section = end ? rest.slice(0, end.index) : rest

  const out: { question: string; answer: string }[] = []
  const chunks = section.split(/<h3[^>]*>/i).slice(1)
  for (const chunk of chunks) {
    const close = chunk.indexOf('</h3>')
    if (close === -1) continue
    // h3 里含 Docusaurus 自动插入的锚点链接，要连标签一起剥掉
    const question = decodeEntities(chunk.slice(0, close).replace(/<[^>]+>/g, '')).trim()
    const body = chunk.slice(close + '</h3>'.length)
    const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) =>
      decodeEntities(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
    )
    const answer = paragraphs.filter(Boolean).join(' ')
    if (question && answer) out.push({ question, answer })
  }
  return out
}
```

在写入 `injected` 之前构造 FAQPage，并把它并入注入内容：

```ts
        const faq = extractFaq(original)
        const faqLd =
          faq.length > 0
            ? {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faq.map((f) => ({
                  '@type': 'Question',
                  name: f.question,
                  acceptedAnswer: { '@type': 'Answer', text: f.answer },
                })),
              }
            : null

        const injected =
          `<script type="application/ld+json">${JSON.stringify(techArticle)}</script>` +
          `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>` +
          (faqLd ? `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>` : '')
```

- [ ] **Step 4: 构建并检查**

Run: `npm run build && node test/verify.js`
Expected: 全部 PASS（仍无页面含该小节，FAQPage 尚不产生）

- [ ] **Step 5: 提交**

```bash
git add plugins/structuredData.ts test/checks/jsonld.js
git commit -m "feat: 从「常见问题」小节生成 FAQPage 结构化数据

从构建产物提取而非从 .md 提取，与同文件内 TechArticle、BreadcrumbList
的做法一致——产物里的结构是最终结果，不需要复刻 Markdown 到 HTML 的转换。

校验器断言：有该小节就必须有 FAQPage、至多一个、每个条目有问句与答案正文。"
```

---

## Task 3: shapes 基础图形 7 页

本任务与后两个任务是写作任务。每页要写的内容见各步骤的「要点」——那是**必须覆盖的事实**，
不是可以照抄的句子；行文自己组织，但事实不能变。

**Files:**
- Modify: `docs/shapes/rect.md`、`circle.md`、`ellipse.md`、`ring.md`、`wedge.md`、`arc.md`、`star.md`

**Interfaces:**
- Consumes: Task 1 的结构标准、Task 2 的 FAQ 提取约定
- Produces: 7 页符合校验的内容

- [ ] **Step 1: 改造 rect.md 作为样板**

把现有正文包进 `## 用法`，再补两个小节。完整成品：

```markdown
---
title: 'Rect 矩形'
description: '用 Konva.Rect 绘制矩形：设置位置、宽高、填充与描边，并可通过 cornerRadius 指定统一圆角或四角独立的圆角数组。'
sidebar_position: 1
---

矩形是 Konva 里最常用的图形，也是理解其他图形定位方式的起点。

## 用法

要使用 `Konva` 创建一个矩形，我们可以实例化一个 `Konva.Rect()` 对象。

有关属性和方法的完整列表，请参阅
<a href="https://konvajs.org/api/Konva.Rect.html" target="_blank">Konva.Rect</a> 文档。

`cornerRadius` 既可以是一个数字（四角统一），也可以是
`[左上, 右上, 右下, 左下]` 形式的数组。

（此处保留原有的 iframe 与代码块，不改动）

## 常见问题

### 为什么 x、y 改了，矩形却像绕着左上角旋转？

`Konva.Rect` 的 `x`、`y` 是**左上角**坐标，不是中心点——这一点和
`Konva.Circle`、`Konva.Ellipse` 正好相反，后两者的 `x`、`y` 是中心。
所以给矩形设置 `rotation` 时，它会绕左上角转。想绕中心旋转，把
`offsetX` 设为宽的一半、`offsetY` 设为高的一半，此时 `x`、`y` 的含义
也随之变成中心点。

### 描边为什么看起来比设定的粗一点、还有点糊？

Canvas 的描边是以路径为中线向两侧各画一半的。`strokeWidth: 1` 的竖线
落在整数坐标上时，会横跨两个像素各画半格，于是呈现为两像素宽的灰线。
把坐标偏移 0.5 像素（例如 `x: 50.5`）可以让它落在单个像素内。

### 设置了 fill 却什么都看不到？

先确认图形已经 `layer.add(rect)`，且该图层已经 `stage.add(layer)`。
另一个常见原因是宽高为 0——`Konva.Rect` 不像 CSS 盒子会有默认尺寸，
`width` 与 `height` 必须显式给出。

## 性能提示

矩形是绘制开销最低的图形之一，通常不需要缓存。但如果同一个矩形带有
`shadow`，情况就不同了：阴影在每一帧都要重新计算，是 Canvas 上最贵的
操作之一。静态的带阴影矩形应当调用 `cache()`，把它一次性渲染成位图。

另外，只用作背景或遮罩、不需要响应事件的矩形，设置 `listening(false)`
可以让它不参与命中检测，详见[禁用事件监听](/docs/performance/listening-false)。
```

- [ ] **Step 2: 校验样板页通过**

Run: `npm run build && node test/verify.js 2>&1 | grep -A5 '原创增量段'`
Expected: `rect.md` 不再出现在问题列表中（其余 19 页仍报错）

同时确认 FAQPage 已生成：

```bash
node -e "
const fs=require('fs'); const h=fs.readFileSync('build/docs/shapes/rect/index.html','utf8');
const b=[...h.matchAll(/<script[^>]*type=\"application\/ld\+json\"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const faq=b.find(x=>x['@type']==='FAQPage');
console.log('FAQPage:', faq ? faq.mainEntity.length + ' 条问答' : '未生成');
if(faq) faq.mainEntity.forEach(q=>console.log('  Q:', q.name));
"
```
Expected: `FAQPage: 3 条问答`，三个问句与源码一致

- [ ] **Step 3: 按同一结构改造其余 6 页**

每页保留原有的 `## 用法` 内容、iframe 与代码块不动，新增两个小节。各页要点：

**`circle.md`** — 常见问题：① `x`、`y` 是圆心而非外接矩形左上角，与 `Rect` 相反，混用两种图形定位时最容易出错；② 只有 `radius` 没有 `radiusX`/`radiusY`，需要椭圆用 `Konva.Ellipse`；③ 描边会向外扩张半个 `strokeWidth`，用 `getClientRect()` 量出来的尺寸比 `radius * 2` 大。第三小节用**与其他方案的取舍**：`Circle` 与 `Ellipse`、`RegularPolygon(sides: 64)` 的差别，以及何时该用 `Arc` 画圆环的一段。

**`ellipse.md`** — 常见问题：① `radiusX`、`radiusY` 是半轴不是直径；② 旋转椭圆要用 `rotation` 而非交换两个半轴，后者会让描边和阴影方向不对；③ 缩放 `scaleX` 与增大 `radiusX` 的区别——前者会同时缩放描边宽度。第三小节用**与其他方案的取舍**：椭圆 vs `Circle` + `scale`，以及为什么后者会让 `strokeWidth` 失真。

**`ring.md`** — 常见问题：① `innerRadius` 必须小于 `outerRadius`，相等时什么都画不出来；② 环形的 `x`、`y` 是圆心；③ 想画「部分环」（进度环）要用 `Konva.Arc` 而不是 `Ring`，`Ring` 总是完整一圈。第三小节用**与其他方案的取舍**：`Ring` vs `Arc` vs 两个 `Circle` 叠加，指出叠加方案在半透明填充下会露馅。

**`wedge.md`** — 常见问题：① `angle` 单位默认是角度而非弧度，受 `Konva.angleDeg` 全局开关影响；② `rotation` 决定扇形从哪里开始张开，默认从 3 点钟方向顺时针；③ 画饼图时相邻扇形之间出现细缝，是抗锯齿导致的，让相邻扇形角度略微重叠可以消除。第三小节用**性能提示**：饼图这类由多个静态扇形组成的图形，整体 `cache()` 一次远比逐个绘制便宜。

**`arc.md`** — 常见问题：① `Arc` 与 `Wedge` 的区别是前者有 `innerRadius` 因而是环的一段，后者是从圆心张开的扇形；② `clockwise` 为 `true` 时方向反转，配合 `rotation` 容易算错起止位置；③ 用 `Arc` 做进度环时，进度 0 不应画成 `angle: 0`——描边会残留一个点，应当整个隐藏。第三小节用**与其他方案的取舍**：`Arc` vs `Ring` vs `Path` 的弧线命令，说明 `Path` 更灵活但没有 `innerRadius` 这种现成语义。

**`star.md`** — 常见问题：① `numPoints` 是角数，实际顶点数是它的两倍（内外交替）；② `innerRadius` 与 `outerRadius` 的比值决定星形胖瘦，比值过大时星形会退化成多边形轮廓；③ 星形的 `x`、`y` 是中心，但默认第一个角朝上，靠 `rotation` 调整。第三小节用**与其他方案的取舍**：`Star` vs `Konva.Line` 手工计算顶点，指出前者无法做出不规则星形。

- [ ] **Step 4: 全部 7 页通过校验**

Run: `npm run build && node test/verify.js 2>&1 | grep -A20 '原创增量段'`
Expected: 这 7 页不再出现在问题中

- [ ] **Step 5: 提交**

```bash
git add docs/shapes
git commit -m "docs: shapes 基础图形 7 页补原创增量段

每页改为「用法 / 常见问题 / 第三小节」三段结构。三个 h2 是 inArticle
广告位的准入门槛，改造后这些页面才有该版位的库存。

常见问题写的是中文开发者实际会踩的坑——Rect 与 Circle 的 x/y 语义相反、
描边半像素模糊、Ring 与 Arc 的选择、饼图相邻扇形的抗锯齿细缝等，
均为官方英文文档没有的内容。"
```

---

## Task 4: shapes 线条与路径 5 页

**Files:**
- Modify: `docs/shapes/line-simple-line.md`、`line-polygon.md`、`line-blob.md`、`line-spline.md`、`path.md`

**Interfaces:**
- Consumes: Task 3 确立的结构
- Produces: 5 页符合校验的内容

- [ ] **Step 1: 逐页改造**

各页要点：

**`line-simple-line.md`** — 常见问题：① `points` 是扁平数组 `[x1,y1,x2,y2,...]` 而非点对象数组，传错结构不报错只是画不出来；② 修改 `points` 后必须重新赋值整个数组才会触发重绘，原地 `push` 不会——Konva 10.4.0 起未设置的数组属性每次读取都返回新数组，更要注意这一点；③ `strokeWidth` 为 1 的水平/垂直线在整数坐标上会模糊，同矩形描边问题。第三小节用**性能提示**：长折线用 `Konva.Line` 一个节点远优于拆成多段，以及 `perfectDrawEnabled(false)` 对纯描边线条的收益。

**`line-polygon.md`** — 常见问题：① `closed: true` 才会闭合并填充，否则 `fill` 无效；② 顶点顺序影响自相交多边形的填充结果（非零环绕规则）；③ 多边形的 `x`、`y` 是坐标原点偏移，不是重心，旋转时要配合 `offset`。第三小节用**与其他方案的取舍**：`Line(closed)` vs `RegularPolygon` vs `Path`，指出正多边形不要手算顶点。

**`line-blob.md`** — 常见问题：① `tension` 只在点数 ≥3 时有视觉效果；② `tension` 过大（>1）曲线会自交打结；③ blob 与 spline 的唯一区别就是 `closed`。第三小节用**与其他方案的取舍**：`tension` 平滑 vs `Path` 的贝塞尔命令，前者由点自动推导控制点、不可精确控制，后者反之。

**`line-spline.md`** — 常见问题：① `tension: 0` 退化为折线，默认值就是 0，忘了设会以为功能没生效；② 样条曲线不经过控制点之外的极值点，视觉上可能超出 `points` 的包围盒，`getClientRect()` 会比预期大；③ 动画中逐帧修改 `points` 时应复用同一数组长度，长度变化会让曲线跳变。第三小节用**性能提示**：高频更新的曲线关掉 `perfectDrawEnabled` 与阴影，并说明为什么样条比等长折线更贵。

**`path.md`** — 常见问题：① `data` 接受标准 SVG 路径字符串，可以直接从设计稿导出的 SVG 里复制 `d` 属性；② 路径的坐标原点是 SVG 自身坐标系，粘过来往往偏移在画布外，用 `getClientRect()` 配合 `offset` 归位；③ Konva 10.6.0 起闭合命令 `z` 之后的相对命令从子路径起点算起，`getLength()` 也包含闭合边，若此前基于旧行为算过路径长度需要复核。第三小节用**与其他方案的取舍**：`Path` vs 原生图形，指出 `Path` 无法单独控制某一段的样式，需要分段效果时应拆成多个节点。

- [ ] **Step 2: 校验**

Run: `npm run build && node test/verify.js 2>&1 | grep -A20 '原创增量段'`
Expected: 这 5 页不再出现在问题中

- [ ] **Step 3: 提交**

```bash
git add docs/shapes
git commit -m "docs: shapes 线条与路径 5 页补原创增量段

points 扁平数组的结构陷阱、原地修改不触发重绘、tension 的取值边界、
SVG 路径粘贴后的坐标归位，以及 Konva 10.6.0 对闭合路径 getLength() 的
行为变更，均为官方文档未覆盖的实际问题。"
```

---

## Task 5: shapes 复合与特殊图形 8 页

**Files:**
- Modify: `docs/shapes/text.md`、`text-path.md`、`label.md`、`image.md`、`sprite.md`、`custom.md`、`regular-polygon.md`、`arrow.md`

**Interfaces:**
- Consumes: Task 3 确立的结构
- Produces: 8 页符合校验的内容

**注意**：`text.md` 已有 2 个 h2（逐字渲染、字素感知排版），`regular-polygon.md` 已有 1 个（圆角）。
这些是 P2 加的，保留不动，把原有正文包进 `## 用法` 后再补 `## 常见问题` 即可满足三节要求。

- [ ] **Step 1: 逐页改造**

各页要点：

**`text.md`** — 常见问题：① 中文换行需要显式设置 `width`，否则不换行；② `fontFamily` 写中文字体名在不同系统上解析结果不同，应给出回退列表如 `'PingFang SC, Microsoft YaHei, sans-serif'`；③ `Konva.Text` 不支持富文本，一段文字只能有一种样式，混排要拆成多个节点或用 `charRenderFunc`。第三小节用**国内环境注意事项**：Web Font 在国内加载慢会导致文字先以回退字体渲染再跳变（FOUT），Canvas 上没有 CSS 的 `font-display` 可用，应在 `document.fonts.ready` 之后再绘制；另说明常见中文字体在 Windows 与 macOS 上的可用性差异。

**`text-path.md`** — 常见问题：① 文字长度超过路径长度时尾部会被截断，没有报错；② 路径方向决定文字朝向，逆向路径会让文字上下颠倒，反转 `data` 的点序即可；③ 中文字符在曲率大的路径上间距不均，是按字素逐个定位造成的，可用 `letterSpacing` 微调。第三小节用**国内环境注意事项**：与 `Text` 同样的字体加载问题，且路径文字对字体的字宽更敏感，回退字体会让整段文字长度变化进而超出路径。

**`label.md`** — 常见问题：① `Konva.Label` 必须同时 `add` 一个 `Konva.Tag` 和一个 `Konva.Text`，少任何一个都不显示；② `Tag` 的尺寸由 `Text` 自动撑开，直接给 `Tag` 设 `width` 无效；③ `pointerDirection` 与 `pointerWidth`/`pointerHeight` 要配套设置。第三小节用**与其他方案的取舍**：`Label` vs 手工 `Rect` + `Text` 分组，指出前者自动跟随文字尺寸，后者需要自己监听文字变化。

**`image.md`** — 常见问题：① 必须等 `Image` 的 `onload` 之后再创建 `Konva.Image`，传入未加载完的图片会画出空白；② 不设 `width`/`height` 时按图片原始尺寸绘制，高分屏上会显得过大；③ 跨域图片会污染画布，导致 `toDataURL()` 抛错，需要图片服务端返回 CORS 头且设置 `crossOrigin`。第三小节用**国内环境注意事项**：国内图床与 CDN 普遍不返回 `Access-Control-Allow-Origin`，导出功能会因此失效；给出把图片同域托管或走代理的建议，并说明 `crossOrigin = 'anonymous'` 在服务端不支持时反而会让图片加载失败。

**`sprite.md`** — 常见问题：① `animations` 的每组数值是 `[x, y, width, height]` 四个一组，数量不是 4 的倍数时行为未定义；② 必须调用 `start()` 才会播放，`frameRate` 改动需要重新 `start()`；③ Konva 10.4.0 修复了 `Sprite` 在 `destroy()` 后仍保留定时器的问题，旧版本需要手动 `stop()`。第三小节用**性能提示**：精灵图本身就是缓存友好的，但不要对 `Sprite` 调 `cache()`——那会把当前帧固定下来。

**`custom.md`** — 常见问题：① `sceneFunc` 里必须调用 `context.fillStrokeShape(shape)`，否则 `fill`、`stroke`、`shadow` 属性全部不生效；② 自定义图形默认的命中区域是其包围盒，精确命中要另写 `hitFunc`；③ Konva 10.4.0 起 `sceneFunc` 抛异常不再让节点停留在损坏状态，但异常仍会中断该帧绘制。第三小节用**性能提示**：`sceneFunc` 每帧都会执行，把不随帧变化的计算（路径点、渐变对象）提到外面；复杂自定义图形应 `cache()`。

**`regular-polygon.md`** — 常见问题：① `radius` 是外接圆半径，不是边长，边数变化时视觉大小会变；② `sides` 必须 ≥3，Konva 10.4.0 修复了不设 `sides` 时每次绘制都抛错的问题；③ 第一个顶点默认朝上，与 `Star` 一致。保留已有的 `## 圆角` 作为第三小节。

**`arrow.md`** — 常见问题：① `points` 至少两个点，箭头画在最后一段的末端；② `pointerLength` 与 `pointerWidth` 不随 `strokeWidth` 自动缩放，改粗线条后要同步调大箭头；③ 首尾点重合时（例如双击结束的折线）箭头方向不确定，Konva 10.6.0 改为水平指向。第三小节用**与其他方案的取舍**：`Arrow` vs `Line` + 手工三角形，指出前者的箭头会自动跟随线段方向。

- [ ] **Step 2: 全章节通过**

Run: `npm run build && node test/verify.js`
Expected: 全部检查 PASS，`原创增量段` 无问题

- [ ] **Step 3: 提交**

```bash
git add docs/shapes
git commit -m "docs: shapes 复合与特殊图形 8 页补原创增量段

其中三页的第三小节写「国内环境注意事项」：Text 与 TextPath 面对
Web Font 加载慢导致的 Canvas 文字跳变，Canvas 上没有 font-display
可用；Image 面对国内图床普遍不返回 CORS 头、导致 toDataURL 失效。
这些是官方英文文档不会覆盖、而中文读者一定会遇到的问题。"
```

---

## Task 6: 效果度量与收尾

**Files:**
- Create: `test/lib/content-stats.mjs`
- Modify: `README.md`
- Modify: `specs/2026-09-18-konvajs-site-overhaul-design.md`

**Interfaces:**
- Consumes: Task 3–5 的产出
- Produces: 可复算的内容度量脚本

- [ ] **Step 1: 写度量脚本**

创建 `test/lib/content-stats.mjs`。它不参与 CI 判定，用途是量化改造效果、为 P4 决策提供依据：

```js
/**
 * 内容度量：按章节统计散文字数与 h2 数量，并算出有多少页够得上
 * 正文内广告位的门槛。
 *
 * 不纳入 verify：这是度量而非判定，数值高低没有对错。
 * 判定由 test/checks/originality.js 负责。
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')
const DOCS = path.join(ROOT, 'docs')

// 与 src/config/ads.ts 的 IN_ARTICLE_RULES 保持一致
const MIN_HEADINGS = 3
const MIN_CHARS = 800

function proseLength(text) {
  let t = text.replace(/```[\s\S]*?```/g, '')
  t = t.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  t = t.replace(/<[^>]+>/g, '')
  return t.replace(/\s+/g, '').length
}

/** 含代码在内的正文长度，对应 IN_ARTICLE_RULES.minChars 的口径。 */
function totalLength(text) {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length
}

async function walk(dir, out = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) await walk(p, out)
    else if (e.name.endsWith('.md')) out.push(p)
  }
  return out
}

const files = (await walk(DOCS)).sort()
const bySection = new Map()
let adEligible = 0

for (const f of files) {
  const rel = path.relative(DOCS, f).split(path.sep).join('/')
  const section = rel.includes('/') ? rel.split('/')[0] : '(根级)'
  const text = await fs.readFile(f, 'utf8')
  const body = text.startsWith('---') ? text.split('---').slice(2).join('---') : text
  const prose = proseLength(body)
  const h2 = (body.match(/^## /gm) || []).length
  if (h2 >= MIN_HEADINGS && totalLength(body) >= MIN_CHARS) adEligible++

  if (!bySection.has(section)) bySection.set(section, [])
  bySection.get(section).push({ rel, prose, h2 })
}

const median = (a) => {
  const s = [...a].sort((x, y) => x - y)
  return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)
}

console.log('章节              页数  散文中位数  h2 中位数')
for (const [section, pages] of [...bySection].sort()) {
  console.log(
    `${section.padEnd(24)} ${String(pages.length).padStart(3)}  ` +
      `${String(median(pages.map((p) => p.prose))).padStart(8)}  ` +
      `${String(median(pages.map((p) => p.h2))).padStart(8)}`
  )
}

const all = [...bySection.values()].flat()
console.log(`\n全站 ${all.length} 页，散文中位数 ${median(all.map((p) => p.prose))} 字`)
console.log(`够得上正文内广告位门槛（h2 ≥ ${MIN_HEADINGS} 且正文 ≥ ${MIN_CHARS} 字）的页面：${adEligible} / ${all.length}`)
```

- [ ] **Step 2: 运行并记录**

Run: `node test/lib/content-stats.mjs`

改造前的基线（实测）：全站散文中位数 137 字，够门槛的页面 2 / 97。
记录改造后的数值，写入下一步的提交信息。

- [ ] **Step 3: README 补记**

在检查器表格追加：

```markdown
| `originality` | 页面三段结构、原创小节字数、FAQ 问句格式。范围由 ENFORCED_PREFIXES 控制 |
```

在「开发」一节的命令列表追加：

```markdown
node test/lib/content-stats.mjs   # 按章节统计散文字数与广告位达标情况
```

- [ ] **Step 4: 规格补记**

在 §4.4 末尾追加：

```markdown
**P3 落地形态**：原创增量以固定的三段结构承载——`## 用法`、`## 常见问题`、
以及「国内环境注意事项 / 与其他方案的取舍 / 性能提示」三选一。
`## 常见问题` 下用 `### 问句？` 提问，由 `plugins/structuredData.ts` 提取为
FAQPage 结构化数据。校验见 `test/checks/originality.js`，其生效范围由
`ENFORCED_PREFIXES` 控制，每完成一个章节就把它加进来——一次性对全部页面
开启会让 CI 立刻全红，真实回归反而被淹没。
```

- [ ] **Step 5: 全量验收**

Run: `npm run check`
Expected: 全部 PASS

- [ ] **Step 6: 提交**

```bash
git add test/lib/content-stats.mjs README.md specs
git commit -m "chore: 内容度量脚本与 P3 收尾

content-stats 不参与 CI 判定——数值高低没有对错，判定由 originality
检查器负责。它的用途是量化改造效果并为 P4 排序提供依据。"
```

---

## 计划自审

**规格覆盖核对：**

| 规格章节 | 对应 Task |
|---|---|
| §4.4 原创增量段（三类内容） | Task 3–5，三类小节均有页面采用 |
| §4.4 机械校验存在性 | Task 1 |
| §6.4 `FAQPage` | Task 2 |
| §9 `check-originality.js` | Task 1 |

**未在本计划覆盖、明确留给后续计划的规格条目：**

- shapes 之外 77 页的原创增量段 → P4，把目录加进 `ENFORCED_PREFIXES` 即可开启校验
- §4.3 的 C2–C6 共 179 页新增内容 → P4 及以后
- 译文整体行文质量校对（非 API 正确性）→ 与 P4 合并推进

**类型一致性核对：**`MIN_H2`（`test/checks/originality.js`）与 `IN_ARTICLE_RULES.minHeadings`（`src/config/ads.ts`）同为 3，`content-stats.mjs` 的 `MIN_HEADINGS`、`MIN_CHARS` 与 `IN_ARTICLE_RULES` 同源，三处需一起改。小节标题常量 `REQUIRED_SECTION`（`常见问题`）与 `THIRD_SECTIONS` 在校验器中定义并导出，`plugins/structuredData.ts` 的 `extractFaq` 与之约定一致，均以「常见问题」为 h2 文本、`### ` 为问句。检查器沿用 P1 建立的 `{ name, run(ctx) }` 契约，只使用 `ctx.root`、`ctx.read`、`ctx.rel`、`ctx.docHtml` 这些已有方法。
