# Konva 10.x 对齐与演示正确性 实施计划（P2）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 97 页文档与 116 个演示页从 Konva 9.3.6/4.0.18 对齐到 Konva 10.x，修正因版本落后与迁移遗留产生的实质错误，并建立演示健康检查使「浮动大版本」这一策略可持续。

**Architecture:** CDN 引用统一为浮动大版本 `konva@10`（规格 §4.2.1），不再钉死精确版本。代价是上游回归会静默传导到演示，对冲手段是新增 `check-demo-health.js`——用真实 Chrome 加载全部演示页，捕获控制台错误与空画布。版本策略与健康检查是一套，缺一不可。检查器沿用 P1 建立的 `test/verify.js` 契约。

**Tech Stack:** Docusaurus 3.10.2、Konva 10.x（CDN）、playwright-core 驱动本机 Chrome、Node ≥ 20

**Spec:** `specs/2026-09-18-konvajs-site-overhaul-design.md`（§4.2、§4.2.1、§9）

**前置：** P1 已完成并合入 main（`plans/2026-09-21-p1-infrastructure.md`）。

## Global Constraints

以下为项目级约束，每个 Task 的要求都隐含包含本节。

- **CDN 引用一律写 `https://unpkg.com/konva@10/konva.min.js`**（完整版为 `konva@10/konva.js`）。不得出现任何精确版本号，也不得出现 `konva@9`、`konva@4`。
- **`.md` 中的代码块与 `static/downloads/code/` 下的演示 HTML 必须同步修改。** 两者内容高度重复但并不逐字节相同（实测 rect 页 52 行 vs 47 行），只改一处会让读者看到的代码与实际运行的演示不一致。
- **禁止参考 `konvajs/site` 仓库的 `i18n/zh-Hans/**`**。该仓库 `license: null`，默认保留所有权利。唯一允许的英文底稿是 `content/docs/**`。
- **`src/config/ads.ts` 的 `AD_CLIENT`（`ca-pub-9580076271637088`）与 `static/ads.txt` 不得改动。**
- 演示页的行为改变必须以真实浏览器验证，不得仅凭阅读代码判断。
- 本计划**不做**原创增量段（规格 §4.4）与官方新增的 179 页，那是 P3 与 P4。

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `test/checks/demos.js` | iframe 指向的演示文件存在、页面名与演示名一致 |
| `test/checks/konva-version.js` | 全站无旧版本残留，统一为 `konva@10` |
| `test/checks/demo-health.js` | 消费 `test/lib/demo-health.json`，把浏览器实测结果并入 verify |
| `test/lib/demo-health.mjs` | 用 playwright-core 驱动 Chrome 逐个加载演示页，产出 JSON 报告 |
| `docs/**/*.md` | 版本号、破坏性变更复核、新特性补充 |
| `static/downloads/code/**/*.html` | 同上，演示侧 |
| `package.json` | 新增 `demo-health` 脚本与 `playwright-core` 开发依赖 |

---

## Task 1: 演示引用正确性检查与 ring 页错配修正

迁移时发现 `docs/shapes/ring.md`（环形页）的 iframe 指向 `Star.html`（星形演示），读者在环形页看到的是星形。`Ring.html` 就在仓库里，只是从未被引用。这类错配构建期无人拦截——`onBrokenLinks` 只检查 Markdown 链接与 `<a href>`，不看 `<iframe src>`。

**Files:**
- Create: `test/checks/demos.js`
- Modify: `test/verify.js`（注册检查器）
- Modify: `docs/shapes/ring.md`

**Interfaces:**
- Consumes: P1 建立的 `ctx`（`ctx.readRoot`、`ctx.existsRoot`、`ctx.root`）
- Produces: 无新接口

- [ ] **Step 1: 写检查器**

创建 `test/checks/demos.js`：

```js
'use strict';
const fs = require('fs');
const path = require('path');

/**
 * 页面名与演示文件名允许不一致的例外。
 *
 * common-easings 页引用 Common_Easing.html，只是单复数差异，演示内容是对的。
 * 加白名单而不是改文件名：改名要同时改引用，收益为零。
 */
const NAME_MISMATCH_ALLOWED = new Set(['docs/tweens/common-easings.md']);

/** 去掉大小写、下划线、连字符后比较，用于判断「是不是同一个东西」。 */
function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function walkMd(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

module.exports = {
  name: '演示引用正确性',
  run(ctx) {
    const problems = [];
    const docsDir = path.join(ctx.root, 'docs');
    if (!fs.existsSync(docsDir)) {
      problems.push('docs 目录不存在');
      return problems;
    }

    for (const file of walkMd(docsDir)) {
      const rel = path.relative(ctx.root, file).split(path.sep).join('/');
      const text = fs.readFileSync(file, 'utf8');
      const srcs = [...text.matchAll(/src="\/downloads\/code\/([^"]+)"/g)].map((m) => m[1]);

      for (const src of srcs) {
        const onDisk = path.join(ctx.root, 'static', 'downloads', 'code', src);
        if (!fs.existsSync(onDisk)) {
          problems.push(`${rel} 引用的演示不存在：/downloads/code/${src}`);
          continue;
        }
        if (NAME_MISMATCH_ALLOWED.has(rel)) continue;

        const page = path.basename(rel, '.md');
        const demo = path.basename(src, '.html');
        if (norm(page) !== norm(demo)) {
          problems.push(`${rel} 的演示名与页面不符：页面 ${page}，演示 ${demo}`);
        }
      }
    }

    return problems;
  },
};
```

在 `test/verify.js` 的 `checks` 数组开头之后追加（放在 `metadata` 之后即可）：

```js
  require('./checks/demos'),
```

- [ ] **Step 2: 运行，确认抓到 ring 错配**

Run: `node test/verify.js`
Expected: FAIL，`演示引用正确性` 报告
`docs/shapes/ring.md 的演示名与页面不符：页面 ring，演示 Star`

- [ ] **Step 3: 修正 ring.md**

把 `docs/shapes/ring.md` 中的

```html
<iframe src="/downloads/code/shapes/Star.html" style="width: 50vw;height:300px;"></iframe>
```

改为

```html
<iframe src="/downloads/code/shapes/Ring.html" style="width: 50vw;height:300px;"></iframe>
```

同时核对该页下方的 HTML 代码块：它应当与 `static/downloads/code/shapes/Ring.html` 的内容一致，展示 `Konva.Ring` 而非 `Konva.Star`。若代码块里写的是 Star，一并替换为 Ring 演示文件的内容。

- [ ] **Step 4: 构建并检查**

Run: `npm run build && node test/verify.js`
Expected: `演示引用正确性` PASS

- [ ] **Step 5: 人工确认渲染结果**

```bash
npm run serve -- --port 3222 --no-open
```

打开 `http://localhost:3222/docs/shapes/ring`，确认 iframe 里画的是环形（中间有孔）而不是星形。

- [ ] **Step 6: 提交**

```bash
git add test/checks/demos.js test/verify.js docs/shapes/ring.md
git commit -m "fix: 环形页的演示 iframe 指向了星形演示

Ring.html 一直在仓库里但从未被引用，读者在「Ring 环形」页看到的是星形。
新增检查器覆盖这类错配——onBrokenLinks 只检查 Markdown 链接与 a[href]，
不看 iframe src，这类问题构建期无人拦截。"
```

---

## Task 2: CDN 版本统一为 konva@10

**Files:**
- Create: `test/checks/konva-version.js`
- Modify: `test/verify.js`
- Modify: `docs/**/*.md`（88 个文件，202 处）
- Modify: `static/downloads/code/**/*.html`（113 个文件）

**Interfaces:**
- Consumes: Task 1 的检查器契约
- Produces: 无新接口

- [ ] **Step 1: 写检查器（先失败）**

创建 `test/checks/konva-version.js`：

```js
'use strict';
const fs = require('fs');
const path = require('path');

/**
 * 规格 §4.2.1：CDN 引用采用浮动大版本，不钉死精确版本。
 *
 * Konva 一个月内连发五个版本，钉死精确版本意味着每隔几周批量替换两百多处
 * 并重验全部演示。允许的写法只有 konva@10/konva.js 与 konva@10/konva.min.js。
 */
const ALLOWED = /konva@10\/konva(\.min)?\.js/;
const ANY_KONVA_CDN = /konva@[^/\s"']+/g;

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

module.exports = {
  name: 'Konva 版本引用',
  run(ctx) {
    const problems = [];
    const targets = [
      ...walk(path.join(ctx.root, 'docs'), ['.md']),
      ...walk(path.join(ctx.root, 'static', 'downloads'), ['.html']),
    ];

    for (const file of targets) {
      const rel = path.relative(ctx.root, file).split(path.sep).join('/');
      const text = fs.readFileSync(file, 'utf8');
      const refs = text.match(ANY_KONVA_CDN) || [];
      const bad = [...new Set(refs.filter((r) => r !== 'konva@10'))];
      if (bad.length) {
        problems.push(`${rel} 仍引用旧版本：${bad.join('、')}`);
        continue;
      }
      // 有 konva@10 就必须是合法的文件路径写法，防止写成 konva@10/konva-min.js 之类
      if (refs.length && !ALLOWED.test(text)) {
        problems.push(`${rel} 的 konva@10 引用路径不合法`);
      }
    }

    return problems;
  },
};
```

在 `test/verify.js` 追加 `require('./checks/konva-version'),`。

- [ ] **Step 2: 运行，确认失败**

Run: `node test/verify.js`
Expected: FAIL，`Konva 版本引用` 报告约 195 个文件仍引用 `konva@9.3.6` 或 `konva@4.0.18`

- [ ] **Step 3: 批量替换**

```bash
# .md 与演示 HTML 一并处理，两者必须同步，见 Global Constraints
grep -rl 'konva@9\.3\.6\|konva@4\.0\.18' docs/ static/downloads/ \
  | xargs sed -i '' -E 's|konva@(9\.3\.6\|4\.0\.18)/|konva@10/|g'

echo "残留检查："
grep -rn 'konva@9\|konva@4' docs/ static/downloads/ || echo "  无残留"
echo "改后统计："
grep -rhoE 'konva@[0-9]+' docs/ static/downloads/ | sort | uniq -c
```

期望输出：`konva@10` 208 处，无其他版本。

- [ ] **Step 4: 检查**

Run: `npm run build && node test/verify.js`
Expected: `Konva 版本引用` PASS

- [ ] **Step 5: 提交**

```bash
git add docs static test/checks/konva-version.js test/verify.js
git commit -m "feat: CDN 引用统一为浮动大版本 konva@10

208 处（.md 202 处 + 演示 HTML）从 konva@9.3.6 与 konva@4.0.18 统一为
konva@10，由 unpkg 解析到 10.x 最新版。理由见规格 §4.2.1：Konva 一个月内
连发五个版本，钉死精确版本每隔几周就要重来一遍。

.md 代码块与演示 HTML 同步修改——两者内容重复但不逐字节相同，
只改一处会让读者看到的代码与实际运行的演示不一致。"
```

---

## Task 3: 演示健康检查

这是采用浮动大版本的前提（规格 §4.2.1）。没有它，上游任何一次 10.x 回归都会静默传导到全部演示。

**Files:**
- Create: `test/lib/demo-health.mjs`
- Create: `test/checks/demo-health.js`
- Modify: `test/verify.js`
- Modify: `package.json`（新增 `playwright-core` 开发依赖与 `demo-health` 脚本）
- Modify: `.gitignore`（忽略报告产物）

**Interfaces:**
- Consumes: Task 2 产出的演示文件
- Produces:
  - `test/lib/demo-health.mjs` 写出 `test/lib/demo-health.json`，结构为
    `{ generatedAt: string, total: number, results: Array<{ file: string, ok: boolean, errors: string[], canvasCount: number, painted: boolean }> }`
  - `npm run demo-health` 触发上述生成

- [ ] **Step 1: 装依赖**

用本机已安装的 Chrome，不下载 Chromium：

```bash
npm install --save-dev playwright-core@^1.56.0
```

- [ ] **Step 2: 写健康检查脚本**

创建 `test/lib/demo-health.mjs`：

```js
/**
 * 演示页健康检查：用真实 Chrome 逐个加载 static/downloads/code 下的演示页，
 * 记录控制台错误与画布是否真的画出了东西。
 *
 * ## 为什么必须用真实浏览器
 *
 * 演示页是一段直接操作 Canvas 的脚本，它的正确性无法从源码静态判断——
 * API 改名、参数语义变化、绘制顺序问题都只在运行时暴露。而本项目的 CDN
 * 引用采用浮动大版本 konva@10（规格 §4.2.1），上游任何一次 10.x 发布都会
 * 立刻作用到这些页面上。没有这道检查，回归会静默存在。
 *
 * ## 「画布非空」怎么判断
 *
 * 读 canvas 的像素数据，统计非透明像素占比。演示页几乎都在浅色背景上画深色
 * 图形，正常情况下非透明像素远多于零；脚本抛错导致什么都没画时该值为 0。
 * 阈值取 0 而非某个百分比——只要画了任何东西就算通过，避免对演示内容做假设。
 *
 * 用 channel: 'chrome' 驱动本机已安装的 Chrome，不下载 Chromium。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(import.meta.dirname, '../..')
const DEMO_DIR = path.join(ROOT, 'static', 'downloads', 'code')
const STATIC_DIR = path.join(ROOT, 'static')
const OUT = path.join(ROOT, 'test', 'lib', 'demo-health.json')
const PORT = 3399
const PAGE_TIMEOUT_MS = 15000

/** 演示页会加载 /assets 下的图片，所以要起一个能同时服务 static 全目录的服务器。 */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
}

function serveStatic() {
  return http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
    const filePath = path.join(STATIC_DIR, urlPath)
    // 防目录穿越
    if (!filePath.startsWith(STATIC_DIR)) {
      res.writeHead(403).end()
      return
    }
    try {
      const data = await fs.readFile(filePath)
      res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] ?? 'application/octet-stream' })
      res.end(data)
    } catch {
      res.writeHead(404).end()
    }
  })
}

async function collectDemos(dir, out = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) await collectDemos(p, out)
    else if (e.name.endsWith('.html')) out.push(p)
  }
  return out
}

const server = serveStatic()
await new Promise((resolve) => server.listen(PORT, resolve))

const demos = (await collectDemos(DEMO_DIR)).sort()
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const results = []

for (const demo of demos) {
  const rel = path.relative(STATIC_DIR, demo).split(path.sep).join('/')
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } })
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

  let canvasCount = 0
  let painted = false
  try {
    await page.goto(`http://localhost:${PORT}/${rel}`, {
      waitUntil: 'networkidle',
      timeout: PAGE_TIMEOUT_MS,
    })
    // 给动画类演示留出一帧的时间
    await page.waitForTimeout(600)
    const probe = await page.evaluate(() => {
      const canvases = [...document.querySelectorAll('canvas')]
      let nonTransparent = 0
      for (const c of canvases) {
        const ctx = c.getContext('2d')
        if (!ctx || !c.width || !c.height) continue
        const { data } = ctx.getImageData(0, 0, c.width, c.height)
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] !== 0) nonTransparent++
        }
      }
      return { canvasCount: canvases.length, nonTransparent }
    })
    canvasCount = probe.canvasCount
    painted = probe.nonTransparent > 0
  } catch (e) {
    errors.push(`导航失败：${e.message}`)
  }
  await page.close()

  results.push({
    file: rel,
    ok: errors.length === 0 && canvasCount > 0 && painted,
    errors,
    canvasCount,
    painted,
  })
}

await browser.close()
server.close()

const report = { generatedAt: new Date().toISOString(), total: results.length, results }
await fs.writeFile(OUT, JSON.stringify(report, null, 2))

const failed = results.filter((r) => !r.ok)
console.log(`演示健康检查：${results.length} 个，失败 ${failed.length} 个`)
for (const f of failed) {
  console.log(`  ${f.file}  canvas=${f.canvasCount} painted=${f.painted}`)
  for (const e of f.errors.slice(0, 2)) console.log(`     ${e.slice(0, 140)}`)
}
```

- [ ] **Step 3: 写消费该报告的检查器**

创建 `test/checks/demo-health.js`。**报告与当前演示文件不同步时必须报错**，否则改坏了演示却读到旧报告，检查形同虚设：

```js
'use strict';
const fs = require('fs');
const path = require('path');

const REPORT = 'test/lib/demo-health.json';

function collectDemos(dir, base, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collectDemos(p, base, out);
    else if (e.name.endsWith('.html')) out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

module.exports = {
  name: '演示健康',
  run(ctx) {
    const problems = [];

    if (!ctx.existsRoot(REPORT)) {
      problems.push(`${REPORT} 不存在，先运行 npm run demo-health`);
      return problems;
    }

    let report;
    try {
      report = JSON.parse(ctx.readRoot(REPORT));
    } catch (e) {
      problems.push(`${REPORT} 解析失败：${e.message}`);
      return problems;
    }

    // 报告必须覆盖当前磁盘上的每一个演示。少了说明报告过期——
    // 那种情况下「全部通过」是假象。
    const onDisk = collectDemos(
      path.join(ctx.root, 'static', 'downloads', 'code'),
      path.join(ctx.root, 'static')
    ).sort();
    const reported = new Set(report.results.map((r) => r.file));
    const missing = onDisk.filter((f) => !reported.has(f));
    if (missing.length) {
      problems.push(
        `报告未覆盖 ${missing.length} 个演示（如 ${missing[0]}），请重新运行 npm run demo-health`
      );
    }

    for (const r of report.results) {
      if (r.ok) continue;
      const why = [];
      if (r.errors.length) why.push(`控制台错误：${r.errors[0].slice(0, 100)}`);
      if (r.canvasCount === 0) why.push('页面上没有 canvas');
      else if (!r.painted) why.push('canvas 上没有画出任何内容');
      problems.push(`${r.file} — ${why.join('；')}`);
    }

    return problems;
  },
};
```

在 `test/verify.js` 追加 `require('./checks/demo-health'),`。

- [ ] **Step 4: 加脚本**

`package.json` 的 `scripts` 中新增，并把它接到 `check` 前面：

```json
    "demo-health": "node test/lib/demo-health.mjs",
    "check": "npm run typecheck && npm run build && npm run demo-health && npm run verify"
```

`.gitignore` **不要**忽略 `test/lib/demo-health.json`——它需要进版本库，这样 CI 能看到上次的基线，评审也能看到某次改动让哪些演示从通过变成失败。

- [ ] **Step 5: 首次运行，记录基线**

Run: `npm run demo-health`
Expected: 输出 `演示健康检查：116 个，失败 N 个`

**这一步的产出是一份事实清单，不是「必须全绿」。** 把失败的演示逐个记录下来，它们是 Task 4 的输入。常见原因有三类，处理方式不同：

1. **本来就坏**（迁移前就坏，与 Konva 10 无关）——修
2. **Konva 10 破坏性变更导致**——按 Task 4 处理
3. **外部资源加载失败**（演示引用了外网图片）——改为引用 `static/assets` 下的本地图片

- [ ] **Step 6: 提交基线**

```bash
git add package.json package-lock.json test/lib/demo-health.mjs test/lib/demo-health.json test/checks/demo-health.js test/verify.js
git commit -m "feat: 演示健康检查，用真实 Chrome 加载全部演示页

这是浮动大版本策略的前提（规格 §4.2.1）：上游任何一次 10.x 回归都会
立刻作用到全部演示，没有这道检查回归会静默存在。

判定标准为「无控制台错误 + 存在 canvas + canvas 上画出了非透明像素」。
像素阈值取 0 而非某个百分比，只要画了东西就算通过，不对演示内容做假设。

报告入版本库：CI 能看到基线，评审能看到某次改动让哪些演示由通过变失败。
检查器校验报告覆盖了磁盘上的每个演示，报告过期时报错而非假装通过。"
```

---

## Task 4: 修复健康检查暴露的演示问题

**Files:**
- Modify: Task 3 Step 5 列出的失败演示对应的 `static/downloads/code/**/*.html`
- Modify: 上述演示对应的 `docs/**/*.md`（代码块需同步）
- Modify: `test/lib/demo-health.json`（重新生成）

**Interfaces:**
- Consumes: Task 3 的 `test/lib/demo-health.json`
- Produces: 更新后的报告，全部 `ok: true`

- [ ] **Step 1: 按失败原因分类**

```bash
node -e "
const r = require('./test/lib/demo-health.json');
const failed = r.results.filter(x => !x.ok);
const byReason = { 无canvas: [], 未绘制: [], 控制台错误: [] };
for (const f of failed) {
  if (f.canvasCount === 0) byReason['无canvas'].push(f.file);
  else if (!f.painted) byReason['未绘制'].push(f.file);
  else byReason['控制台错误'].push(f.file);
}
for (const [k, v] of Object.entries(byReason)) {
  console.log(k + ' (' + v.length + '):');
  v.forEach(f => console.log('   ' + f));
}
"
```

- [ ] **Step 2: 逐个修复**

对每个失败的演示：

1. 单独打开确认现象：
   ```bash
   npm run serve -- --port 3222 --no-open
   # 浏览器打开 http://localhost:3222/downloads/code/<路径>
   ```
2. 对照 Konva 10 的变更判断成因。已知会影响示例的变更（来自官方 CHANGELOG）：
   - **自定义滤镜函数签名改为 `(imageData, pixelRatio)`**（10.6.0）。若演示写了自定义滤镜且用到长度类参数，需要用 `pixelRatio` 把节点坐标换算成像素。
   - **`toObject()` / `toJSON()` 现在输出显式的 `width`、`height`、`dragDistance`**（10.6.0）。序列化章节演示里展示的 JSON 输出会比文档里写的多出字段，需要更新文档中的示例输出。
   - **闭合路径 `getLength()` 现在包含闭合边**（10.6.0），且 `z` 之后的相对命令从子路径起点算起。
   - **`stopDrag()` 只结束自身手势的拖拽**，对未在拖拽的节点调用是 no-op（10.6.0）。
   - **文本定位默认值改为对齐 DOM/CSS 标准**（10.0.0），像素级定位的示例可能偏移。
   - **`letterSpacing` 按字素而非 UTF-16 码元计算**（10.4.0）。
3. 修演示 HTML，**同时把 `.md` 里对应的代码块改成一致的内容**。
4. 重新生成报告确认该项转绿：
   ```bash
   npm run demo-health
   ```

- [ ] **Step 3: 全部转绿**

Run: `npm run demo-health && node test/verify.js`
Expected: `演示健康检查：116 个，失败 0 个`；`演示健康` PASS

若某个演示确实无法在 Konva 10 下工作且不值得重写（例如依赖已移除的 API），**不要放宽检查器**。正确做法是删掉该演示与引用它的段落，并在提交信息里说明原因。

- [ ] **Step 4: 提交**

```bash
git add static docs test/lib/demo-health.json
git commit -m "fix: 修复 Konva 10 下失效的演示

逐个以真实浏览器确认现象后修复，演示 HTML 与文档代码块同步修改。"
```

---

## Task 5: 文本定位变更的视觉复核

10.0.0 把文本定位默认值改为对齐 DOM/CSS 标准。官方 CHANGELOG 称「不应破坏大部分应用」，但像素级定位会有差异。健康检查只能发现「报错」与「没画东西」，发现不了「画错了位置」，因此这一项需要看图。

站内含 `Konva.Text`、`Konva.TextPath` 或 `Konva.Label` 的页面共 **22 个**。

**Files:**
- Create: `test/lib/text-shots.mjs`
- Modify: 存在问题的演示 HTML 与对应 `.md`
- Create: `test/lib/shots/`（截图产物目录）
- Modify: `.gitignore`（忽略截图目录）

**Interfaces:**
- Consumes: Task 4 后全绿的演示
- Produces: `test/lib/shots/*.png` 供人工查看

- [ ] **Step 1: 写截图脚本**

创建 `test/lib/text-shots.mjs`：

```js
/**
 * 给含文本的演示页逐个截图，供人工复核 Konva 10 的文本定位变更。
 *
 * 不做自动比对：没有 Konva 9 的基线图，而与「预期外观」的比对本身
 * 就需要人来判断。这个脚本的价值是把 22 张图一次性生成好，
 * 而不是让人逐个手动打开页面。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(import.meta.dirname, '../..')
const STATIC_DIR = path.join(ROOT, 'static')
const OUT_DIR = path.join(ROOT, 'test', 'lib', 'shots')
const PORT = 3398

/** 含 Konva.Text / TextPath / Label 的演示，来自对 docs/ 的实测统计。 */
const TEXT_DEMOS = [
  'downloads/code/shapes/Text.html',
  'downloads/code/shapes/TextPath.html',
  'downloads/code/shapes/Label.html',
  'downloads/code/styling/Shadow.html',
  'downloads/code/styling/Blend_Mode.html',
  'downloads/code/events/Binding_Events.html',
  'downloads/code/events/Custom_Hit_Region.html',
  'downloads/code/events/Desktop_and_Mobile.html',
  'downloads/code/events/Fire_Events.html',
  'downloads/code/events/Image_Events.html',
  'downloads/code/events/Listen_for_Events.html',
  'downloads/code/events/Mobile_Events.html',
  'downloads/code/events/Multi_Event.html',
  'downloads/code/drag_and_drop/Complex_Drag_and_Drop.html',
  'downloads/code/drag_and_drop/Drag_Events.html',
  'downloads/code/drag_and_drop/Drop_Events.html',
  'downloads/code/drag_and_drop/Simple_Drag_Bounds.html',
  'downloads/code/performance/Disable_Perfect_Draw.html',
  'downloads/code/performance/Layer_Management.html',
  'downloads/code/performance/Listening_False.html',
  'downloads/code/tweens/All_Easings.html',
  'downloads/code/tweens/Finish_Event.html',
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
}

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
  const filePath = path.join(STATIC_DIR, urlPath)
  if (!filePath.startsWith(STATIC_DIR)) return res.writeHead(403).end()
  try {
    const data = await fs.readFile(filePath)
    res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] ?? 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404).end()
  }
})
await new Promise((r) => server.listen(PORT, r))

await fs.mkdir(OUT_DIR, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })

for (const demo of TEXT_DEMOS) {
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } })
  try {
    await page.goto(`http://localhost:${PORT}/${demo}`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(600)
    const name = demo.replace(/[/]/g, '__').replace('.html', '.png')
    await page.screenshot({ path: path.join(OUT_DIR, name) })
    console.log(`已截图 ${demo}`)
  } catch (e) {
    console.log(`跳过 ${demo}：${e.message}`)
  }
  await page.close()
}

await browser.close()
server.close()
console.log(`\n截图在 ${OUT_DIR}`)
```

- [ ] **Step 2: 生成截图**

Run: `node test/lib/text-shots.mjs`
Expected: 生成 22 张 PNG 到 `test/lib/shots/`

- [ ] **Step 3: 逐张复核**

逐张查看，重点看三件事：

1. **文字是否溢出容器或被裁切**——文本定位基线变化最常见的表现
2. **文字与图形的相对位置是否合理**（例如 Label 的文字是否还在气泡框内）
3. **文字是否重叠**

对有问题的演示，调整其 `y` 坐标或 `verticalAlign`，并同步修改 `.md` 的代码块。

- [ ] **Step 4: 忽略截图产物**

`.gitignore` 追加：

```
test/lib/shots/
```

截图不入库：它们是一次性的人工复核材料，不是基线（没有 Konva 9 的对照图），入库只会让仓库变大。

- [ ] **Step 5: 重新跑健康检查并提交**

```bash
npm run demo-health && node test/verify.js
git add -A
git commit -m "fix: 复核并修正 Konva 10 文本定位变更导致的排版问题

10.0.0 将文本定位默认值改为对齐 DOM/CSS 标准。健康检查只能发现报错与
空画布，发现不了「画错了位置」，因此对 22 个含文本的演示逐张截图人工复核。

截图不入库：没有 Konva 9 的对照图，它们是一次性复核材料而非基线。"
```

---

## Task 6: 补充 Konva 10.x 新特性

规格 §4.2 列出的新特性目前文档中一条都没有。

**Files:**
- Modify: `docs/shapes/regular-polygon.md`
- Modify: `docs/shapes/text.md`
- Modify: `docs/performance/avoid-memory-leaks.md`
- Create: `docs/filters/css-filters.md`
- Create: `static/downloads/code/filters/CSS_Filters.html`
- Modify: `test/lib/demo-health.json`（重新生成）

**Interfaces:**
- Consumes: Task 2 的 `konva@10` 引用规范
- Produces: 一个新页面 `/docs/filters/css-filters`

- [ ] **Step 1: RegularPolygon 补 cornerRadius**

在 `docs/shapes/regular-polygon.md` 的正文末尾、代码块之前插入：

```markdown
## 圆角

Konva 10 起 `RegularPolygon` 支持 `cornerRadius`，可以把正多边形的尖角磨圆：

```js
const hexagon = new Konva.RegularPolygon({
  x: 100,
  y: 100,
  sides: 6,
  radius: 70,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4,
  cornerRadius: 10,
});
```

注意 `cornerRadius` 不能为负值——Konva 10.4.0 之前负值会在绘制时抛错并让其后的图形全部消失，之后的版本会拒绝该值。
```

- [ ] **Step 2: Text 补逐字渲染与字素排版**

在 `docs/shapes/text.md` 末尾追加：

```markdown
## 逐字渲染

Konva 10 提供 `charRenderFunc`，可以对每个字符单独控制绘制。回调里设置的
`fillStyle` / `strokeStyle` 对该字符生效，优先级高于图形本身的属性：

```js
const text = new Konva.Text({
  x: 20,
  y: 20,
  text: '逐字上色',
  fontSize: 40,
  charRenderFunc: (ctx, charInfo) => {
    ctx.fillStyle = charInfo.index % 2 === 0 ? '#4078c0' : '#c04040';
    ctx.fillText(charInfo.char, charInfo.x, charInfo.y);
  },
});
```

## 字素感知排版

Konva 10.4.0 起，文本排版按字素（grapheme）而非 UTF-16 码元处理。这解决了
两类中文与表情场景下的老问题：国旗 emoji 与 ZWJ 组合表情（如 👨‍👩‍👧）不会再被
从中间拆开，`letterSpacing` 也改为每个字素加一次间距而不是每个码元加一次。

如果你的代码依赖旧的按码元计算的间距值，升级到 10.4.0 后含 emoji 的文本
宽度会变化，需要重新确认布局。
```

- [ ] **Step 3: 内存页补 destroy 事件**

在 `docs/performance/avoid-memory-leaks.md` 末尾追加：

```markdown
## 监听节点销毁

Konva 10.4.0 起，`node.destroy()` 开始时会触发 `destroy` 事件。这让你可以在
节点被销毁的那一刻清理挂在它身上的外部资源，例如定时器、订阅或缓存：

```js
shape.on('destroy', () => {
  clearInterval(timerId);
  unsubscribe();
});
```

框架内部也用到了这个事件：`Transformer` 会把被销毁的节点从 `nodes()` 中移除，
`Tween` 会停止该节点上的补间。在 10.4.0 之前，销毁一个正被 Transformer 选中
或正在补间的节点会留下悬空引用。
```

- [ ] **Step 4: 新建 CSS 原生滤镜页**

创建 `docs/filters/css-filters.md`：

```markdown
---
title: 'CSS 原生滤镜'
description: 'Konva 10 支持直接用 CSS 滤镜字符串（如 blur(10px)、saturate(2)）替代 Konva.Filters，由浏览器原生实现，无需先调用 cache()。'
sidebar_position: 8
---

Konva 10 起，`filters()` 除了接受 `Konva.Filters` 下的滤镜函数，还接受 CSS
滤镜字符串。这类滤镜由浏览器原生实现，通常比 JavaScript 逐像素处理快得多，
并且**不需要先调用 `cache()`**：

```js
const image = new Konva.Image({
  image: imageObj,
  x: 50,
  y: 50,
  filters: ['blur(10px)', 'saturate(1.8)'],
});
```

## 与 Konva.Filters 的取舍

| | CSS 滤镜 | Konva.Filters |
|---|---|---|
| 是否需要 cache() | 否 | 是 |
| 性能 | 浏览器原生，通常更快 | JavaScript 逐像素 |
| 可用效果 | CSS filter 规范定义的那些 | Konva 提供的全部，含万花筒等 CSS 没有的 |
| 能否自定义 | 否 | 可以写自定义滤镜函数 |

需要万花筒、噪点这类 CSS 规范里没有的效果时，仍然用 [Konva.Filters](/docs/filters/blur)。

## 长度单位按节点坐标计算

`blur(8px)` 里的长度是**节点坐标**而非缓存像素。这在 Konva 10.6.0 修正过——
此前它按缓存像素计算，导致同一个 `blur(8px)` 在更高的 `pixelRatio` 下看起来
反而更清晰。如果你在 10.6.0 之前调过模糊半径来「凑」效果，升级后需要复核。

写自定义滤镜函数时也要注意：10.6.0 起回调签名是 `(imageData, pixelRatio)`，
用第二个参数把节点长度换算成像素。
```

创建 `static/downloads/code/filters/CSS_Filters.html`，结构与同目录其他演示保持一致（同样的 `<style>`、容器 id 与 `konva@10` 引用），内容为：加载 `/assets/yoda.jpg`，左边原图、右边应用 `['blur(6px)', 'saturate(1.8)']`。

**注意**：`docs/filters/` 下现有页面的 `sidebar_position` 为 1–7，新页取 8，排在最后。

- [ ] **Step 5: 检查**

```bash
npm run build && npm run demo-health && node test/verify.js
```

Expected: 全部 PASS。新页会被 `metadata`、`seo`、`jsonld`、`llms` 四个检查器自动覆盖——它们遍历全部页面，无需登记。

- [ ] **Step 6: 人工确认新页**

```bash
npm run serve -- --port 3222 --no-open
```

打开 `http://localhost:3222/docs/filters/css-filters`，确认演示里右图确实被模糊且饱和度更高。

- [ ] **Step 7: 提交**

```bash
git add docs static test/lib/demo-health.json
git commit -m "feat: 补充 Konva 10.x 新特性

RegularPolygon 的 cornerRadius、Text 的 charRenderFunc 与字素感知排版、
destroy 事件，以及新增「CSS 原生滤镜」页——CSS 滤镜不需要先 cache()，
这是与 Konva.Filters 最实际的差别。

CSS 滤镜页写明了 10.6.0 对长度单位的修正：此前 blur(8px) 按缓存像素
计算，同一个值在更高 pixelRatio 下反而更清晰。"
```

---

## Task 7: 更新 301 映射与规格

新增了 `/docs/filters/css-filters`，它没有对应的旧 URL，不需要 301。但规格 §7.2 的映射表应当说明页面集合已经变化，避免后续有人拿旧表去核对。

**Files:**
- Modify: `specs/2026-09-18-konvajs-site-overhaul-design.md`
- Modify: `README.md`（补新增的检查器）

**Interfaces:**
- Consumes: 前六个 Task 的产物
- Produces: 无

- [ ] **Step 1: 规格补记**

在 §7.2.1 之后追加：

```markdown
### 7.2.2 P2 新增页面

`/docs/filters/css-filters` 为 P2 新增，没有对应的旧 URL，不进 301 映射表。
§7.2 的 96 条对应的是迁移前线上已被收录的页面，该集合不会再增长；
后续新增页面只进 sitemap 与 llms.txt，不进重定向表。
```

- [ ] **Step 2: README 补检查器表格**

在 README 的检查器表格中追加三行：

```markdown
| `demos` | iframe 指向的演示文件存在，且页面名与演示名一致 |
| `konva-version` | 全站无旧版本残留，统一为浮动大版本 `konva@10` |
| `demo-health` | 真实浏览器加载全部演示，无控制台错误且画布非空 |
```

并在「不要改动的值」一节追加：

```markdown
- **CDN 版本一律写 `konva@10`**：不要改回精确版本。理由与代价见规格 §4.2.1——
  浮动版本与演示健康检查是一套，钉死版本会让健康检查失去存在意义，
  而文档会再次陈旧
```

- [ ] **Step 3: 全量验收**

Run: `npm run check`
Expected: 全部 PASS

- [ ] **Step 4: 提交**

```bash
git add specs README.md
git commit -m "docs: 补记 P2 新增页面与检查器"
```

---

## 计划自审

**规格覆盖核对：**

| 规格章节 | 对应 Task |
|---|---|
| §4.2 CDN 版本号 | Task 2 |
| §4.2.1 浮动大版本策略 | Task 2（替换）+ Task 3（对冲手段） |
| §4.2 CommonJS → ESM | 不适用：实测站内无任何 `require('konva')` 用法，示例全部通过 `<script src>` 使用全局 `Konva` |
| §4.2 Node.js 画布后端 | 不适用：本站尚无 nodejs 章节，属 P4 |
| §4.2 文本定位默认值变更 | Task 5 |
| §4.2 新特性补充 | Task 6 |
| §9 `check-demos.js` | Task 1 |
| §9 `check-konva-version.js` | Task 2 |
| §9 `check-demo-health.js` | Task 3 |

**未在本计划覆盖、明确留给后续计划的规格条目：**

- §4.4 原创增量段与 `check-originality.js` → P3
- §6.4 的 `FAQPage`（依赖 §4.4 的小节结构）→ P3
- §4.3 的 C2–C6 共 179 页 → P4 及以后
- 译文整体校对（非 API 正确性，而是行文质量）→ P3

**类型一致性核对：**`test/lib/demo-health.json` 的字段名（`file`、`ok`、`errors`、`canvasCount`、`painted`、`results`、`total`、`generatedAt`）在 `demo-health.mjs` 的写入端与 `demo-health.js` 的读取端一致。检查器均遵循 P1 建立的 `{ name, run(ctx) }` 契约，只使用 `ctx.root`、`ctx.readRoot`、`ctx.existsRoot` 这三个已有方法。演示路径在 `demos.js`、`konva-version.js`、`demo-health.mjs` 中统一以 `static/downloads/code` 为根。
