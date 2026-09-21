# Konva 中文站 P1 技术基建 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把站点从 dumi 迁移到 Docusaurus，使全部 97 页产出含正文的静态 HTML，并完成广告体系、301 重定向与 GEO 基建，产出一个可直接替换现站的可上线站点。

**Architecture:** Docusaurus 3.10.2 默认 SSG 替代 dumi 的空壳 `exportStatic`，从根本上解决 630 字节空壳问题。广告以 `src/config/ads.ts` 为唯一配置源，`AdUnit` 通过 `key` 中携带 `pathname` 在 SPA 换页时强制重建 `<ins>` 节点。验收以 `test/verify.js` + `test/checks/*.js` 的检查器数组实现，每个检查器导出 `{name, run(ctx)}` 并返回问题字符串数组，构建后运行、CI 阻断。

**Tech Stack:** Docusaurus 3.10.2、React 19.3.x、TypeScript ~5.9.3、Node ≥ 20、yarn 1.22、Netlify

**Spec:** `specs/2026-09-18-konvajs-site-overhaul-design.md`

## Global Constraints

以下为项目级约束，每个 Task 的要求都隐含包含本节。数值均逐字抄自规格。

- **AdSense 发布商 ID `ca-pub-9580076271637088` 不得改动**。改动会断掉 `static/ads.txt` 的账号关联。
- 广告位 slot：`inArticle` = `5362046383`，`articleBottom` = `5362046383`，`tocSidebar` = `5334514048`。
- **`src/components/Ad/` 下不得出现任何 `setInterval` 或 `setTimeout`**。定时刷新广告直接违反 AdSense 版位政策，可能导致账号被限制投放。
- **禁止参考 `konvajs/site` 仓库的 `i18n/zh-Hans/**`**。该仓库 `license: null`，无 LICENSE 文件，默认保留所有权利。唯一允许的英文底稿是 `content/docs/**`。
- 站点 URL：`https://front-end-js.top`，`baseUrl` 为 `/`。
- 依赖版本下限：`@docusaurus/core` 3.10.2、`react` 19.3.x、`typescript` ~5.9.3、Node ≥ 20。
- `npm audit --audit-level=moderate` 退出码必须为 0（0 高危 0 中危）。
- 97 条旧 URL 必须全部 301，映射表见规格 §7.2，不得增删改。
- `static/ads.txt` 内容一字不改。

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `package.json` | 依赖与脚本，重写 |
| `siteMeta.ts` | 站点 URL 与描述常量，供配置与插件共用 |
| `docusaurus.config.ts` | 站点配置、结构化数据、headTags、广告脚本 |
| `sidebars.ts` | 侧边栏结构，映射原 12 个 group |
| `tsconfig.json` | 继承 `@docusaurus/tsconfig` |
| `src/config/ads.ts` | 广告配置唯一来源 |
| `src/components/Ad/AdUnit.tsx` | 单个广告位，含 SPA 换页重建 |
| `src/components/Ad/InArticleAd.tsx` | 正文中部广告，portal 插入 |
| `src/components/Ad/styles.module.css` | 广告样式、CLS 预留、unfilled 收起 |
| `src/theme/DocItem/Content/index.tsx` | wrap 正文，挂 `inArticle` 与 `articleBottom` |
| `src/theme/DocItem/TOC/Desktop/index.tsx` | wrap 桌面目录，挂 `tocSidebar` |
| `src/css/custom.css` | 主题色 `#4078c0`，沿用原 dumi 主色 |
| `src/pages/index.tsx` | 首页 |
| `plugins/llmsTxt.ts` | postBuild 生成 `/llms.txt` 与 `/llms-full.txt` |
| `plugins/structuredData.ts` | 注入 TechArticle / BreadcrumbList JSON-LD |
| `docs/**` | 97 页内容，自 dumi 迁移 |
| `static/_redirects` | 97 条 301 |
| `static/robots.txt` | AI 爬虫显式放行 |
| `static/ads.txt` | 原样迁移 |
| `static/assets/**`、`static/downloads/**` | 原样迁移 |
| `netlify.toml` | 安全响应头 |
| `test/verify.js` | 检查器驱动 |
| `test/lib/audit.mjs` | 依赖漏洞审计，直连 npm 批量通告接口 |
| `test/checks/*.js` | 各项验收 |
| `scripts/migrate-docs.mjs` | 一次性迁移脚本，产出后保留以备复核 |

---

## Task 1: 验收框架与构建健全性检查

先写检查器。此时没有构建产物，检查必然失败，这是预期。

**Files:**
- Create: `test/verify.js`
- Create: `test/checks/build-sanity.js`
- Modify: `package.json`（Task 2 重写，此处仅新增 `verify` 脚本）

**Interfaces:**
- Consumes: 无
- Produces: `ctx` 对象，供后续所有检查器使用：
  - `ctx.buildDir: string` — 构建输出绝对路径（`build/`）
  - `ctx.root: string` — 仓库根绝对路径
  - `ctx.rel(abs: string): string` — 绝对路径转 build 内相对路径，正斜杠
  - `ctx.read(rel: string): string` — 读 build 内文件
  - `ctx.exists(rel: string): boolean`
  - `ctx.readRoot(rel: string): string` — 读仓库根下文件（如 `src/config/ads.ts`）
  - `ctx.existsRoot(rel: string): boolean`
  - `ctx.allFiles: string[]` — build 下全部文件绝对路径
  - `ctx.htmlFiles: string[]` — build 下全部 `.html` 绝对路径
  - `ctx.docHtml(): string[]` — 文档页 `index.html` 绝对路径，排除 404 与 `search/`
- 检查器契约：`module.exports = { name: string, run(ctx): string[] }`，返回空数组即通过。

- [ ] **Step 1: 写 verify 驱动**

创建 `test/verify.js`：

```js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(BUILD);
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));
const rel = (abs) => path.relative(BUILD, abs).split(path.sep).join('/');

const ctx = {
  buildDir: BUILD,
  root: ROOT,
  rel,
  read: (r) => fs.readFileSync(path.join(BUILD, r), 'utf8'),
  exists: (r) => fs.existsSync(path.join(BUILD, r)),
  readRoot: (r) => fs.readFileSync(path.join(ROOT, r), 'utf8'),
  existsRoot: (r) => fs.existsSync(path.join(ROOT, r)),
  allFiles,
  htmlFiles,
  // 文档页 = build 下的 index.html，排除 404 与搜索页。
  // 首页 index.html 也算，因为它同样需要 title/description/canonical。
  docHtml: () =>
    htmlFiles.filter((f) => {
      const r = rel(f);
      return r.endsWith('index.html') && !r.startsWith('search/');
    }),
};

const checks = [require('./checks/build-sanity')];

let failed = 0;
for (const check of checks) {
  const problems = check.run(ctx);
  if (problems.length === 0) {
    console.log(`  PASS  ${check.name}`);
  } else {
    failed += problems.length;
    console.log(`  FAIL  ${check.name}`);
    for (const p of problems.slice(0, 20)) console.log(`          ${p}`);
    if (problems.length > 20) console.log(`          ... 另有 ${problems.length - 20} 条`);
  }
}

console.log('');
if (failed) {
  console.error(`verify 失败：${failed} 个问题`);
  process.exit(1);
}
console.log('verify 全部通过');
```

- [ ] **Step 2: 写构建健全性检查**

创建 `test/checks/build-sanity.js`。这里的 5000 字节阈值直接对应规格 §6.1：dumi 产出的空壳为 630 字节，断言 > 5000 可机械区分「有正文」与「空壳」。

```js
'use strict';

// 迁移前 dumi 产出的空壳为 630 字节。含正文的页面远超此值，
// 取 5000 作为阈值可机械区分两者，且留足余量给内容最短的页面。
const MIN_HTML_BYTES = 5000;
const EXPECTED_DOC_PAGES = 97;

module.exports = {
  name: '构建健全性',
  run(ctx) {
    const problems = [];

    if (!ctx.exists('index.html')) {
      problems.push('build/index.html 不存在，构建未产出首页');
      return problems;
    }

    const docs = ctx.docHtml();
    if (docs.length < EXPECTED_DOC_PAGES) {
      problems.push(`文档页只有 ${docs.length} 个，期望至少 ${EXPECTED_DOC_PAGES} 个`);
    }

    for (const file of docs) {
      const html = ctx.read(ctx.rel(file));
      if (html.length < MIN_HTML_BYTES) {
        problems.push(`${ctx.rel(file)} 仅 ${html.length} 字节，疑似空壳（阈值 ${MIN_HTML_BYTES}）`);
      }
      // 正文必须出现在静态 HTML 里，而不是只存在于客户端渲染后。
      // 不执行 JS 的 AI 爬虫只能看到这里的内容。
      if (!/[一-龥]/.test(html)) {
        problems.push(`${ctx.rel(file)} 静态 HTML 中不含任何中文，正文未参与 SSG`);
      }
    }

    return problems;
  },
};
```

- [ ] **Step 3: 运行，确认失败**

Run: `node test/verify.js`
Expected: FAIL，输出 `build/index.html 不存在，构建未产出首页`

- [ ] **Step 4: 提交**

```bash
git add test/
git commit -m "test: 新增验收框架与构建健全性检查"
```

---

## Task 2: Docusaurus 骨架与依赖

让 Task 1 的检查从「构建不存在」推进到「构建存在但页面不足」。本任务不迁移内容，只搭骨架。

**Files:**
- Modify: `package.json`（全量重写）
- Create: `docusaurus.config.ts`
- Create: `sidebars.ts`
- Create: `tsconfig.json`（覆盖原 dumi 版本）
- Create: `src/css/custom.css`
- Create: `src/pages/index.tsx`
- Delete: `.dumirc.ts`、`.dumi/`（整目录）
- Create: `siteMeta.ts`
- Create: `test/lib/audit.mjs`
- Create: `test/checks/deps.js`
- Modify: `test/verify.js`（注册 `deps` 检查器）

**Interfaces:**
- Consumes: Task 1 的 `ctx`
- Produces:
  - `docusaurus.config.ts` 导出 `SITE_URL = 'https://front-end-js.top'`（后续任务 import）
  - 构建输出目录为 `build/`
  - npm scripts：`build`、`start`、`verify`、`check`

- [ ] **Step 1: 写依赖审计辅助与依赖检查（先失败）**

先创建 `test/lib/audit.mjs`，它输出一行 JSON：成功为
`{ ok: true, counts: {critical,high,moderate,low}, findings: [...] }`，
失败为 `{ ok: false, error: "原因" }`。**两者必须区分——审计跑不起来不等于没有漏洞。**
完整实现见仓库中的该文件。

再创建 `test/checks/deps.js`：

```js
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');

// 与规格 §8 的版本下限一一对应。
const REQUIRED = {
  '@docusaurus/core': '3.10.2',
  '@docusaurus/preset-classic': '3.10.2',
};

// 这些是 dumi 时代的遗留依赖，必须被移除：
// @umijs/preset-dumi 是 dumi 1 的 preset，与 dumi 2 不兼容且本项目从未使用；
// gatsby-plugin-netlify 属于 Gatsby 生态，本项目不是 Gatsby。
const FORBIDDEN = ['dumi', '@umijs/preset-dumi', 'gatsby-plugin-netlify', 'patch-package'];

module.exports = {
  name: '依赖与安全',
  run(ctx) {
    const problems = [];
    const pkg = JSON.parse(ctx.readRoot('package.json'));
    const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

    for (const [name, version] of Object.entries(REQUIRED)) {
      if (!all[name]) problems.push(`缺少依赖 ${name}`);
      else if (!all[name].includes(version)) {
        problems.push(`${name} 版本为 ${all[name]}，期望 ${version}`);
      }
    }
    for (const name of FORBIDDEN) {
      if (all[name]) problems.push(`遗留依赖 ${name} 未移除`);
    }

    // 审计走 test/lib/audit.mjs，不走 npm audit CLI。
    //
    // 本项目的 npm registry 指向 npmmirror 镜像，该镜像未实现 audit 接口
    // （返回 "[NOT_IMPLEMENTED] /-/npm/v1/security/*"）；而加
    // --registry=https://registry.npmjs.org 会让 npm 用官方源重新解析全部
    // 一千多个包的元数据，实测长时间不返回。audit.mjs 直接调用 npm audit
    // 内部用的批量通告接口，一次请求秒级返回，且不受本地 registry 配置影响。
    let report;
    try {
      const out = execFileSync(process.execPath, [path.join(ctx.root, 'test/lib/audit.mjs')], {
        cwd: ctx.root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      report = JSON.parse(out);
    } catch (err) {
      problems.push(`无法运行依赖审计：${err.message}`);
      return problems;
    }

    if (!report.ok) {
      // 审计跑不起来不等于没有漏洞。这里必须报为问题，
      // 否则网络故障会被静默当成「安全」。
      problems.push(`依赖审计未能完成：${report.error}`);
      return problems;
    }

    for (const severity of ['critical', 'high', 'moderate']) {
      const n = report.counts[severity] || 0;
      if (n > 0) {
        const hits = report.findings
          .filter((f) => f.severity === severity)
          .map((f) => `${f.name}@${f.range}（${f.title}）`);
        problems.push(`${severity} 漏洞 ${n} 个：${hits.join('；')}`);
      }
    }
    if (report.counts.low > 0) {
      console.log(`          提示：另有 ${report.counts.low} 个低危漏洞，不阻断构建`);
    }

    return problems;
  },
};
```

在 `test/verify.js` 的 `checks` 数组中追加：

```js
const checks = [require('./checks/build-sanity'), require('./checks/deps')];
```

- [ ] **Step 2: 运行，确认失败**

Run: `node test/verify.js`
Expected: FAIL，`依赖与安全` 报告 `缺少依赖 @docusaurus/core`、`遗留依赖 dumi 未移除`

- [ ] **Step 3: 重写 package.json**

```json
{
  "name": "konvajs-zh",
  "version": "1.0.0",
  "description": "Konva.js 中文文档",
  "private": true,
  "scripts": {
    "start": "docusaurus start",
    "build": "docusaurus build",
    "serve": "docusaurus serve",
    "clear": "docusaurus clear",
    "swizzle": "docusaurus swizzle",
    "typecheck": "tsc",
    "verify": "node test/verify.js",
    "check": "npm run typecheck && npm run build && npm run verify"
  },
  "authors": ["cuibenyong@gmail.com"],
  "license": "MIT",
  "dependencies": {
    "@docusaurus/core": "3.10.2",
    "@docusaurus/preset-classic": "3.10.2",
    "@mdx-js/react": "^3.1.1",
    "clsx": "^2.1.1",
    "prism-react-renderer": "^2.4.1",
    "react": "^19.3.0",
    "react-dom": "^19.3.0"
  },
  "devDependencies": {
    "@docusaurus/module-type-aliases": "3.10.2",
    "@docusaurus/tsconfig": "3.10.2",
    "@docusaurus/types": "3.10.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "typescript": "~5.9.3"
  },
  "browserslist": {
    "production": [">0.5%", "not dead", "not op_mini all"],
    "development": ["last 3 chrome version", "last 3 firefox version", "last 5 safari version"]
  },
  "overrides": {
    "serialize-javascript": "^7.1.1",
    "uuid": "^11.1.1"
  },
  "engines": {
    "node": ">=20.0"
  }
}
```

**关于 `overrides`**：这两个包都是 Docusaurus 3.10.2 的传递依赖，且都只在构建期
使用——`serialize-javascript` 来自 `copy-webpack-plugin` 与
`css-minimizer-webpack-plugin`，`uuid` 来自 `webpack-dev-server` → `sockjs`，
均不进入浏览器产物。但审计接口在它们的默认版本（6.0.2 / 8.3.2）上报出三条通告：

| 级别 | 包 | 问题 |
|---|---|---|
| high | serialize-javascript ≤7.0.2 | 经 RegExp.flags 与 Date.prototype.toISOString 的 RCE |
| moderate | serialize-javascript <7.0.5 | 构造类数组对象导致 CPU 耗尽 DoS |
| moderate | uuid <11.1.1 | v3/v5/v6 传入 buf 时缺少缓冲区边界检查 |

规格 §8 的门槛是 0 高危 0 中危，因此用 `overrides` 强升。两者都跨了大版本
（6→7、8→11），升级后必须验证两件事：`npm run build` 成功，且 `npm start`
起的开发服务器能正常响应——`uuid` 影响的正是开发服务器依赖的 sockjs。

- [ ] **Step 4: 写 tsconfig.json**

```json
{
  "extends": "@docusaurus/tsconfig",
  "compilerOptions": {
    "baseUrl": "."
  },
  "exclude": [".docusaurus", "build"]
}
```

- [ ] **Step 5: 写 siteMeta.ts 与 docusaurus.config.ts**

先建 `siteMeta.ts`。**不要把这两个常量作为具名导出放进 `docusaurus.config.ts`**——
Docusaurus 会校验配置模块的导出字段，任何非配置项的具名导出都会让构建直接失败，
报 `These field(s) ("SITE_URL",) are not recognized in docusaurus.config.ts`。

```ts
/**
 * 站点级常量的唯一来源。
 *
 * 不放在 docusaurus.config.ts 里导出——Docusaurus 会校验配置模块的导出字段，
 * 任何非配置项的具名导出都会让构建直接失败。放在独立模块里，配置与 plugins/
 * 下的插件都从这里取值，避免同一个地址在多处重复硬编码后失去同步。
 */

export const SITE_URL = 'https://front-end-js.top'

export const SITE_DESCRIPTION =
  'Konva.js 中文文档。Konva 是基于 HTML5 Canvas 的 2D JavaScript 框架，支持图形绘制、事件、拖拽、变换、动画、滤镜与高性能缓存，适用于桌面与移动端的交互式图形应用。'
```

再写 `docusaurus.config.ts`：

`Sandpack` 与结构化数据插件在后续任务接入，此处先留可构建的最小配置。`SITE_URL` 单独导出供检查器与插件复用。

```ts
import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'
import { SITE_URL, SITE_DESCRIPTION } from './siteMeta'

// 这段代码运行在 Node.js 环境，不要在这里使用浏览器 API

const config: Config = {
  title: 'Konva.js 中文文档',
  tagline: 'HTML5 Canvas 2D 框架 · 图形、事件、动画与变换',
  favicon: 'img/favicon.png',

  url: SITE_URL,
  baseUrl: '/',

  // 迁移期间正文里可能残留指向 dumi 旧路径的链接，
  // 设为 throw 可以在构建阶段就暴露出来，而不是等上线后 404。
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // 只声明中文一个 locale。多声明一个 en 会额外产出一份内容相同但
  // lang 标注错误的 /en/ 目录，并带自己的 sitemap 提交给搜索引擎。
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: 'https://github.com/CuiBenyong/konvajs/tree/main/',
          // 从 git 提交记录取最后更新时间，供 sitemap 的 lastmod
          // 与 TechArticle 的 dateModified 使用。lastmod 是少数
          // Google 确实会参考的 sitemap 字段。
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          // changefreq 与 priority 自 2024 年起被 Google 忽略，
          // plugin-sitemap 源码注释亦如此说明，故不输出。
          changefreq: null,
          priority: null,
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    metadata: [
      { name: 'description', content: SITE_DESCRIPTION },
      {
        name: 'keywords',
        content: 'Konva,Konva.js,Konva 中文文档,HTML5 Canvas,Canvas 2D,JavaScript 图形库,Canvas 教程,Transformer',
      },
      { property: 'og:locale', content: 'zh_CN' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    navbar: {
      title: 'Konva.js 中文文档',
      logo: {
        alt: 'Konva.js',
        src: 'img/konva.png',
      },
      // 此处只引用 Task 2 就已存在的 /docs/intro。onBrokenLinks 为 throw，
      // 引用尚未迁入的页面会让构建失败。其余入口由 Task 3 在内容就位后补上。
      items: [
        { to: '/docs/intro', position: 'left', label: '文档' },
        { href: 'https://github.com/CuiBenyong/konvajs', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [{ label: '开始', to: '/docs/intro' }],
        },
        {
          title: 'Konva',
          items: [
            { label: '官方站点', href: 'https://konvajs.org/' },
            { label: '官方仓库', href: 'https://github.com/konvajs/konva' },
            { label: 'API 参考', href: 'https://konvajs.org/api/Konva.html' },
          ],
        },
        {
          title: '本站',
          items: [{ label: '翻译仓库', href: 'https://github.com/CuiBenyong/konvajs' }],
        },
      ],
      copyright: `版权所有 © ${new Date().getFullYear()} Konva.js 中文文档。本站为 Konva 官方文档的中文翻译，内容版权归原作者所有。`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
```

- [ ] **Step 6: 写 sidebars.ts**

分类标题沿用原 dumi frontmatter 的 12 个 `group.title`，顺序沿用原 `group.order`。`autogenerated` 让 Task 3 迁移进来的文件自动挂上，无需逐页登记。

```ts
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

/**
 * 整个侧边栏由 docs/ 目录结构自动生成。
 *
 * 不手工列举页面，是因为 Task 3 会一次性迁入 97 页，逐页登记既冗长又容易
 * 与实际文件脱节。顺序由各页 frontmatter 的 sidebar_position 与每个章节目录下的
 * _category_.json 控制：根级页占 1、2、99，12 个章节占 10–21，互不穿插。
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [{ type: 'autogenerated', dirName: '.' }],
}

export default sidebars
```

- [ ] **Step 7: 写 src/css/custom.css**

`#4078c0` 是原 dumi 配置 `theme['@c-primary']` 的值，保持品牌色不变。深色模式的各档色阶由主色手工调亮，Docusaurus 不会自动生成。

```css
:root {
  --ifm-color-primary: #4078c0;
  --ifm-color-primary-dark: #3a6cad;
  --ifm-color-primary-darker: #3766a3;
  --ifm-color-primary-darkest: #2d5486;
  --ifm-color-primary-light: #5286c7;
  --ifm-color-primary-lighter: #5d8ecb;
  --ifm-color-primary-lightest: #7ba3d6;
  --ifm-code-font-size: 95%;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] {
  --ifm-color-primary: #79a6dc;
  --ifm-color-primary-dark: #5e94d5;
  --ifm-color-primary-darker: #508bd1;
  --ifm-color-primary-darkest: #2f72c0;
  --ifm-color-primary-light: #94b8e3;
  --ifm-color-primary-lighter: #a2c1e7;
  --ifm-color-primary-lightest: #cddcf2;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.3);
}

/* 正文中的演示 iframe。原 dumi 文档里写的是内联 style，
   迁移后统一由这里控制，避免每页重复。 */
.markdown iframe {
  width: 100%;
  max-width: 100%;
  border: 1px solid var(--ifm-toc-border-color);
  border-radius: 4px;
  background: #f0f0f0;
}
```

- [ ] **Step 8: 写 src/pages/index.tsx**

保留原 dumi 首页的三个 feature 文案，一字不改。

```tsx
import type { JSX } from 'react'
import React from 'react'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Heading from '@theme/Heading'
import clsx from 'clsx'
import styles from './index.module.css'

const FEATURES = [
  {
    emoji: '💎',
    title: 'Canvas',
    description:
      'Konva 是一个基于 Canvas 开发的 2d JavaScript 框架库, 它可以轻松的实现桌面应用和移动应用中的图形交互效果.',
  },
  {
    emoji: '🌈',
    title: '动画实现',
    description:
      'Konva 可以实现高性能动画, 过渡, 节点嵌套, 局部操作, 滤镜, 缓存, 事件等功能, 不仅仅适用于桌面与移动开发, 还有更为广泛的应用.',
  },
  {
    emoji: '🚀',
    title: '高性能',
    description:
      'Konva 允许在你舞台上绘图, 添加事件监听, 移动或缩放某个图形, 独立旋转, 以及高效的动画. 即使应用中含有数千个图形也是可以轻松实现的.',
  },
]

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout title="Konva.js 中文文档" description={siteConfig.tagline}>
      <header className={clsx('hero', styles.heroBanner)}>
        <div className="container">
          <Heading as="h1" className="hero__title">
            Konva
          </Heading>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            {/* Task 2 阶段只有 /docs/intro 存在。指南入口由 Task 3 补上。 */}
            <Link className="button button--secondary button--lg" to="/docs/intro">
              开始
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {FEATURES.map((f) => (
                <div key={f.title} className="col col--4">
                  <div className="text--center padding-horiz--md">
                    <div className={styles.featureEmoji}>{f.emoji}</div>
                    <Heading as="h3">{f.title}</Heading>
                    <p>{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
```

创建 `src/pages/index.module.css`：

```css
.heroBanner {
  padding: 4rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;
  background: var(--ifm-color-primary-darkest);
  color: #fff;
}

.buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.features {
  display: flex;
  align-items: center;
  padding: 3rem 0;
  width: 100%;
}

.featureEmoji {
  font-size: 3rem;
  line-height: 1;
  margin-bottom: 1rem;
}

@media screen and (max-width: 996px) {
  .heroBanner {
    padding: 2rem;
  }
}
```

- [ ] **Step 9: 迁移 favicon 与 logo**

`img/favicon.png` 与 `img/konva.png` 被 `docusaurus.config.ts` 引用。原站用的是 jsDelivr 上的远程图片，改为本地托管以避免第三方 CDN 不可用导致图标丢失。

```bash
mkdir -p static/img
curl -fsSL -o static/img/konva.png https://cdn.jsdelivr.net/gh/CuiBenyong/resources@main/images/konva.png
cp static/img/konva.png static/img/favicon.png
```

- [ ] **Step 10: 移开 dumi 内容、放置占位页、安装依赖**

现有 `docs/` 里是 dumi 格式的 97 页，其 frontmatter 含 `nav`、`group`、`hero`、
`features` 等 Docusaurus 不认识的键，直接构建会报错。先整体移到 `docs-dumi/`
作为 Task 3 的输入，`docs/` 下只留一个占位页让构建跑通。

```bash
git mv docs docs-dumi
mkdir -p docs
cat > docs/intro.md <<'EOF'
---
title: 开始
description: 'Konva 是基于 HTML5 Canvas 的 2D JavaScript 框架。本页介绍安装方式与最小可运行示例，是阅读全部文档的起点。'
sidebar_position: 1
---

# 开始

内容由 Task 3 自 `docs-dumi/start/index.md` 迁入。
EOF

rm -rf .dumi .dumirc.ts yarn.lock node_modules
npm install
```

- [ ] **Step 11: 构建并运行检查**

Run: `npm run build && node test/verify.js`
Expected: 构建成功；`依赖与安全` PASS；`构建健全性` 仍 FAIL，报告 `文档页只有 2 个，期望至少 97 个`（首页 + 占位的 intro）

- [ ] **Step 12: 提交**

```bash
git add -A
git commit -m "feat: 以 Docusaurus 3.10.2 替换 dumi 骨架

移除 dumi、@umijs/preset-dumi、gatsby-plugin-netlify、patch-package。
主色沿用原 #4078c0，首页三段 feature 文案原样保留。
favicon 与 logo 改为本地托管，不再依赖 jsDelivr。"
```

---

## Task 3: 内容机械迁移与 description 补写

97 页从 dumi 迁到 Docusaurus。**关键事实：97 页中 96 页的 `description` 与 `keywords` 均为空值**（实测，仅首页有真实值）。仅开启 SSG 而不补写 description，每页仍将没有摘要，SEO 收益大打折扣。因此补写 96 条 description 是本任务的组成部分，不可省略。

**Files:**
- Create: `scripts/migrate-docs.mjs`
- Create: `docs/**`（97 页）
- Delete: 原 `docs/guides/`、`docs/start/`、`docs/help/`、`docs/index.md` 的 dumi 形态
- Move: `public/assets` → `static/assets`，`public/downloads` → `static/downloads`，`public/ads.txt` → `static/ads.txt`
- Create: `test/checks/metadata.js`
- Modify: `test/verify.js`

**Interfaces:**
- Consumes: Task 1 的 `ctx`，Task 2 的构建管线
- Produces: `docs/<章节>/<页面>.md`，路径与规格 §7.2 新 URL 列一一对应（`/docs/` 前缀由 `routeBasePath` 提供）

- [ ] **Step 1: 写元数据检查（先失败）**

创建 `test/checks/metadata.js`：

```js
'use strict';

// 迁移前 96/97 页的 description 为空字符串。这个检查确保补写工作真的做了，
// 而不是让 Docusaurus 用站点级 description 给每页兜底——那样全站 97 页
// 会共用同一条摘要，在搜索结果里等同于没有摘要。
const SITE_DESCRIPTION_FRAGMENT = 'Konva 是基于 HTML5 Canvas 的 2D JavaScript 框架';
const MIN_DESCRIPTION_CHARS = 40;

function extractDescription(html) {
  const m =
    /<meta\s+[^>]*name="description"[^>]*content="([^"]*)"/i.exec(html) ??
    /<meta\s+[^>]*content="([^"]*)"[^>]*name="description"/i.exec(html);
  return m ? m[1].trim() : '';
}

function extractTitle(html) {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return m ? m[1].trim() : '';
}

module.exports = {
  name: '页面元数据',
  run(ctx) {
    const problems = [];
    const seenTitles = new Map();

    for (const file of ctx.docHtml()) {
      const r = ctx.rel(file);
      const html = ctx.read(r);

      const title = extractTitle(html);
      if (!title) {
        problems.push(`${r} 缺 <title>`);
      } else {
        const prev = seenTitles.get(title);
        if (prev) problems.push(`${r} 的 title 与 ${prev} 重复：「${title}」`);
        else seenTitles.set(title, r);
      }

      const desc = extractDescription(html);
      if (!desc) {
        problems.push(`${r} 缺 description`);
      } else if (r !== 'index.html' && desc.includes(SITE_DESCRIPTION_FRAGMENT)) {
        problems.push(`${r} 使用了站点级 description 兜底，未撰写页面级摘要`);
      } else if (desc.length < MIN_DESCRIPTION_CHARS) {
        problems.push(`${r} 的 description 仅 ${desc.length} 字符，短于 ${MIN_DESCRIPTION_CHARS}`);
      }
    }

    return problems;
  },
};
```

在 `test/verify.js` 的 `checks` 数组追加 `require('./checks/metadata')`。

- [ ] **Step 2: 运行，确认失败**

Run: `node test/verify.js`
Expected: FAIL，`页面元数据` 与 `构建健全性` 均报错

- [ ] **Step 3: 写迁移脚本**

创建 `scripts/migrate-docs.mjs`。脚本负责机械可自动化的部分：路径改名、frontmatter 键转换、slug 计算。description 由人工在 Step 5 补写，脚本不臆造。

```js
/**
 * 一次性迁移脚本：dumi docs/ → Docusaurus docs/
 *
 * 只做机械转换，不生成任何内容文字：
 *   - 目录名 snake_case → kebab-case，与规格 §7.2 的新 URL 一致
 *   - 文件名 Snake_Case → kebab-case
 *   - frontmatter：order → sidebar_position，group.title → 由 _category_.json 承载
 *   - 丢弃 dumi 专有键：group、nav、hero、features
 *   - description 为空时写入 DESCRIPTION_PLACEHOLDER，由人工逐页补写；
 *     留占位而非留空，是为了让 grep 能一眼列出待办页面。
 *
 * 保留此脚本是为了迁移结果可复核、可重跑。
 */
import fs from 'node:fs/promises'
import path from 'node:path'

// Task 2 已把 dumi 内容整体移到 docs-dumi/，docs/ 下现在只有一个占位页。
const SRC = 'docs-dumi'
const OUT = 'docs-migrated'

export const DESCRIPTION_PLACEHOLDER = 'TODO_DESCRIPTION'

/** dumi 目录名 → Docusaurus 目录名，与规格 §7.2 逐条对应。 */
const SECTION_DIRS = {
  shapes: 'shapes',
  styling: 'styling',
  events: 'events',
  drag_and_drop: 'drag-and-drop',
  clipping: 'clipping',
  groups_and_layers: 'groups-and-layers',
  filters: 'filters',
  tweens: 'tweens',
  animations: 'animations',
  selectors: 'selectors',
  data_and_serialization: 'data-and-serialization',
  performance: 'performance',
}

/**
 * 章节标题沿用原 dumi frontmatter 的 group.title，相对顺序沿用 group.order。
 *
 * position 从 10 起算而非 1：侧边栏由 autogenerated 生成，根级页
 * （intro=1、overview=2、support=99）与章节共用同一个排序序列。
 * 若章节仍用 1–12，会和 intro/overview 相互穿插。
 */
const CATEGORY_LABELS = {
  shapes: { label: '图形', position: 10 },
  styling: { label: '样式', position: 11 },
  events: { label: '事件', position: 12 },
  'drag-and-drop': { label: '拖拽/释放', position: 13 },
  clipping: { label: '剪辑', position: 14 },
  'groups-and-layers': { label: '分组、图层', position: 15 },
  filters: { label: '滤镜', position: 16 },
  tweens: { label: '补间动画', position: 17 },
  animations: { label: '动画', position: 18 },
  selectors: { label: '选择器', position: 19 },
  'data-and-serialization': { label: '数据序列化', position: 20 },
  performance: { label: '性能优化', position: 21 },
}

/** Snake_Case / CamelCase 文件名 → kebab-case，与规格 §7.2 的 clean_slug 规则一致。 */
export function kebab(name) {
  let s = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  s = s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
  return s.replace(/_/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  if (!m) return { fm: {}, body: text }
  const fm = {}
  for (const line of m[1].split('\n')) {
    const kv = /^([a-zA-Z_]+):\s*(.*)$/.exec(line)
    if (kv) fm[kv[1]] = kv[2].trim()
  }
  return { fm, body: text.slice(m[0].length) }
}

function yamlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

async function emit(outPath, fm, body) {
  const lines = ['---']
  for (const [k, v] of Object.entries(fm)) {
    if (v === undefined || v === null || v === '') continue
    lines.push(`${k}: ${typeof v === 'number' ? v : yamlString(v)}`)
  }
  lines.push('---', '')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, lines.join('\n') + body.replace(/^\n+/, '\n'))
}

async function main() {
  await fs.rm(OUT, { recursive: true, force: true })

  // 三个根级页面单独处理，它们的目标路径由规格 §7.2 指定。
  const roots = [
    { src: 'start/index.md', out: 'intro.md', position: 1 },
    { src: 'guides/index.md', out: 'overview.md', position: 2 },
    { src: 'help/index.md', out: 'support.md', position: 99 },
  ]
  for (const r of roots) {
    const text = await fs.readFile(path.join(SRC, r.src), 'utf8')
    const { fm, body } = parseFrontmatter(text)
    await emit(path.join(OUT, r.out), {
      title: fm.title,
      description: fm.description && fm.description !== "''" ? fm.description : DESCRIPTION_PLACEHOLDER,
      sidebar_position: r.position,
    }, body)
  }

  // 12 个章节
  for (const [srcDir, outDir] of Object.entries(SECTION_DIRS)) {
    const dir = path.join(SRC, 'guides', srcDir)
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.md'))
    for (const f of files) {
      const text = await fs.readFile(path.join(dir, f), 'utf8')
      const { fm, body } = parseFrontmatter(text)
      await emit(path.join(OUT, outDir, `${kebab(f.replace(/\.md$/, ''))}.md`), {
        title: fm.title,
        description: fm.description && fm.description !== "''" ? fm.description : DESCRIPTION_PLACEHOLDER,
        sidebar_position: Number(fm.order) || 1,
      }, body)
    }
    const cat = CATEGORY_LABELS[outDir]
    await fs.writeFile(
      path.join(OUT, outDir, '_category_.json'),
      JSON.stringify({ label: cat.label, position: cat.position }, null, 2) + '\n'
    )
  }

  const count = (await fs.readdir(OUT, { recursive: true })).filter((f) => f.endsWith('.md')).length
  console.log(`迁移完成：${count} 页 → ${OUT}/`)
}

main()
```

- [ ] **Step 4: 运行迁移并替换 docs 目录**

```bash
node scripts/migrate-docs.mjs
# 期望输出：迁移完成：96 页 → docs-migrated/
# 96 = 97 减去首页 docs-dumi/index.md，首页已由 src/pages/index.tsx 承接

# 用迁移结果替换 Task 2 留下的占位 docs/，并删除 dumi 输入目录
rm -rf docs && mv docs-migrated docs
git rm -r --cached docs-dumi -q && rm -rf docs-dumi

mkdir -p static
git mv public/assets static/assets
git mv public/downloads static/downloads
git mv public/ads.txt static/ads.txt
git mv public/robots.txt static/robots.txt
rmdir public
```

- [ ] **Step 5: 逐页补写 description**

列出待办：

```bash
grep -rl 'TODO_DESCRIPTION' docs/ | sort
```

为每一页撰写 40–120 字的中文摘要，包含该页的 Konva 类名或方法名（搜索意图词）。示例——`docs/shapes/rect.md`：

```yaml
description: '使用 Konva.Rect 在 HTML5 Canvas 上绘制矩形：设置位置、宽高、填充与描边，以及通过 cornerRadius 实现统一或四角独立的圆角。'
```

`docs/performance/shape-caching.md`：

```yaml
description: '用 Konva 的 cache() 把复杂图形预渲染为位图，减少每帧重绘开销。介绍缓存的适用场景、失效时机与 drawBorder 调试参数。'
```

**完成判据**：`grep -r 'TODO_DESCRIPTION' docs/` 无输出。

- [ ] **Step 6: 修正正文中的失效链接**

原文中的 `<a href="https://konvajs.github.io/api/...">` 域名已废弃，统一替换为 `https://konvajs.org/api/`：

```bash
grep -rl 'konvajs.github.io' docs/ | xargs sed -i '' 's|https://konvajs\.github\.io/api/|https://konvajs.org/api/|g'
grep -rn 'konvajs.github.io' docs/ || echo "无残留"
```

`target="__blank"` 是原文的笔误（双下划线不是合法的 target 值，等同于开新窗但不复用），统一修正为 `_blank`：

```bash
grep -rl 'target="__blank"' docs/ | xargs sed -i '' 's|target="__blank"|target="_blank"|g'
```

- [ ] **Step 6b: 扩充 navbar、footer 与首页入口**

内容已就位，Task 2 中为了让构建跑通而精简掉的入口现在补回。

`docusaurus.config.ts` 的 `navbar.items` 改为：

```ts
      items: [
        { to: '/docs/intro', position: 'left', label: '开始' },
        { to: '/docs/overview', position: 'left', label: '指南' },
        { to: '/docs/shapes/rect', position: 'left', label: '图形' },
        { to: '/docs/support', position: 'right', label: '帮助' },
        { href: 'https://github.com/CuiBenyong/konvajs', label: 'GitHub', position: 'right' },
      ],
```

`footer` 的「文档」栏改为：

```ts
        {
          title: '文档',
          items: [
            { label: '开始', to: '/docs/intro' },
            { label: '指南', to: '/docs/overview' },
            { label: '帮助', to: '/docs/support' },
          ],
        },
```

`src/pages/index.tsx` 的按钮区恢复两个入口：

```tsx
            <Link className="button button--secondary button--lg" to="/docs/intro">
              开始
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/overview">
              指南
            </Link>
```

- [ ] **Step 7: 构建并检查**

Run: `npm run build && node test/verify.js`
Expected: `构建健全性` PASS（97 个文档页，均 > 5000 字节且含中文）；`页面元数据` PASS

若 `onBrokenLinks: 'throw'` 报错，逐条修正正文中指向 dumi 旧路径的相对链接。

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "feat: 97 页内容迁移至 Docusaurus 并补写 description

迁移前 96/97 页 description 为空，本次逐页补写 40-120 字摘要。
konvajs.github.io/api 域名已废弃，统一改为 konvajs.org/api。
修正原文 target=\"__blank\" 笔误为 _blank。"
```

---

## Task 4: 301 重定向

**Files:**
- Create: `static/_redirects`
- Delete: `static/_redirects` 的 dumi 旧版（原在仓库根 `static/_redirects`，含域名拼写错误）
- Create: `test/checks/redirects.js`
- Modify: `test/verify.js`

**Interfaces:**
- Consumes: 规格 §7.2 的 97 条映射表；Task 3 产出的 `build/` 目录结构
- Produces: `build/_redirects`（Netlify 从构建产物根目录读取此文件）

- [ ] **Step 1: 写重定向检查（先失败）**

创建 `test/checks/redirects.js`：

```js
'use strict';
const fs = require('fs');
const path = require('path');

// 规格 §7.2 的映射表共 97 行，其中 `/` → `/` 是恒等映射，写进 _redirects
// 会造成重定向循环，因此不写入。页面级规则实际为 96 条。
const EXPECTED_RULES = 96;

module.exports = {
  name: '301 重定向',
  run(ctx) {
    const problems = [];

    if (!ctx.exists('_redirects')) {
      problems.push('build/_redirects 不存在，Netlify 不会应用任何重定向');
      return problems;
    }

    const lines = ctx
      .read('_redirects')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));

    const rules = [];
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 3) {
        problems.push(`规则格式不合法：${line}`);
        continue;
      }
      rules.push({ from: parts[0], to: parts[1], code: parts[2] });
    }

    // 旧域名拼写错误：原 static/_redirects 写的是 front-end-js.tops（多一个 s）。
    for (const rule of rules) {
      if (/front-end-js\.tops/.test(rule.to)) {
        problems.push(`目标域名拼写错误（多一个 s）：${rule.to}`);
      }
    }

    const pageRules = rules.filter((r) => r.from.startsWith('/') && !r.from.includes('*'));
    if (pageRules.length < EXPECTED_RULES) {
      problems.push(`页面级 301 只有 ${pageRules.length} 条，期望 ${EXPECTED_RULES} 条`);
    }

    for (const rule of pageRules) {
      if (!rule.code.startsWith('301')) {
        problems.push(`${rule.from} 使用了 ${rule.code}，应为 301`);
      }
      // 目标必须真实存在于构建产物中，否则 301 会把流量送进 404，
      // 这比不做重定向更糟——搜索引擎会直接丢弃该 URL 的权重。
      const target = rule.to.replace(/^\//, '').replace(/\/$/, '');
      const candidate = target === '' ? 'index.html' : `${target}/index.html`;
      if (!ctx.exists(candidate)) {
        problems.push(`${rule.from} 指向 ${rule.to}，但构建产物中不存在 ${candidate}`);
      }
    }

    return problems;
  },
};
```

在 `test/verify.js` 追加 `require('./checks/redirects')`。

- [ ] **Step 2: 运行，确认失败**

Run: `node test/verify.js`
Expected: FAIL，`build/_redirects 不存在`

- [ ] **Step 3: 写 static/_redirects**

自规格 §7.2 的 97 行映射表逐条誊写，格式 `<旧> <新> 301!`。首行保留原有的旧域名规则并**修正拼写错误**（`front-end-js.tops` → `front-end-js.top`）。

文件开头：

```
# Netlify 重定向规则
# 页面级 301 见规格 specs/2026-09-18-konvajs-site-overhaul-design.md §7.2
# 映射表已与迁移前线上 sitemap.xml 逐条比对：97/97 命中，新 URL 无重复。

# 旧 Netlify 子域跳主域。原规则目标域名误写为 front-end-js.tops，此处修正。
https://konvajs.netlify.app/*  https://front-end-js.top/:splat  301!

# --- 97 条页面级 301 ---
/guides                                          /docs/overview                        301!
/guides/animations/create_an_-animation          /docs/animations/create-an-animation  301!
/guides/animations/moving                        /docs/animations/moving               301!
```

（其余 93 条照规格 §7.2 表格续写，页面级规则合计 **96** 条。`/` → `/` 一条为恒等映射，
**不写入**——写入会造成重定向循环。检查器的 `EXPECTED_RULES` 即为 96。）

- [ ] **Step 4: 构建并检查**

Run: `npm run build && node test/verify.js`
Expected: `301 重定向` PASS

- [ ] **Step 5: 提交**

```bash
git add static/_redirects test/checks/redirects.js test/verify.js
git commit -m "feat: 97 条旧 URL 全量 301 并修正旧域名拼写错误"
```

---

## Task 5: robots.txt 与 AI 爬虫放行

**Files:**
- Modify: `static/robots.txt`（全量重写）
- Create: `test/checks/robots.js`
- Modify: `test/verify.js`

**Interfaces:**
- Consumes: Task 1 的 `ctx`
- Produces: `build/robots.txt`

- [ ] **Step 1: 写检查（先失败）**

创建 `test/checks/robots.js`：

```js
'use strict';

// 规格 §6.2 要求显式放行的 UA。通用 User-agent: * 已经允许了所有爬虫，
// 这里显式列出是把立场固定下来：本站希望被 AI 检索系统抓取并引用。
// Google-Extended 是例外——它不是冗余声明，未放行则本站不进入
// Gemini 与 AI Overviews 的引用池。
const REQUIRED_AGENTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-Web', 'Claude-SearchBot', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'Amazonbot', 'Meta-ExternalAgent', 'cohere-ai', 'YouBot', 'Diffbot',
  'Baiduspider',
];

module.exports = {
  name: 'robots 与 AI 爬虫',
  run(ctx) {
    const problems = [];
    if (!ctx.exists('robots.txt')) {
      problems.push('build/robots.txt 不存在');
      return problems;
    }

    const txt = ctx.read('robots.txt');
    const lower = txt.toLowerCase();

    for (const agent of REQUIRED_AGENTS) {
      const idx = lower.indexOf(`user-agent: ${agent.toLowerCase()}`);
      if (idx === -1) {
        problems.push(`未声明 User-agent: ${agent}`);
        continue;
      }
      // 该 UA 段落内必须是 Allow，不能是 Disallow。
      const block = txt.slice(idx, idx + 200);
      const firstRule = /^\s*(Allow|Disallow):\s*(\S*)/m.exec(block.split(/\n\s*\n/)[0].split('\n').slice(1).join('\n'));
      if (!firstRule || firstRule[1] !== 'Allow') {
        problems.push(`${agent} 未显式 Allow`);
      }
    }

    if (!/Sitemap:\s*https:\/\/front-end-js\.top\/sitemap\.xml/.test(txt)) {
      problems.push('缺少 Sitemap 声明或地址不正确');
    }
    if (!/llms\.txt/.test(txt)) {
      problems.push('未在 robots.txt 中声明 llms.txt 位置');
    }

    return problems;
  },
};
```

在 `test/verify.js` 追加 `require('./checks/robots')`。

- [ ] **Step 2: 运行，确认失败**

Run: `node test/verify.js`
Expected: FAIL，报告各 UA 未声明

- [ ] **Step 3: 写 static/robots.txt**

```
# Konva.js 中文文档
# https://front-end-js.top

User-agent: *
Allow: /

# ---------------------------------------------------------------------------
# AI 检索与问答类爬虫
#
# 上面的通用规则已经允许了所有爬虫，下面是显式表态：本站希望被 AI 搜索与
# 问答系统抓取并引用。取舍是明确的——放行意味着内容可能被用于模型训练，
# 同时也意味着内容有机会出现在 AI 生成的回答里并被标注来源。对一个希望被
# 更多中文开发者找到的翻译文档站，后者价值更大。
#
# Google-Extended 是唯一不冗余的一条：它控制 Gemini 与 AI Overviews 的
# 内容使用，与 Googlebot 的网页索引是两套独立开关，不放行就不进引用池。
# ---------------------------------------------------------------------------

# OpenAI
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

# Anthropic
User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: anthropic-ai
Allow: /

# Perplexity
User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# Google：Gemini 与 AI Overviews 的引用池开关
User-agent: Google-Extended
Allow: /

# Apple Intelligence
User-agent: Applebot-Extended
Allow: /

# 字节：豆包与头条搜索
User-agent: Bytespider
Allow: /

# 其他
User-agent: Amazonbot
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: YouBot
Allow: /

User-agent: Diffbot
Allow: /

# 国内搜索引擎
User-agent: Baiduspider
Allow: /

User-agent: Sogou web spider
Allow: /

User-agent: 360Spider
Allow: /

Sitemap: https://front-end-js.top/sitemap.xml

# 面向大模型的站点导航（llmstxt.org 约定）
# https://front-end-js.top/llms.txt
# https://front-end-js.top/llms-full.txt
```

- [ ] **Step 4: 构建并检查**

Run: `npm run build && node test/verify.js`
Expected: `robots 与 AI 爬虫` PASS

- [ ] **Step 5: 提交**

```bash
git add static/robots.txt test/checks/robots.js test/verify.js
git commit -m "feat: robots.txt 显式放行 AI 检索爬虫并声明 llms.txt"
```

---

## Task 6: 广告配置与组件

自 `cornerstone3d-zh` 移植，仅改 slot。逻辑不作改动——该实现已在生产环境验证。

**Files:**
- Create: `src/config/ads.ts`
- Create: `src/components/Ad/AdUnit.tsx`
- Create: `src/components/Ad/InArticleAd.tsx`
- Create: `src/components/Ad/styles.module.css`
- Create: `test/checks/ads.js`
- Modify: `test/verify.js`
- Modify: `docusaurus.config.ts`（加 AdSense 脚本与 preconnect）

**Interfaces:**
- Consumes: Task 2 的 `docusaurus.config.ts`
- Produces：
  - `src/config/ads.ts` 导出 `AD_CLIENT: string`、`AD_PLACEMENTS: Record<AdPlacementName, AdPlacementConfig>`、`IN_ARTICLE_RULES`、`AD_EXCLUDED_PATH_PREFIXES: string[]`、`isAdAllowedOnPath(pathname: string): boolean`
  - `AdPlacementName = 'inArticle' | 'articleBottom' | 'tocSidebar'`
  - `AdUnit` 默认导出，props `{ placement: AdPlacementName; className?: string }`
  - `InArticleAd` 默认导出，props `{ containerRef: RefObject<HTMLElement> }`
  - `styles.module.css` 导出 class：`adSlot`、`adPlaceholder`、`adContainer`、`adTocContainer`

- [ ] **Step 1: 写广告检查（先失败）**

创建 `test/checks/ads.js`：

```js
'use strict';

const AD_CLIENT = 'ca-pub-9580076271637088';
const REQUIRED_SLOTS = ['5362046383', '5334514048'];

module.exports = {
  name: '广告配置与合规',
  run(ctx) {
    const problems = [];

    if (!ctx.existsRoot('src/config/ads.ts')) {
      problems.push('src/config/ads.ts 不存在');
      return problems;
    }
    const cfg = ctx.readRoot('src/config/ads.ts');

    // 改动 client 会断掉 static/ads.txt 的账号关联，广告将无法投放。
    if (!cfg.includes(AD_CLIENT)) {
      problems.push(`AD_CLIENT 被改动，应为 ${AD_CLIENT}（改动会断掉 ads.txt 关联）`);
    }
    for (const slot of REQUIRED_SLOTS) {
      if (!cfg.includes(slot)) problems.push(`广告位 slot ${slot} 丢失`);
    }
    // 每个版位都必须预留高度，否则广告异步填充时会把下方内容顶开，
    // 产生 CLS。CLS 是 Core Web Vitals 三项指标之一。
    const placements = ['inArticle', 'articleBottom', 'tocSidebar'];
    for (const p of placements) {
      if (!cfg.includes(p)) problems.push(`缺少版位 ${p}`);
    }
    const minHeightCount = (cfg.match(/minHeight:/g) || []).length;
    if (minHeightCount < placements.length) {
      problems.push(`minHeight 只出现 ${minHeightCount} 次，每个版位都必须预留高度`);
    }

    // AdSense 版位政策禁止在用户未主动请求的情况下刷新广告。
    // 换页重建由用户点击导航触发，是允许的；定时器刷新则会违反政策，
    // 可能导致账号被限制投放。这里机械禁止定时器出现在广告目录下。
    for (const file of ['AdUnit.tsx', 'InArticleAd.tsx']) {
      const rel = `src/components/Ad/${file}`;
      if (!ctx.existsRoot(rel)) {
        problems.push(`${rel} 不存在`);
        continue;
      }
      const src = ctx.readRoot(rel);
      if (/setInterval|setTimeout/.test(src)) {
        problems.push(`${rel} 含定时器，违反 AdSense 版位政策`);
      }
    }

    // 换页重建依赖 key 中携带 pathname。缺了它，SPA 换页后旧广告会留在原地。
    const adUnit = ctx.existsRoot('src/components/Ad/AdUnit.tsx')
      ? ctx.readRoot('src/components/Ad/AdUnit.tsx')
      : '';
    if (!/key=\{`\$\{placement\}:\$\{pathname\}`\}/.test(adUnit)) {
      problems.push('AdUnit 未在 key 中携带 pathname，SPA 换页不会重建广告节点');
    }

    // ads.txt 必须原样保留
    if (!ctx.exists('ads.txt')) problems.push('构建产物缺少 ads.txt');
    else if (!ctx.read('ads.txt').includes('pub-9580076271637088')) {
      problems.push('ads.txt 的 publisher id 不正确');
    }

    // 广告脚本必须带 async。Docusaurus 会把 scripts 的属性原样透传，
    // 不会自动补 async，漏掉会让它成为 head 里的阻塞脚本，拖慢 LCP。
    if (ctx.exists('index.html')) {
      const home = ctx.read('index.html');
      const tag = /<script[^>]*adsbygoogle\.js[^>]*>/i.exec(home);
      if (!tag) problems.push('首页未加载 adsbygoogle.js');
      else if (!/\basync\b/.test(tag[0])) problems.push('adsbygoogle.js 缺 async，会阻塞首屏渲染');
    }

    return problems;
  },
};
```

在 `test/verify.js` 追加 `require('./checks/ads')`。

- [ ] **Step 2: 运行，确认失败**

Run: `node test/verify.js`
Expected: FAIL，`src/config/ads.ts 不存在`

- [ ] **Step 3: 写 src/config/ads.ts**

```ts
/**
 * AdSense 配置的唯一来源。
 *
 * 想调整广告行为时只改这个文件，不要去改组件。
 */

/** AdSense 发布商 ID，与 docusaurus.config.ts 里 loader 脚本的 client 参数一致。
 *  不要改动——改了会断掉 static/ads.txt 的账号关联。 */
export const AD_CLIENT = 'ca-pub-9580076271637088'

/** 正文广告单元。 */
const SLOT_ARTICLE = '5362046383'
/** 侧栏广告单元，本站自 dumi 时代沿用。 */
const SLOT_SIDEBAR = '5334514048'

export type AdPlacementName = 'inArticle' | 'articleBottom' | 'tocSidebar'

export type AdPlacementConfig = {
  /** 关掉某个版位时设为 false，组件会整个不渲染。 */
  enabled: boolean
  slot: string
  /** AdSense 的 data-ad-format。'fluid' 配合 in-article 布局，'auto' 用于自适应展示广告。 */
  format: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  /** 仅 format 为 'fluid' 时有意义。 */
  layout?: 'in-article'
  fullWidthResponsive?: boolean
  /**
   * 预留高度（px）。广告是异步填充的，不预留高度会在插入时把下方内容顶开，
   * 产生 CLS。CLS 是 Core Web Vitals 三项指标之一，既影响搜索排名，
   * 也影响广告可见性评分。
   */
  minHeight: number
}

export const AD_PLACEMENTS: Record<AdPlacementName, AdPlacementConfig> = {
  /** 正文中部。处在阅读动线上，单次点击价格通常高于其他位置。 */
  inArticle: {
    enabled: true,
    slot: SLOT_ARTICLE,
    format: 'fluid',
    layout: 'in-article',
    minHeight: 280,
  },
  /** 正文末尾、翻页器之前。读者读完一页时的自然停顿点。 */
  articleBottom: {
    enabled: true,
    slot: SLOT_ARTICLE,
    format: 'auto',
    fullWidthResponsive: true,
    minHeight: 280,
  },
  /** 右侧目录下方。只在桌面端出现——它挂在 DocItem/TOC/Desktop 上，
   *  而该组件本身只在 windowSize 为 desktop 时才渲染。 */
  tocSidebar: {
    enabled: true,
    slot: SLOT_SIDEBAR,
    format: 'auto',
    minHeight: 600,
  },
}

/**
 * 正文内广告的准入门槛。
 *
 * 短页面不投正文内广告，有两个原因：
 * 1. 合规。AdSense 不希望在内容过少的页面上投放广告，广告占比过高的页面
 *    可能被判定为低价值内容。
 * 2. 体验。三行正文夹一块广告，读者会直接关掉页面。
 */
export const IN_ARTICLE_RULES = {
  /** 页面至少要有这么多个 h2。要求 3 个是因为广告插在第 2 节之后，
   *  后面还得至少剩 1 节，否则它实质等于底部广告，和 articleBottom 重复。 */
  minHeadings: 3,
  /** 读完这么多个完整 h2 小节后才插入广告。 */
  afterHeadingCount: 2,
  /** 正文纯文本长度下限（字符数）。 */
  minChars: 800,
}

/** 这些路径前缀下完全不投广告。本站暂无此类页面，保留机制备用。 */
export const AD_EXCLUDED_PATH_PREFIXES: string[] = []

export function isAdAllowedOnPath(pathname: string): boolean {
  return !AD_EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
```

- [ ] **Step 4: 移植三个组件文件**

自 `cornerstone3d-zh` 原样复制，仅把 `@site/src/config/ads` 的 import 路径保持不变（两站路径相同），注释一并保留：

```bash
CS=/Volumes/External/works/self/cornerstone3d-zh
mkdir -p src/components/Ad
cp $CS/src/components/Ad/AdUnit.tsx        src/components/Ad/AdUnit.tsx
cp $CS/src/components/Ad/InArticleAd.tsx   src/components/Ad/InArticleAd.tsx
cp $CS/src/components/Ad/styles.module.css src/components/Ad/styles.module.css
```

复制后逐行核对：三个文件均不得含 `setInterval` / `setTimeout`；`AdUnit.tsx` 中必须保留 `key={\`${placement}:${pathname}\`}`。

- [ ] **Step 5: 在 docusaurus.config.ts 加广告脚本**

在 `config` 对象内追加 `headTags` 与 `scripts` 两段：

```ts
  headTags: [
    /**
     * 提前建立到广告服务器的连接。广告脚本异步加载，先把 DNS 解析与 TLS 握手
     * 做掉可以让广告更早出现，而出现得越早，进入可见区域的概率越高。
     */
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://pagead2.googlesyndication.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: { rel: 'dns-prefetch', href: 'https://googleads.g.doubleclick.net' },
    },
  ],

  scripts: [
    {
      src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9580076271637088',
      /**
       * async 必须显式声明。Docusaurus 把这里的属性原样透传到 script 标签，
       * 不会自动补 async（见 @docusaurus/core 的 createBootstrapPlugin）。
       * 漏掉它这就是 head 里的同步阻塞脚本，既拖慢 LCP，
       * 也因为内容出现得晚而降低广告可见性评分。
       */
      async: true,
      crossorigin: 'anonymous',
    },
  ],
```

- [ ] **Step 6: 构建并检查**

Run: `npm run build && node test/verify.js`
Expected: `广告配置与合规` PASS

- [ ] **Step 7: 提交**

```bash
git add src/config/ads.ts src/components/Ad/ docusaurus.config.ts test/checks/ads.js test/verify.js
git commit -m "feat: 移植广告组件并配置 slot

正文位 5362046383，侧栏位沿用本站原有 5334514048。
组件自 cornerstone3d-zh 移植，逻辑未改动。"
```

---

## Task 7: 广告挂载与换页重建验证

组件已就位但尚未挂到页面上。本任务用 Docusaurus 的 wrap 模式接入，并验证 SPA 换页确实重建了广告节点（需求 2 的验收）。

**Files:**
- Create: `src/theme/DocItem/Content/index.tsx`
- Create: `src/theme/DocItem/TOC/Desktop/index.tsx`
- Modify: `src/pages/index.tsx`（首页底部加 `articleBottom`）
- Create: `test/checks/ad-placement.js`
- Modify: `test/verify.js`

**Interfaces:**
- Consumes: Task 6 的 `AdUnit`、`InArticleAd`、`styles.module.css`
- Produces: 构建产物中每个文档页含带 `data-ad-placement` 属性的占位节点

- [ ] **Step 1: 写挂载检查（先失败）**

创建 `test/checks/ad-placement.js`：

```js
'use strict';

module.exports = {
  name: '广告挂载',
  run(ctx) {
    const problems = [];
    const docs = ctx.docHtml().filter((f) => ctx.rel(f).startsWith('docs/'));

    if (docs.length === 0) {
      problems.push('未找到任何文档页');
      return problems;
    }

    for (const file of docs) {
      const r = ctx.rel(file);
      const html = ctx.read(r);
      // SSR 阶段 AdUnit 渲染的是等高占位符（useIsBrowser 在服务端为 false），
      // 因此静态 HTML 里看到的应该是占位 div 而非 ins。
      // 占位 div 带有 minHeight 内联样式，这是它在 HTML 里的可识别特征。
      if (!/min-height:\s*280px/i.test(html)) {
        problems.push(`${r} 未渲染正文广告占位符（缺 min-height: 280px）`);
      }
    }

    return problems;
  },
};
```

在 `test/verify.js` 追加 `require('./checks/ad-placement')`。

- [ ] **Step 2: 运行，确认失败**

Run: `npm run build && node test/verify.js`
Expected: FAIL，每个文档页报 `未渲染正文广告占位符`

- [ ] **Step 3: 写 src/theme/DocItem/Content/index.tsx**

```tsx
import type { JSX } from 'react'
import React, { useRef } from 'react'
import Content from '@theme-original/DocItem/Content'
import type ContentType from '@theme/DocItem/Content'
import type { WrapperProps } from '@docusaurus/types'
import AdUnit from '@site/src/components/Ad/AdUnit'
import InArticleAd from '@site/src/components/Ad/InArticleAd'
import adStyles from '@site/src/components/Ad/styles.module.css'

type Props = WrapperProps<typeof ContentType>

/**
 * 包装文档正文，在其中和其后插入广告。
 *
 * 这里用的是 Docusaurus 的 wrap 模式：通过 @theme-original 引入原组件再包一层，
 * 而不是用 swizzle CLI 把官方组件代码复制出来（eject）。区别在于升级 Docusaurus 时，
 * wrap 会自动跟随官方组件的改动，eject 出来的副本则会逐渐腐烂。
 */
export default function ContentWrapper(props: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef}>
      <Content {...props} />

      {/* 正文中部广告。它通过 portal 插入到上方正文内部，不在这里的 DOM 位置渲染。 */}
      <InArticleAd containerRef={containerRef} />

      <div className={adStyles.adContainer}>
        <AdUnit placement="articleBottom" />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 写 src/theme/DocItem/TOC/Desktop/index.tsx**

```tsx
import type { JSX } from 'react'
import React from 'react'
import Desktop from '@theme-original/DocItem/TOC/Desktop'
import type DesktopType from '@theme/DocItem/TOC/Desktop'
import type { WrapperProps } from '@docusaurus/types'
import AdUnit from '@site/src/components/Ad/AdUnit'
import adStyles from '@site/src/components/Ad/styles.module.css'

type Props = WrapperProps<typeof DesktopType>

/**
 * 在右侧目录下方追加一个广告位。
 *
 * 选这个组件作为挂载点，是因为它本身只在桌面端渲染——DocItem/Layout 里判断了
 * windowSize 为 desktop 才渲染它。所以不需要在广告侧另写屏幕宽度判断。
 *
 * 目录区域在没有标题时不渲染（hide_table_of_contents 或 toc 为空），
 * 这种页面上侧栏广告也就不存在，属于预期行为。
 */
export default function DesktopWrapper(props: Props): JSX.Element {
  return (
    <>
      <Desktop {...props} />
      <div className={adStyles.adTocContainer}>
        <AdUnit placement="tocSidebar" />
      </div>
    </>
  )
}
```

- [ ] **Step 5: 首页加底部广告**

在 `src/pages/index.tsx` 的 `</main>` 之前插入：

```tsx
        <div className="container">
          <AdUnit placement="articleBottom" />
        </div>
```

并在文件顶部加 import：

```tsx
import AdUnit from '@site/src/components/Ad/AdUnit'
```

- [ ] **Step 6: 构建并检查**

Run: `npm run build && node test/verify.js`
Expected: `广告挂载` PASS

- [ ] **Step 7: 人工验证 SPA 换页重建（需求 2 的验收）**

```bash
npm run serve
```

浏览器打开 `http://localhost:3000/docs/shapes/rect`，开发者工具 Console 执行：

```js
document.querySelectorAll('ins[data-ad-placement]').forEach(e =>
  console.log(e.dataset.adPlacement, e.dataset.adsbygoogleStatus))
```

记录节点数量。随后**点击站内链接**跳到 `/docs/shapes/circle`（不要刷新页面，刷新等于整页重载，验证不到 SPA 行为），再次执行上述语句。

**通过判据**：新页面的 `ins` 节点是全新节点（可在跳转前给旧节点打标记 `document.querySelector('ins[data-ad-placement]').__old = true`，跳转后检查新节点上没有 `__old`），且 Console 中**没有** `All ins elements in the DOM with class=adsbygoogle already have ads in them` 报错。

- [ ] **Step 8: 提交**

```bash
git add src/theme/ src/pages/index.tsx test/checks/ad-placement.js test/verify.js
git commit -m "feat: 挂载三个广告位并验证 SPA 换页重建

以 wrap 模式接入 DocItem/Content 与 DocItem/TOC/Desktop，
升级 Docusaurus 时可自动跟随上游改动。"
```

---

## Task 8: canonical、sitemap 与安全响应头

**Files:**
- Create: `test/checks/seo.js`
- Modify: `test/verify.js`
- Modify: `netlify.toml`

**Interfaces:**
- Consumes: Task 2 的 sitemap 配置
- Produces: `build/sitemap.xml` 含 `lastmod`；每页唯一且格式正确的 canonical

- [ ] **Step 1: 写 SEO 检查（先失败或先通过均可，取决于 Docusaurus 默认行为）**

创建 `test/checks/seo.js`：

```js
'use strict';

const SITE_URL = 'https://front-end-js.top';

module.exports = {
  name: 'canonical 与 sitemap',
  run(ctx) {
    const problems = [];
    const seen = new Map();

    for (const file of ctx.docHtml()) {
      const r = ctx.rel(file);
      const html = ctx.read(r);

      const matches = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*>/gi)];
      if (matches.length === 0) {
        problems.push(`${r} 缺 canonical`);
        continue;
      }
      if (matches.length > 1) {
        problems.push(`${r} 有 ${matches.length} 个 canonical，应当唯一`);
      }

      const href = /href="([^"]*)"/.exec(matches[0][0]);
      if (!href) {
        problems.push(`${r} 的 canonical 没有 href`);
        continue;
      }
      const url = href[1];

      if (!url.startsWith(SITE_URL)) {
        problems.push(`${r} 的 canonical 不是本站绝对地址：${url}`);
      }
      // 迁移前的 dumi 实现拼接出的是 https://front-end-js.top//guides/...
      // 双斜杠会让搜索引擎把它视作与正常地址不同的另一个 URL。
      if (/([^:])\/\//.test(url)) {
        problems.push(`${r} 的 canonical 含双斜杠：${url}`);
      }

      const prev = seen.get(url);
      if (prev) problems.push(`${r} 与 ${prev} 的 canonical 相同：${url}`);
      else seen.set(url, r);
    }

    if (!ctx.exists('sitemap.xml')) {
      problems.push('sitemap.xml 不存在');
    } else {
      const xml = ctx.read('sitemap.xml');
      const locs = (xml.match(/<loc>/g) || []).length;
      const mods = (xml.match(/<lastmod>/g) || []).length;
      if (locs === 0) problems.push('sitemap.xml 没有任何条目');
      // lastmod 是少数几个 Google 确实会参考的 sitemap 字段。
      if (mods < locs) problems.push(`sitemap 有 ${locs} 条 loc 但只有 ${mods} 条 lastmod`);
      if (/front-end-js\.tops/.test(xml)) problems.push('sitemap 中出现拼写错误的域名');
    }

    return problems;
  },
};
```

在 `test/verify.js` 追加 `require('./checks/seo')`。

- [ ] **Step 2: 运行**

Run: `npm run build && node test/verify.js`
Expected: `canonical 与 sitemap` 应当 PASS（Docusaurus 由 `url` + `baseUrl` 统一生成 canonical，旧实现的双斜杠 bug 在此自然消失）。若 FAIL，按报告逐条修正。

- [ ] **Step 3: 补 netlify.toml 安全响应头**

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-Frame-Options = "SAMEORIGIN"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

# 演示页需要被正文的 iframe 以同源方式嵌入，
# 上面的 SAMEORIGIN 已经允许，这里单独放宽 CORS 以兼容旧链接的跨源引用。
[[headers]]
  for = "/downloads/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"

[build]
  command = "npm run build"
  publish = "build"
```

- [ ] **Step 4: 提交**

```bash
git add netlify.toml test/checks/seo.js test/verify.js
git commit -m "feat: 校验 canonical 与 sitemap，补齐 Netlify 安全响应头"
```

---

## Task 9: 结构化数据

**Files:**
- Create: `plugins/structuredData.ts`
- Modify: `docusaurus.config.ts`（注册插件、加站点级 JSON-LD）
- Create: `test/checks/jsonld.js`
- Modify: `test/verify.js`

**Interfaces:**
- Consumes: Task 2 的 `SITE_URL`
- Produces: 每个文档页 HTML 中含 `TechArticle` 与 `BreadcrumbList` 两段 `application/ld+json`；首页含 `WebSite`

- [ ] **Step 1: 写检查（先失败）**

创建 `test/checks/jsonld.js`：

```js
'use strict';

function extractJsonLd(html) {
  const out = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      out.push({ __invalid: true });
    }
  }
  return out;
}

module.exports = {
  name: '结构化数据',
  run(ctx) {
    const problems = [];

    if (ctx.exists('index.html')) {
      const types = extractJsonLd(ctx.read('index.html')).map((o) => o['@type']);
      if (!types.includes('WebSite')) problems.push('首页缺 WebSite 结构化数据');
    }

    for (const file of ctx.docHtml().filter((f) => ctx.rel(f).startsWith('docs/'))) {
      const r = ctx.rel(file);
      const blocks = extractJsonLd(ctx.read(r));

      if (blocks.some((b) => b.__invalid)) {
        problems.push(`${r} 含无法解析的 JSON-LD`);
        continue;
      }
      const types = blocks.map((b) => b['@type']);
      if (!types.includes('TechArticle')) problems.push(`${r} 缺 TechArticle`);
      if (!types.includes('BreadcrumbList')) problems.push(`${r} 缺 BreadcrumbList`);

      const article = blocks.find((b) => b['@type'] === 'TechArticle');
      if (article) {
        for (const field of ['headline', 'description', 'inLanguage', 'url']) {
          if (!article[field]) problems.push(`${r} 的 TechArticle 缺 ${field}`);
        }
      }
    }

    return problems;
  },
};
```

在 `test/verify.js` 追加 `require('./checks/jsonld')`。

- [ ] **Step 2: 运行，确认失败**

Run: `npm run build && node test/verify.js`
Expected: FAIL，每个文档页报缺 TechArticle / BreadcrumbList

- [ ] **Step 3: 写 plugins/structuredData.ts**

从构建产物读取，而非从 md 推导。理由与 `llmsTxt` 相同：构建产物里的路径就是真实 URL，title 与 description 已是最终结果，不存在推导偏差。

```ts
import fs from 'fs/promises'
import path from 'path'
import type { Plugin } from '@docusaurus/types'

/**
 * 构建结束后向每个文档页注入 TechArticle 与 BreadcrumbList 结构化数据。
 *
 * ## 为什么在 postBuild 改 HTML，而不是用 Head 组件在渲染期注入
 *
 * 用 <Head> 注入需要在每个页面拿到面包屑层级与最终 URL。这两样东西在组件里
 * 都要自己从路由推导，而推导规则必须复刻 Docusaurus 的 slug 处理（数字前缀剥离、
 * id 覆盖文件名、index 对应目录根），一旦上游改动就会悄悄失效。
 *
 * 构建产物里的目录结构就是真实 URL，title 与 description 也已是最终值，
 * 从这里读不存在推导错误的可能。
 */

const SITE_URL = 'https://front-end-js.top'

/** 目录名 → 面包屑显示名。与 sidebars.ts 的分类标题保持一致。 */
const SECTION_LABELS: Record<string, string> = {
  shapes: '图形',
  styling: '样式',
  events: '事件',
  'drag-and-drop': '拖拽/释放',
  clipping: '剪辑',
  'groups-and-layers': '分组、图层',
  filters: '滤镜',
  tweens: '补间动画',
  animations: '动画',
  selectors: '选择器',
  'data-and-serialization': '数据序列化',
  performance: '性能优化',
}

function decodeEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // & 必须最后处理，否则会把上面几个实体的 & 提前解掉
    .replace(/&amp;/g, '&')
}

function extractTitle(html: string): string {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html)
  if (!m) return ''
  // Docusaurus 的 title 形如「页面标题 | 站点标题」，这里只要页面标题部分。
  return decodeEntities(m[1]).split('|')[0].trim()
}

function extractDescription(html: string): string {
  const m =
    /<meta\s+[^>]*name="description"[^>]*content="([^"]*)"/i.exec(html) ??
    /<meta\s+[^>]*content="([^"]*)"[^>]*name="description"/i.exec(html)
  return m ? decodeEntities(m[1]).trim() : ''
}

async function collectDocPages(dir: string, out: string[] = []): Promise<string[]> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'img') continue
      await collectDocPages(full, out)
    } else if (entry.name === 'index.html') {
      out.push(full)
    }
  }
  return out
}

export default function structuredDataPlugin(): Plugin {
  return {
    name: 'konva-structured-data',
    async postBuild({ outDir }) {
      const docsDir = path.join(outDir, 'docs')
      let pages: string[] = []
      try {
        pages = await collectDocPages(docsDir)
      } catch {
        // docs 目录不存在（例如只构建了首页）时跳过，不使构建失败。
        return
      }

      for (const file of pages) {
        const html = await fs.readFile(file, 'utf8')
        const relDir = path.relative(outDir, path.dirname(file)).split(path.sep).join('/')
        const url = `${SITE_URL}/${relDir}`
        const segments = relDir.split('/') // ['docs', '<section>', '<page>'] 或 ['docs', '<page>']

        const crumbs: { name: string; item: string }[] = [
          { name: '首页', item: SITE_URL },
          { name: '文档', item: `${SITE_URL}/docs/intro` },
        ]
        if (segments.length === 3) {
          const section = segments[1]
          crumbs.push({
            name: SECTION_LABELS[section] ?? section,
            item: `${SITE_URL}/docs/${section}`,
          })
        }
        const title = extractTitle(html)
        const description = extractDescription(html)
        crumbs.push({ name: title, item: url })

        const techArticle = {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: title,
          description,
          url,
          inLanguage: 'zh-Hans',
          isPartOf: {
            '@type': 'WebSite',
            name: 'Konva.js 中文文档',
            url: SITE_URL,
          },
          about: {
            '@type': 'SoftwareSourceCode',
            name: 'Konva',
            codeRepository: 'https://github.com/konvajs/konva',
            programmingLanguage: 'JavaScript',
          },
        }

        const breadcrumb = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: crumbs.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            item: c.item,
          })),
        }

        const injected =
          `<script type="application/ld+json">${JSON.stringify(techArticle)}</script>` +
          `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`

        await fs.writeFile(file, html.replace('</head>', `${injected}</head>`))
      }
    },
  }
}
```

- [ ] **Step 4: 注册插件并加站点级 JSON-LD**

在 `docusaurus.config.ts` 顶部加 import 与站点结构化数据常量：

```ts
import structuredDataPlugin from './plugins/structuredData'

const siteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Konva.js 中文文档',
  alternateName: 'konvajs-zh',
  url: SITE_URL,
  inLanguage: 'zh-Hans',
  description: SITE_DESCRIPTION,
  about: {
    '@type': 'SoftwareSourceCode',
    name: 'Konva',
    codeRepository: 'https://github.com/konvajs/konva',
    programmingLanguage: 'JavaScript',
  },
}
```

在 `config` 对象内加 `plugins`，并在 `headTags` 数组末尾追加站点级 JSON-LD：

```ts
  plugins: [structuredDataPlugin],
```

```ts
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify(siteStructuredData),
    },
```

- [ ] **Step 5: 构建并检查**

Run: `npm run build && node test/verify.js`
Expected: `结构化数据` PASS

- [ ] **Step 6: 提交**

```bash
git add plugins/structuredData.ts docusaurus.config.ts test/checks/jsonld.js test/verify.js
git commit -m "feat: 注入 TechArticle 与 BreadcrumbList 结构化数据"
```

---

## Task 10: llms.txt 与 llms-full.txt

**Files:**
- Create: `plugins/llmsTxt.ts`
- Modify: `docusaurus.config.ts`（注册插件）
- Create: `test/checks/llms.js`
- Modify: `test/verify.js`

**Interfaces:**
- Consumes: Task 2 的构建产物
- Produces: `build/llms.txt`、`build/llms-full.txt`

- [ ] **Step 1: 写检查（先失败）**

创建 `test/checks/llms.js`：

```js
'use strict';

const MIN_ENTRIES = 90;

module.exports = {
  name: 'llms.txt',
  run(ctx) {
    const problems = [];

    if (!ctx.exists('llms.txt')) {
      problems.push('llms.txt 不存在');
      return problems;
    }

    const txt = ctx.read('llms.txt');
    const entries = (txt.match(/^- \[/gm) || []).length;
    if (entries < MIN_ENTRIES) {
      problems.push(`llms.txt 只有 ${entries} 条目，期望至少 ${MIN_ENTRIES} 条`);
    }
    // 条目必须是绝对地址，AI 系统拿到相对路径无法直接抓取。
    const relativeLinks = (txt.match(/^- \[[^\]]*\]\((?!https:\/\/)/gm) || []).length;
    if (relativeLinks > 0) {
      problems.push(`llms.txt 有 ${relativeLinks} 条相对链接，必须使用绝对地址`);
    }
    if (!txt.includes('https://front-end-js.top')) {
      problems.push('llms.txt 中不含本站绝对地址');
    }

    if (!ctx.exists('llms-full.txt')) {
      problems.push('llms-full.txt 不存在');
    } else if (ctx.read('llms-full.txt').length < 10000) {
      problems.push('llms-full.txt 内容过少，正文可能未写入');
    }

    return problems;
  },
};
```

在 `test/verify.js` 追加 `require('./checks/llms')`。

- [ ] **Step 2: 运行，确认失败**

Run: `npm run build && node test/verify.js`
Expected: FAIL，`llms.txt 不存在`

- [ ] **Step 3: 写 plugins/llmsTxt.ts**

```ts
import fs from 'fs/promises'
import path from 'path'
import type { Plugin } from '@docusaurus/types'

/**
 * 构建结束后生成 /llms.txt 与 /llms-full.txt。
 *
 * ## 这两个文件是做什么的
 *
 * llms.txt 是面向大模型的站点地图约定（llmstxt.org）。sitemap.xml 只有 URL，
 * AI 系统要判断某页讲什么必须逐个抓取；llms.txt 用 Markdown 把「有哪些页面、
 * 每页讲什么」一次讲清楚，让 AI 在检索阶段就能定位到正确的页面。
 * llms-full.txt 进一步把核心页面的正文直接摊平，供不便逐页抓取的场景使用。
 *
 * ## 为什么从构建产物读，而不是从 docs 目录读
 *
 * 直接读 docs/*.md 的 frontmatter 看起来更直接，但那样就得自己复刻 Docusaurus
 * 的 slug 规则——目录名数字前缀要剥掉、id 字段会覆盖文件名、index 文件对应目录根。
 * 这套规则重写一遍必然与上游产生偏差，且 Docusaurus 升级时会悄悄失效。
 *
 * 构建产物里的 HTML 路径就是真实 URL，title 与 description 也已是最终结果。
 * 代价是本插件只在 postBuild 阶段运行，开发服务器上访问不到这两个文件。
 */

const SITE_URL = 'https://front-end-js.top'

/** 分区顺序与标题。未列出的路径归到「其他」。 */
const SECTIONS: { prefix: string; title: string }[] = [
  { prefix: '/docs/intro', title: '开始' },
  { prefix: '/docs/overview', title: '概览' },
  { prefix: '/docs/shapes', title: '图形' },
  { prefix: '/docs/styling', title: '样式' },
  { prefix: '/docs/events', title: '事件' },
  { prefix: '/docs/drag-and-drop', title: '拖拽与释放' },
  { prefix: '/docs/clipping', title: '剪辑' },
  { prefix: '/docs/groups-and-layers', title: '分组与图层' },
  { prefix: '/docs/filters', title: '滤镜' },
  { prefix: '/docs/tweens', title: '补间动画' },
  { prefix: '/docs/animations', title: '动画' },
  { prefix: '/docs/selectors', title: '选择器' },
  { prefix: '/docs/data-and-serialization', title: '数据与序列化' },
  { prefix: '/docs/performance', title: '性能优化' },
  { prefix: '/docs/support', title: '帮助' },
]

/** llms-full.txt 只收录这些分区的正文，避免文件过大。 */
const FULL_TEXT_PREFIXES = ['/docs/shapes', '/docs/performance', '/docs/events']

type PageEntry = { url: string; pathname: string; title: string; description: string; body: string }

function decodeEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // & 必须最后处理，否则会把上面几个实体的 & 提前解掉
    .replace(/&amp;/g, '&')
}

function extractTitle(html: string): string {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html)
  if (!m) return ''
  return decodeEntities(m[1]).split('|')[0].trim()
}

function extractDescription(html: string): string {
  const m =
    /<meta\s+[^>]*name="description"[^>]*content="([^"]*)"/i.exec(html) ??
    /<meta\s+[^>]*content="([^"]*)"[^>]*name="description"/i.exec(html)
  return m ? decodeEntities(m[1]).trim() : ''
}

/** 从 HTML 中取正文纯文本。只用于 llms-full.txt，不要求保真到 Markdown。 */
function extractBody(html: string): string {
  const article = /<article[^>]*>([\s\S]*?)<\/article>/i.exec(html)
  const source = article ? article[1] : html
  return decodeEntities(
    source
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function collectHtmlFiles(dir: string, out: string[] = []): Promise<string[]> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'img' || entry.name === 'downloads') continue
      await collectHtmlFiles(full, out)
    } else if (entry.name === 'index.html') {
      out.push(full)
    }
  }
  return out
}

export default function llmsTxtPlugin(): Plugin {
  return {
    name: 'konva-llms-txt',
    async postBuild({ outDir }) {
      const files = await collectHtmlFiles(outDir)
      const pages: PageEntry[] = []

      for (const file of files) {
        const relDir = path.relative(outDir, path.dirname(file)).split(path.sep).join('/')
        const pathname = relDir === '' ? '/' : `/${relDir}`
        if (pathname === '/404' || pathname.startsWith('/search')) continue

        const html = await fs.readFile(file, 'utf8')
        const title = extractTitle(html)
        if (!title) continue

        pages.push({
          url: `${SITE_URL}${pathname === '/' ? '' : pathname}`,
          pathname,
          title,
          description: extractDescription(html),
          body: extractBody(html),
        })
      }

      // --- llms.txt ---
      const lines: string[] = [
        '# Konva.js 中文文档',
        '',
        '> Konva 是基于 HTML5 Canvas 的 2D JavaScript 框架，支持图形绘制、事件、拖拽、变换、动画、滤镜与高性能缓存。本站是 Konva 官方文档的中文翻译。',
        '',
        `站点：${SITE_URL}`,
        '官方英文文档：https://konvajs.org/',
        '',
      ]

      const used = new Set<string>()
      for (const section of SECTIONS) {
        const matched = pages
          .filter((p) => !used.has(p.pathname) && p.pathname.startsWith(section.prefix))
          .sort((a, b) => a.pathname.localeCompare(b.pathname))
        if (matched.length === 0) continue
        lines.push(`## ${section.title}`, '')
        for (const p of matched) {
          used.add(p.pathname)
          lines.push(p.description ? `- [${p.title}](${p.url})：${p.description}` : `- [${p.title}](${p.url})`)
        }
        lines.push('')
      }

      const rest = pages.filter((p) => !used.has(p.pathname))
      if (rest.length > 0) {
        lines.push('## 其他', '')
        for (const p of rest.sort((a, b) => a.pathname.localeCompare(b.pathname))) {
          lines.push(p.description ? `- [${p.title}](${p.url})：${p.description}` : `- [${p.title}](${p.url})`)
        }
        lines.push('')
      }

      await fs.writeFile(path.join(outDir, 'llms.txt'), lines.join('\n'))

      // --- llms-full.txt ---
      const fullPages = pages
        .filter((p) => FULL_TEXT_PREFIXES.some((prefix) => p.pathname.startsWith(prefix)))
        .sort((a, b) => a.pathname.localeCompare(b.pathname))

      const fullLines: string[] = ['# Konva.js 中文文档 · 全文', '']
      for (const p of fullPages) {
        fullLines.push(`## ${p.title}`, '', `来源：${p.url}`, '', p.body, '', '---', '')
      }
      await fs.writeFile(path.join(outDir, 'llms-full.txt'), fullLines.join('\n'))

      console.log(`llms.txt：${pages.length} 页；llms-full.txt：${fullPages.length} 页全文`)
    },
  }
}
```

- [ ] **Step 4: 注册插件**

在 `docusaurus.config.ts` 加 import 并扩充 `plugins`：

```ts
import llmsTxtPlugin from './plugins/llmsTxt'
```

```ts
  plugins: [structuredDataPlugin, llmsTxtPlugin],
```

- [ ] **Step 5: 构建并检查**

Run: `npm run build && node test/verify.js`
Expected: `llms.txt` PASS

- [ ] **Step 6: 提交**

```bash
git add plugins/llmsTxt.ts docusaurus.config.ts test/checks/llms.js test/verify.js
git commit -m "feat: 生成 llms.txt 与 llms-full.txt"
```

---

## Task 11: 分析接入与凭据占位

规格 §6.6 的三项凭据由站点所有者提供。本任务把代码写完、检查器写完，凭据未到位时输出警告而不阻断。

**Files:**
- Create: `src/config/analytics.ts`
- Modify: `docusaurus.config.ts`
- Create: `test/checks/analytics.js`
- Modify: `test/verify.js`
- Modify: `package.json`（安装 `@docusaurus/plugin-google-gtag`）

**Interfaces:**
- Consumes: Task 2 的 `docusaurus.config.ts`
- Produces: `src/config/analytics.ts` 导出 `GA4_MEASUREMENT_ID`、`GSC_VERIFICATION_TOKEN`、`BAIDU_VERIFICATION_TOKEN`、`isConfigured(value: string): boolean`

- [ ] **Step 1: 写 src/config/analytics.ts**

```ts
/**
 * 站点分析与站长验证凭据。
 *
 * 这三个值由站点所有者从各平台后台获取。占位值保持原样时，站点仍可正常构建与
 * 上线，只是不会上报数据、不会通过站长验证。verify 会以警告形式提示，
 * 但不阻断构建——凭据缺失不应挡住内容更新的发布。
 *
 * 拿到真值后只改这个文件，不需要动 docusaurus.config.ts。
 */

/** Google Analytics 4 衡量 ID，形如 G-XXXXXXXXXX。 */
export const GA4_MEASUREMENT_ID = 'G-PLACEHOLDER'

/** Google Search Console 的 HTML 标记验证 token（meta 标签的 content 值）。 */
export const GSC_VERIFICATION_TOKEN = 'GSC-PLACEHOLDER'

/** 百度站长平台的验证 token。留空表示不接入。 */
export const BAIDU_VERIFICATION_TOKEN = ''

/** 判断某个凭据是否已经填入真值。 */
export function isConfigured(value: string): boolean {
  return value.length > 0 && !value.includes('PLACEHOLDER')
}
```

- [ ] **Step 2: 写检查**

创建 `test/checks/analytics.js`。注意本检查器返回的是 `problems`，而 verify 驱动会把它们当失败。为实现「警告不阻断」，检查器在凭据未配置时只 `console.log` 提示并返回空数组；只有当凭据**已配置但未生效**时才返回问题——那才是真正的 bug。

```js
'use strict';

module.exports = {
  name: '分析与站长验证',
  run(ctx) {
    const problems = [];
    const cfg = ctx.readRoot('src/config/analytics.ts');

    const ga = /GA4_MEASUREMENT_ID = '([^']*)'/.exec(cfg)?.[1] ?? '';
    const gsc = /GSC_VERIFICATION_TOKEN = '([^']*)'/.exec(cfg)?.[1] ?? '';
    const baidu = /BAIDU_VERIFICATION_TOKEN = '([^']*)'/.exec(cfg)?.[1] ?? '';

    const configured = (v) => v.length > 0 && !v.includes('PLACEHOLDER');
    const home = ctx.exists('index.html') ? ctx.read('index.html') : '';

    if (!configured(ga)) {
      console.log('          提示：GA4_MEASUREMENT_ID 仍为占位值，站点未接入流量分析');
    } else if (!home.includes(ga)) {
      // 已经填了真 ID 却没出现在 HTML 里，说明接线断了，这是 bug。
      problems.push(`GA4 ID ${ga} 已配置但未出现在首页 HTML 中`);
    }

    if (!configured(gsc)) {
      console.log('          提示：GSC_VERIFICATION_TOKEN 仍为占位值，未通过站长验证');
    } else if (!home.includes(gsc)) {
      problems.push('GSC 验证 token 已配置但未出现在首页 HTML 中');
    }

    if (configured(baidu) && !home.includes(baidu)) {
      problems.push('百度验证 token 已配置但未出现在首页 HTML 中');
    }

    return problems;
  },
};
```

在 `test/verify.js` 追加 `require('./checks/analytics')`。

- [ ] **Step 3: 接线 docusaurus.config.ts**

`@docusaurus/plugin-google-gtag` 已包含在 `preset-classic` 中，无需单独安装，
直接用 preset 的 `gtag` 选项即可。

在配置顶部加 import：

```ts
import {
  GA4_MEASUREMENT_ID,
  GSC_VERIFICATION_TOKEN,
  BAIDU_VERIFICATION_TOKEN,
  isConfigured,
} from './src/config/analytics'
```

在 `presets` 的 `classic` 选项中加 `gtag`（仅在已配置时启用，否则 Docusaurus 会因为无效 ID 报错）：

```ts
        gtag: isConfigured(GA4_MEASUREMENT_ID)
          ? { trackingID: GA4_MEASUREMENT_ID, anonymizeIP: true }
          : undefined,
```

在 `headTags` 数组末尾追加验证 meta（用展开语法，未配置时不产生空标签）：

```ts
    ...(isConfigured(GSC_VERIFICATION_TOKEN)
      ? [
          {
            tagName: 'meta',
            attributes: { name: 'google-site-verification', content: GSC_VERIFICATION_TOKEN },
          },
        ]
      : []),
    ...(isConfigured(BAIDU_VERIFICATION_TOKEN)
      ? [
          {
            tagName: 'meta',
            attributes: { name: 'baidu-site-verification', content: BAIDU_VERIFICATION_TOKEN },
          },
        ]
      : []),
```

- [ ] **Step 4: 构建并检查**

Run: `npm run build && node test/verify.js`
Expected: `分析与站长验证` PASS，并打印两条占位提示

- [ ] **Step 5: 提交**

```bash
git add src/config/analytics.ts docusaurus.config.ts test/checks/analytics.js test/verify.js
git commit -m "feat: 接入 GA4 与站长验证，凭据以占位常量承载

凭据未配置时站点照常构建上线，verify 输出提示但不阻断；
已配置却未生效则判为失败。"
```

---

## Task 12: 收尾与全量验收

**Files:**
- Modify: `README.md`
- Modify: `package.json`（`check` 脚本补 audit）
- Modify: `.gitignore`
- Modify: `test/verify.js`（确认检查器齐全）

**Interfaces:**
- Consumes: Task 1–11 全部产物
- Produces: `npm run check` 一条命令完成全量验收

- [ ] **Step 1: 更新 .gitignore**

```
node_modules
/build
/.docusaurus
.DS_Store
.history
```

（原文件中的 `/dist`、`.dumi/tmp`、`.dumi/tmp-production`、`server` 均为 dumi 遗留，删除。）

- [ ] **Step 2: 确认 test/verify.js 的检查器数组完整**

```js
const checks = [
  require('./checks/build-sanity'),
  require('./checks/deps'),
  require('./checks/metadata'),
  require('./checks/redirects'),
  require('./checks/robots'),
  require('./checks/ads'),
  require('./checks/ad-placement'),
  require('./checks/seo'),
  require('./checks/jsonld'),
  require('./checks/llms'),
  require('./checks/analytics'),
];
```

- [ ] **Step 3: 重写 README.md**

```markdown
# Konva.js 中文文档

Konva 官方文档的中文翻译。线上地址：https://front-end-js.top

## 开发

```bash
npm install
npm start          # 开发服务器
npm run build      # 生产构建，输出到 build/
npm run serve      # 本地预览构建产物
```

## 验收

```bash
npm run check      # typecheck + build + verify
npm run verify     # 仅跑检查器（需先 build）
```

`test/checks/` 下每个文件是一个检查器，导出 `{ name, run(ctx) }`，返回问题字符串数组。
新增检查后需在 `test/verify.js` 的 `checks` 数组中注册。

## 需要配置的凭据

`src/config/analytics.ts` 中的三个常量默认是占位值，站点可正常构建上线，
填入真值后自动生效：

- `GA4_MEASUREMENT_ID` — Google Analytics 4
- `GSC_VERIFICATION_TOKEN` — Google Search Console
- `BAIDU_VERIFICATION_TOKEN` — 百度站长平台（可选）

## 不要改动的值

- `src/config/ads.ts` 的 `AD_CLIENT`：改动会断掉 `static/ads.txt` 的账号关联
- `static/ads.txt`：内容需与 AdSense 后台一致
- `src/components/Ad/` 下不得引入 `setInterval` / `setTimeout`：定时刷新广告违反 AdSense 版位政策

## 设计与计划

- 设计：`specs/2026-09-18-konvajs-site-overhaul-design.md`
- 计划：`plans/2026-09-21-p1-infrastructure.md`

## LICENSE

MIT。本站为 Konva 官方文档的中文翻译，内容版权归原作者所有。
```

- [ ] **Step 4: package.json 的 check 补 audit**

```json
    "check": "npm run typecheck && npm audit --audit-level=moderate && npm run build && npm run verify"
```

- [ ] **Step 5: 全量验收**

Run: `npm run check`
Expected: typecheck 通过、audit 0 高危 0 中危、build 成功、11 个检查器全部 PASS

若 audit 报出无补丁的传递依赖中危告警，**如实记录版本与告警内容并向站点所有者报告**，不得擅自放宽 `--audit-level` 或加豁免。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "chore: 收尾与全量验收

npm run check 一条命令完成 typecheck、audit、build、verify。
README 记录凭据配置位置与三条不可改动的约束。"
```

---

## 计划自审

**规格覆盖核对：**

| 规格章节 | 对应 Task |
|---|---|
| §3.1 技术选型 | Task 2 |
| §3.2 废弃与保留 | Task 2 Step 10、Task 3 Step 4 |
| §3.3 目录结构 | Task 2、Task 3 |
| §4 内容对齐 | Task 3（机械迁移与 description）；§4.2 的 10.5.0 对齐与 §4.4 原创增量段属**计划 2**，不在本计划 |
| §5.1–5.2 广告移植与配置 | Task 6 |
| §5.3 SPA 换页重建 | Task 6 Step 4、Task 7 Step 7 |
| §5.4 继承行为 | Task 6 Step 4（随组件移植） |
| §5.5 挂载点 | Task 7 |
| §6.1 SSG | Task 1 Step 2、Task 2 |
| §6.2 robots | Task 5 |
| §6.3 llms.txt | Task 10 |
| §6.4 结构化数据 | Task 9（`FAQPage` 依赖 §4.4 的「常见问题」小节，属计划 2） |
| §6.5 canonical / sitemap / 安全头 | Task 8 |
| §6.6 凭据 | Task 11 |
| §7 URL 与 301 | Task 3（新路径）、Task 4（301） |
| §8 依赖与安全 | Task 2 Step 1、Task 12 Step 4 |
| §9 验收脚本 | Task 1 起逐任务累加，Task 12 汇总 |

**未在本计划覆盖、明确留给后续计划的规格条目：**

- §4.2 Konva 9→10 破坏性变更的逐页排查 → 计划 2
- §4.4 原创增量段与 `check-originality.js` → 计划 2
- §6.4 的 `FAQPage`（依赖 §4.4 的小节结构）→ 计划 2
- §4.3 的 C2–C6 共 183 页 → 计划 3 及以后

**类型一致性核对：**`AdPlacementName` 的三个字面量在 `ads.ts`、`AdUnit.tsx`、`Content/index.tsx`、`TOC/Desktop/index.tsx`、`test/checks/ads.js` 中拼写一致（`inArticle`、`articleBottom`、`tocSidebar`）。`ctx` 的方法名在 Task 1 定义后，Task 2–11 的检查器均只使用已定义方法。`SITE_URL` 常量值 `https://front-end-js.top` 在 `docusaurus.config.ts`、`plugins/structuredData.ts`、`plugins/llmsTxt.ts`、`test/checks/seo.js`、`test/checks/robots.js` 中一致。
